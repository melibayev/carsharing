using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Availability : AuditableEntity
{
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }
    public AvailabilityReason Reason { get; set; }
    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }
}
