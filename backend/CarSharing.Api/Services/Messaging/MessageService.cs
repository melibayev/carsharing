using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Messaging;

public class MessageService : IMessageService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;
    private readonly IPhotoStorage _photoStorage;

    public MessageService(AppDbContext db, IMapper mapper, IPhotoStorage photoStorage)
    {
        _db = db;
        _mapper = mapper;
        _photoStorage = photoStorage;
    }

    // ── helper: resolve admin IDs ───────────────────────────────────────────────
    private async Task<HashSet<Guid>> GetAdminUserIdsAsync()
    {
        var adminRole = await _db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN");
        if (adminRole == null) return new HashSet<Guid>();
        return (await _db.UserRoles.Where(ur => ur.RoleId == adminRole.Id).Select(ur => ur.UserId).ToListAsync()).ToHashSet();
    }

    // ── helper: resolve a conversation by bookingId OR conversationId ───────────
    private async Task<Conversation?> FindConversationAsync(Guid id)
    {
        // Try as bookingId first (existing flow)
        var conv = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Photos)
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Owner)
            .Include(c => c.Booking).ThenInclude(b => b!.Guest)
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.BookingId == id);

        // Fall back to conversationId (direct/support conversations)
        conv ??= await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Photos)
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Owner)
            .Include(c => c.Booking).ThenInclude(b => b!.Guest)
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c => c.Id == id);

        return conv;
    }

    // ── helper: check user is a participant in a conversation ──────────────────
    private static bool IsParticipant(Conversation c, Guid userId)
    {
        if (c.BookingId.HasValue)
            return c.Booking?.GuestId == userId || c.Booking?.Car?.OwnerId == userId;
        return c.Participant1Id == userId || c.Participant2Id == userId;
    }

    // ── helper: get the "other party" in a conversation ────────────────────────
    private static ApplicationUser? GetOtherParty(Conversation c, Guid userId)
    {
        if (c.BookingId.HasValue)
        {
            return c.Booking?.GuestId == userId ? c.Booking?.Car?.Owner : c.Booking?.Guest;
        }
        return c.Participant1Id == userId ? c.Participant2 : c.Participant1;
    }

    // ── build ConversationDto ───────────────────────────────────────────────────
    private ConversationDto BuildConversationDto(Conversation c, Guid userId, HashSet<Guid> adminUserIds,
        Dictionary<Guid, UserConversationState>? states = null)
    {
        var otherParty = GetOtherParty(c, userId);
        var lastMsg = c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();
        var unreadCount = _db.Messages.Count(m =>
            m.ConversationId == c.Id && m.SenderId != userId && m.ReadAt == null && !m.Sender.IsSystemUser);

        var otherPartyDto = _mapper.Map<UserPublicDto>(otherParty);
        if (otherPartyDto != null && otherParty != null)
            otherPartyDto.IsAdmin = adminUserIds.Contains(otherParty.Id);

        string? carTitle = c.BookingId.HasValue && c.Booking?.Car != null
            ? $"{c.Booking.Car.Year} {c.Booking.Car.Make} {c.Booking.Car.Model}"
            : null;

        string? coverPhotoUrl = c.BookingId.HasValue
            ? c.Booking?.Car?.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()
            : null;

        var isArchived = states != null && states.TryGetValue(c.Id, out var st) && st.IsArchived;

        return new ConversationDto
        {
            Id = c.Id,
            BookingId = c.BookingId,
            CarTitle = carTitle,
            CoverPhotoUrl = coverPhotoUrl,
            OtherParty = otherPartyDto,
            LastMessage = lastMsg != null ? BuildMessageDto(lastMsg, c.Booking) : null,
            UnreadCount = unreadCount,
            IsArchived = isArchived,
        };
    }

    // ── GetConversationsAsync ───────────────────────────────────────────────────
    public async Task<List<ConversationDto>> GetConversationsAsync(Guid userId, bool includeArchived = false)
    {
        var adminUserIds = await GetAdminUserIdsAsync();

        // Booking-based conversations
        var bookingConvs = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Photos)
            .Include(c => c.Booking).ThenInclude(b => b!.Car).ThenInclude(car => car!.Owner)
            .Include(c => c.Booking).ThenInclude(b => b!.Guest)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1)).ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .Where(c => c.BookingId != null && (c.Booking!.GuestId == userId || c.Booking.Car!.OwnerId == userId))
            .ToListAsync();

        // Direct (support) conversations
        var directConvs = await _db.Conversations
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1)).ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .Where(c => c.BookingId == null && (c.Participant1Id == userId || c.Participant2Id == userId))
            .ToListAsync();

        var all = bookingConvs.Concat(directConvs).ToList();

        // Load per-user conversation states (archive/delete)
        var convIds = all.Select(c => c.Id).ToList();
        var states = await _db.UserConversationStates
            .Where(s => s.UserId == userId && convIds.Contains(s.ConversationId))
            .ToDictionaryAsync(s => s.ConversationId);

        // Restore deleted conversations that have received new messages since deletion
        var statesToSave = new List<UserConversationState>();
        foreach (var c in all)
        {
            if (!states.TryGetValue(c.Id, out var st) || !st.DeletedAt.HasValue) continue;
            var lastMsg = c.Messages.Max(m => (DateTimeOffset?)m.SentAt);
            if (lastMsg.HasValue && lastMsg.Value > st.DeletedAt.Value)
            {
                st.DeletedAt = null;  // new message arrived — undelete
                statesToSave.Add(st);
            }
        }
        if (statesToSave.Count > 0)
            await _db.SaveChangesAsync();

        // Filter deleted and (optionally) archived
        all = all.Where(c =>
        {
            if (!states.TryGetValue(c.Id, out var st)) return true;
            if (st.DeletedAt.HasValue) return false;
            if (!includeArchived && st.IsArchived) return false;
            return true;
        })
        .OrderByDescending(c => c.Messages.Max(m => (DateTimeOffset?)m.SentAt) ?? c.CreatedAt)
        .ToList();

        return all.Select(c => BuildConversationDto(c, userId, adminUserIds, states)).ToList();
    }

    // ── ArchiveConversationAsync ────────────────────────────────────────────────
    public async Task ArchiveConversationAsync(Guid userId, Guid conversationId, bool archive)
    {
        var state = await _db.UserConversationStates
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ConversationId == conversationId);

        if (state == null)
        {
            state = new UserConversationState { UserId = userId, ConversationId = conversationId };
            _db.UserConversationStates.Add(state);
        }

        state.IsArchived = archive;
        await _db.SaveChangesAsync();
    }

    // ── DeleteConversationAsync ─────────────────────────────────────────────────
    public async Task DeleteConversationAsync(Guid userId, Guid conversationId)
    {
        var state = await _db.UserConversationStates
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ConversationId == conversationId);

        if (state == null)
        {
            state = new UserConversationState { UserId = userId, ConversationId = conversationId };
            _db.UserConversationStates.Add(state);
        }

        state.DeletedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    // ── GetMessagesAsync ────────────────────────────────────────────────────────
    public async Task<List<MessageDto>> GetMessagesAsync(Guid id, Guid userId, DateTimeOffset? before = null)
    {
        var conversation = await FindConversationAsync(id)
            ?? throw new KeyNotFoundException("Conversation not found.");

        if (!IsParticipant(conversation, userId))
            throw new UnauthorizedAccessException("Not authorized.");

        var query = _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
            .Where(m => m.ConversationId == conversation.Id);

        if (before.HasValue)
            query = query.Where(m => m.SentAt < before.Value);

        var messages = await query.OrderByDescending(m => m.SentAt).Take(50).ToListAsync();
        messages.Reverse();

        return messages.Select(m => BuildMessageDto(m, conversation.Booking)).ToList();
    }

    // ── SendMessageAsync ────────────────────────────────────────────────────────
    public async Task<MessageDto> SendMessageAsync(Guid id, Guid senderId, string body, Guid? replyToMessageId = null)
    {
        var conversation = await FindConversationAsync(id);

        if (conversation == null)
        {
            // Only booking-based conversations can be auto-created
            var booking = await _db.Bookings.Include(b => b.Car)
                .FirstOrDefaultAsync(b => b.Id == id)
                ?? throw new KeyNotFoundException("Booking or conversation not found.");

            conversation = new Conversation { BookingId = id };
            _db.Conversations.Add(conversation);
            await _db.SaveChangesAsync();

            // Reload with navigation properties
            conversation = await FindConversationAsync(id)
                ?? throw new KeyNotFoundException("Conversation could not be created.");
        }

        if (!IsParticipant(conversation, senderId))
            throw new UnauthorizedAccessException("Not authorized.");

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = senderId,
            Body = body,
            SentAt = DateTimeOffset.UtcNow,
            ReplyToMessageId = replyToMessageId,
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var saved = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.ReplyToMessage).ThenInclude(r => r!.Sender)
            .FirstAsync(m => m.Id == message.Id);
        return BuildMessageDto(saved, conversation.Booking);
    }

    // ── SendImageMessageAsync ────────────────────────────────────────────────────
    public async Task<MessageDto> SendImageMessageAsync(Guid id, Guid senderId, IFormFile file)
    {
        var conversation = await FindConversationAsync(id);

        if (conversation == null)
        {
            var booking = await _db.Bookings.Include(b => b.Car)
                .FirstOrDefaultAsync(b => b.Id == id)
                ?? throw new KeyNotFoundException("Booking or conversation not found.");

            conversation = new Conversation { BookingId = id };
            _db.Conversations.Add(conversation);
            await _db.SaveChangesAsync();

            conversation = await FindConversationAsync(id)
                ?? throw new KeyNotFoundException("Conversation could not be created.");
        }

        if (!IsParticipant(conversation, senderId))
            throw new UnauthorizedAccessException("Not authorized.");

        await using var stream = file.OpenReadStream();
        var uploadResult = await _photoStorage.UploadAsync(stream, file.FileName, "messages");

        var message = new Message
        {
            ConversationId = conversation.Id,
            SenderId = senderId,
            Type = MessageType.Image,
            AttachmentUrl = uploadResult.Url,
            SentAt = DateTimeOffset.UtcNow,
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        var saved = await _db.Messages.Include(m => m.Sender).FirstAsync(m => m.Id == message.Id);
        return BuildMessageDto(saved, conversation.Booking);
    }

    // ── MarkConversationReadByBookingAsync ──────────────────────────────────────
    public async Task MarkConversationReadByBookingAsync(Guid id, Guid userId)
    {
        var conversation = await _db.Conversations
            .FirstOrDefaultAsync(c => c.BookingId == id || c.Id == id);
        if (conversation == null) return;
        await MarkAsReadAsync(conversation.Id, userId);
    }

    // ── GetTotalUnreadCountAsync ────────────────────────────────────────────────
    public async Task<int> GetTotalUnreadCountAsync(Guid userId)
    {
        return await _db.Messages
            .Include(m => m.Sender)
            .Where(m =>
                m.SenderId != userId &&
                !m.Sender.IsSystemUser &&
                m.ReadAt == null &&
                _db.Conversations.Any(c =>
                    c.Id == m.ConversationId &&
                    (
                        (c.BookingId != null && (c.Booking!.GuestId == userId || c.Booking.Car!.OwnerId == userId)) ||
                        (c.BookingId == null && (c.Participant1Id == userId || c.Participant2Id == userId))
                    )))
            .CountAsync();
    }

    // ── MarkAsReadAsync ─────────────────────────────────────────────────────────
    public async Task MarkAsReadAsync(Guid conversationId, Guid userId)
    {
        var unread = await _db.Messages
            .Where(m => m.ConversationId == conversationId && m.SenderId != userId && m.ReadAt == null)
            .ToListAsync();

        foreach (var msg in unread)
            msg.ReadAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
    }

    // ── GetOrCreateSupportConversationAsync ─────────────────────────────────────
    public async Task<ConversationDto> GetOrCreateSupportConversationAsync(Guid userId)
    {
        // Find the admin user
        var adminRole = await _db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN")
            ?? throw new InvalidOperationException("Admin role not found.");
        var adminUserId = await _db.UserRoles
            .Where(ur => ur.RoleId == adminRole.Id)
            .Select(ur => ur.UserId)
            .FirstOrDefaultAsync();
        if (adminUserId == Guid.Empty)
            throw new InvalidOperationException("No admin user found.");

        // Find existing direct conversation between user and admin
        var existing = await _db.Conversations
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1)).ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .FirstOrDefaultAsync(c =>
                c.BookingId == null &&
                ((c.Participant1Id == userId && c.Participant2Id == adminUserId) ||
                 (c.Participant1Id == adminUserId && c.Participant2Id == userId)));

        if (existing != null)
        {
            var adminIds = await GetAdminUserIdsAsync();
            return BuildConversationDto(existing, userId, adminIds);
        }

        // Create a new support conversation
        var newConv = new Conversation
        {
            Participant1Id = userId,
            Participant2Id = adminUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        _db.Conversations.Add(newConv);
        await _db.SaveChangesAsync();

        // Send a welcome message from the admin automatically
        var welcome = new Message
        {
            ConversationId = newConv.Id,
            SenderId = adminUserId,
            Body = "Hi! 👋 Welcome to CarSharing Support. How can we help you today?",
            Type = MessageType.Text,
            SentAt = DateTimeOffset.UtcNow,
        };
        _db.Messages.Add(welcome);
        await _db.SaveChangesAsync();

        // Reload with includes
        var created = await _db.Conversations
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1)).ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .FirstAsync(c => c.Id == newConv.Id);

        var adminIdsForDto = await GetAdminUserIdsAsync();
        return BuildConversationDto(created, userId, adminIdsForDto);
    }

    // ── EditMessageAsync ────────────────────────────────────────────────────────
    public async Task<MessageDto> EditMessageAsync(Guid messageId, Guid userId, string newBody)
    {
        var msg = await _db.Messages
            .Include(m => m.Sender)
            .Include(m => m.Conversation).ThenInclude(c => c.Booking).ThenInclude(b => b!.Car)
            .FirstOrDefaultAsync(m => m.Id == messageId)
            ?? throw new KeyNotFoundException("Message not found.");

        if (msg.SenderId != userId)
            throw new UnauthorizedAccessException("You can only edit your own messages.");

        if (msg.IsDeleted)
            throw new InvalidOperationException("Cannot edit a deleted message.");

        if (msg.Type != MessageType.Text)
            throw new InvalidOperationException("Only text messages can be edited.");

        msg.Body = newBody.Trim();
        msg.EditedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return BuildMessageDto(msg, msg.Conversation?.Booking);
    }

    // ── DeleteMessageAsync ──────────────────────────────────────────────────────
    public async Task DeleteMessageAsync(Guid messageId, Guid userId)
    {
        var msg = await _db.Messages
            .FirstOrDefaultAsync(m => m.Id == messageId)
            ?? throw new KeyNotFoundException("Message not found.");

        if (msg.SenderId != userId)
            throw new UnauthorizedAccessException("You can only delete your own messages.");

        msg.IsDeleted = true;
        msg.Body = null;
        msg.AttachmentUrl = null;
        await _db.SaveChangesAsync();
    }

    // ── BuildMessageDto ─────────────────────────────────────────────────────────
    private MessageDto BuildMessageDto(Message msg, Booking? booking)
    {
        var dto = _mapper.Map<MessageDto>(msg);
        dto.EditedAt = msg.EditedAt;
        dto.IsDeleted = msg.IsDeleted;

        // Reply preview
        if (msg.ReplyToMessage != null)
        {
            var r = msg.ReplyToMessage;
            dto.ReplyToMessageId = r.Id;
            dto.ReplyToSenderName = r.Sender != null
                ? $"{r.Sender.FirstName} {r.Sender.LastName}".Trim()
                : "User";
            dto.ReplyToType = r.Type.ToString();
            dto.ReplyToBody = r.IsDeleted ? null : r.Body;
            dto.ReplyToAttachmentUrl = r.IsDeleted ? null : r.AttachmentUrl;
        }

        if (msg.Type == MessageType.BookingCard && booking != null)
        {
            var car = booking.Car;
            dto.BookingPreview = new BookingPreviewDto
            {
                BookingId = booking.Id,
                CarTitle = car != null ? $"{car.Year} {car.Make} {car.Model}" : "",
                CarPhotoUrl = car?.Photos?.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()
                              ?? car?.Photos?.OrderBy(p => p.SortOrder).Select(p => p.Url).FirstOrDefault(),
                City = car?.City ?? "",
                Seats = car?.Seats ?? 5,
                FuelType = car?.FuelType.ToString() ?? "",
                StartUtc = booking.StartUtc,
                EndUtc = booking.EndUtc,
                TotalUsd = booking.TotalChargedUsd,
                Status = booking.Status.ToString(),
                Days = booking.Days,
            };
        }

        return dto;
    }
}

