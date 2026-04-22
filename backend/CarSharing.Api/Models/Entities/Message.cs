using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Conversation : AuditableEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
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
