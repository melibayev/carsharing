using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class PayoutRecord : AuditableEntity
{
    public Guid HostId { get; set; }
    public ApplicationUser Host { get; set; } = null!;
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public decimal AmountUsd { get; set; }
    public PayoutStatus Status { get; set; } = PayoutStatus.Pending;
    public DateTimeOffset? ProcessedAt { get; set; }
}
