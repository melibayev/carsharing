using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Dispute : AuditableEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;

    public Guid FiledById { get; set; }
    public ApplicationUser FiledBy { get; set; } = null!;

    public DisputeStatus Status { get; set; } = DisputeStatus.Open;
    public DisputeCategory Category { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; } // JSON array

    public string? Resolution { get; set; }
    public decimal? RefundAmount { get; set; }

    public Guid? ResolvedById { get; set; }
    public ApplicationUser? ResolvedBy { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}
