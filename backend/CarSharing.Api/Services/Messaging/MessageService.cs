using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Messaging;

public class MessageService : IMessageService
{
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public MessageService(AppDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
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
    private ConversationDto BuildConversationDto(Conversation c, Guid userId, HashSet<Guid> adminUserIds)
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

        return new ConversationDto
        {
            Id = c.Id,
            BookingId = c.BookingId,
            CarTitle = carTitle,
            CoverPhotoUrl = coverPhotoUrl,
            OtherParty = otherPartyDto,
            LastMessage = lastMsg != null ? BuildMessageDto(lastMsg, c.Booking) : null,
            UnreadCount = unreadCount,
        };
    }

    // ── GetConversationsAsync ───────────────────────────────────────────────────
    public async Task<List<ConversationDto>> GetConversationsAsync(Guid userId)
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

        var all = bookingConvs.Concat(directConvs)
            .OrderByDescending(c => c.Messages.Max(m => (DateTimeOffset?)m.SentAt) ?? c.CreatedAt)
            .ToList();

        return all.Select(c => BuildConversationDto(c, userId, adminUserIds)).ToList();
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
            .Where(m => m.ConversationId == conversation.Id);

        if (before.HasValue)
            query = query.Where(m => m.SentAt < before.Value);

        var messages = await query.OrderByDescending(m => m.SentAt).Take(50).ToListAsync();
        messages.Reverse();

        return messages.Select(m => BuildMessageDto(m, conversation.Booking)).ToList();
    }

    // ── SendMessageAsync ────────────────────────────────────────────────────────
    public async Task<MessageDto> SendMessageAsync(Guid id, Guid senderId, string body)
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
            SentAt = DateTimeOffset.UtcNow
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

        // Reload with includes
        var created = await _db.Conversations
            .Include(c => c.Participant1)
            .Include(c => c.Participant2)
            .FirstAsync(c => c.Id == newConv.Id);

        var adminIdsForDto = await GetAdminUserIdsAsync();
        return BuildConversationDto(created, userId, adminIdsForDto);
    }

    // ── BuildMessageDto ─────────────────────────────────────────────────────────
    private MessageDto BuildMessageDto(Message msg, Booking? booking)
    {
        var dto = _mapper.Map<MessageDto>(msg);

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

