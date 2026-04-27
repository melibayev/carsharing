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

    public async Task<List<ConversationDto>> GetConversationsAsync(Guid userId)
    {
        var conversations = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b.Car).ThenInclude(car => car.Photos)
            .Include(c => c.Booking).ThenInclude(b => b.Car).ThenInclude(car => car.Owner)
            .Include(c => c.Booking).ThenInclude(b => b.Guest)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .ThenInclude(m => m.Sender)
            .AsSplitQuery()
            .Where(c => c.Booking.GuestId == userId || c.Booking.Car.OwnerId == userId)
            .OrderByDescending(c => c.Messages.Max(m => (DateTimeOffset?)m.SentAt) ?? c.CreatedAt)
            .ToListAsync();

        // Pre-fetch admin user IDs so we can badge them in the UI
        var adminRole = await _db.Roles.FirstOrDefaultAsync(r => r.NormalizedName == "ADMIN");
        var adminUserIds = adminRole != null
            ? (await _db.UserRoles.Where(ur => ur.RoleId == adminRole.Id).Select(ur => ur.UserId).ToListAsync()).ToHashSet()
            : new HashSet<Guid>();

        return conversations.Select(c =>
        {
            var isGuest = c.Booking.GuestId == userId;
            var otherParty = isGuest ? c.Booking.Car.Owner : c.Booking.Guest;
            var lastMsg = c.Messages.FirstOrDefault();
            var unreadCount = _db.Messages
                .Count(m => m.ConversationId == c.Id && m.SenderId != userId && m.ReadAt == null && !m.Sender.IsSystemUser);

            MessageDto? lastMsgDto = null;
            if (lastMsg != null)
            {
                lastMsgDto = BuildMessageDto(lastMsg, c.Booking);
            }

            var otherPartyDto = _mapper.Map<UserPublicDto>(otherParty);
            if (otherPartyDto != null && otherParty != null)
                otherPartyDto.IsAdmin = adminUserIds.Contains(otherParty.Id);

            return new ConversationDto
            {
                Id = c.Id,
                BookingId = c.BookingId,
                CarTitle = $"{c.Booking.Car.Year} {c.Booking.Car.Make} {c.Booking.Car.Model}",
                CoverPhotoUrl = c.Booking.Car.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault(),
                OtherParty = otherPartyDto,
                LastMessage = lastMsgDto,
                UnreadCount = unreadCount
            };
        }).ToList();
    }

    public async Task<List<MessageDto>> GetMessagesAsync(Guid bookingId, Guid userId, DateTimeOffset? before = null)
    {
        var conversation = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b.Car).ThenInclude(car => car.Photos)
            .FirstOrDefaultAsync(c => c.BookingId == bookingId)
            ?? throw new KeyNotFoundException("Conversation not found.");

        if (conversation.Booking.GuestId != userId && conversation.Booking.Car?.OwnerId != userId)
        {
            var booking = await _db.Bookings.Include(b => b.Car).FirstAsync(b => b.Id == bookingId);
            if (booking.GuestId != userId && booking.Car.OwnerId != userId)
                throw new UnauthorizedAccessException("Not authorized.");
        }

        var query = _db.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversation.Id);

        if (before.HasValue)
            query = query.Where(m => m.SentAt < before.Value);

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(50)
            .ToListAsync();

        messages.Reverse();

        return messages.Select(m => BuildMessageDto(m, conversation.Booking)).ToList();
    }

    public async Task<MessageDto> SendMessageAsync(Guid bookingId, Guid senderId, string body)
    {
        var conversation = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b.Car).ThenInclude(car => car.Photos)
            .FirstOrDefaultAsync(c => c.BookingId == bookingId);

        if (conversation == null)
        {
            var booking = await _db.Bookings.Include(b => b.Car)
                .FirstOrDefaultAsync(b => b.Id == bookingId)
                ?? throw new KeyNotFoundException("Booking not found.");

            conversation = new Conversation { BookingId = bookingId };
            _db.Conversations.Add(conversation);
            await _db.SaveChangesAsync();
        }

        if (conversation.Booking.GuestId != senderId && conversation.Booking.Car.OwnerId != senderId)
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

        var saved = await _db.Messages
            .Include(m => m.Sender)
            .FirstAsync(m => m.Id == message.Id);

        return BuildMessageDto(saved, conversation.Booking);
    }

    public async Task MarkConversationReadByBookingAsync(Guid bookingId, Guid userId)
    {
        var conversation = await _db.Conversations
            .FirstOrDefaultAsync(c => c.BookingId == bookingId);
        if (conversation == null) return;
        await MarkAsReadAsync(conversation.Id, userId);
    }

    public async Task<int> GetTotalUnreadCountAsync(Guid userId)
    {
        return await _db.Messages
            .Include(m => m.Sender)
            .Where(m =>
                m.SenderId != userId &&
                !m.Sender.IsSystemUser &&
                m.ReadAt == null &&
                (_db.Conversations
                    .Where(c => c.Id == m.ConversationId)
                    .Any(c => c.Booking.GuestId == userId || c.Booking.Car.OwnerId == userId)))
            .CountAsync();
    }

    public async Task MarkAsReadAsync(Guid conversationId, Guid userId)
    {
        var unread = await _db.Messages
            .Where(m => m.ConversationId == conversationId && m.SenderId != userId && m.ReadAt == null)
            .ToListAsync();

        foreach (var msg in unread)
            msg.ReadAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
    }

    private MessageDto BuildMessageDto(Message msg, Booking booking)
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

