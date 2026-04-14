using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
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

        return conversations.Select(c =>
        {
            var isGuest = c.Booking.GuestId == userId;
            var otherParty = isGuest ? c.Booking.Car.Owner : c.Booking.Guest;
            var lastMsg = c.Messages.FirstOrDefault();
            var unreadCount = _db.Messages
                .Count(m => m.ConversationId == c.Id && m.SenderId != userId && m.ReadAt == null);

            return new ConversationDto
            {
                Id = c.Id,
                BookingId = c.BookingId,
                CarTitle = $"{c.Booking.Car.Year} {c.Booking.Car.Make} {c.Booking.Car.Model}",
                CoverPhotoUrl = c.Booking.Car.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault(),
                OtherParty = _mapper.Map<UserPublicDto>(otherParty),
                LastMessage = lastMsg != null ? _mapper.Map<MessageDto>(lastMsg) : null,
                UnreadCount = unreadCount
            };
        }).ToList();
    }

    public async Task<List<MessageDto>> GetMessagesAsync(Guid bookingId, Guid userId, DateTimeOffset? before = null)
    {
        var conversation = await _db.Conversations
            .Include(c => c.Booking)
            .FirstOrDefaultAsync(c => c.BookingId == bookingId)
            ?? throw new KeyNotFoundException("Conversation not found.");

        if (conversation.Booking.GuestId != userId && conversation.Booking.Car?.OwnerId != userId)
        {
            // Need to check car owner
            var booking = await _db.Bookings.Include(b => b.Car).FirstAsync(b => b.Id == bookingId);
            if (booking.GuestId != userId && booking.Car.OwnerId != userId)
                throw new UnauthorizedAccessException("Not authorized.");
        }

        var query = _db.Messages
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversation.Id);

        if (before.HasValue)
        {
            query = query.Where(m => m.SentAt < before.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.SentAt)
            .Take(50)
            .ToListAsync();

        messages.Reverse();

        return _mapper.Map<List<MessageDto>>(messages);
    }

    public async Task<MessageDto> SendMessageAsync(Guid bookingId, Guid senderId, string body)
    {
        var conversation = await _db.Conversations
            .Include(c => c.Booking).ThenInclude(b => b.Car)
            .FirstOrDefaultAsync(c => c.BookingId == bookingId);

        if (conversation == null)
        {
            // Create conversation if it doesn't exist
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

        return _mapper.Map<MessageDto>(saved);
    }

    public async Task MarkAsReadAsync(Guid conversationId, Guid userId)
    {
        var unread = await _db.Messages
            .Where(m => m.ConversationId == conversationId && m.SenderId != userId && m.ReadAt == null)
            .ToListAsync();

        foreach (var msg in unread)
        {
            msg.ReadAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
