using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Conversation : AuditableEntity
{
    // Booking-based conversation (null for direct/support conversations)
    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }

    // Direct (support) conversations: participants instead of a booking
    public Guid? Participant1Id { get; set; }
    public ApplicationUser? Participant1 { get; set; }
    public Guid? Participant2Id { get; set; }
    public ApplicationUser? Participant2 { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}

public class Message : AuditableEntity
{
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public Guid SenderId { get; set; }
    public ApplicationUser Sender { get; set; } = null!;
    public MessageType Type { get; set; } = MessageType.Text;
    public string? Body { get; set; }
    public string? AttachmentUrl { get; set; }
    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }
    public DateTimeOffset SentAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReadAt { get; set; }
}
