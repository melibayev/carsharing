using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Booking : AuditableEntity
{
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
    public Guid GuestId { get; set; }
    public ApplicationUser Guest { get; set; } = null!;

    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }
    public string? PickupLocation { get; set; }
    public string? ReturnLocation { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.PendingApproval;

    // Snapshot price fields — set once, never recomputed
    public decimal DailyRateUsd { get; set; }
    public int Days { get; set; }
    public decimal SubtotalUsd { get; set; }
    public decimal CleaningFeeUsd { get; set; }
    public decimal ServiceFeeUsd { get; set; }
    public decimal TaxesUsd { get; set; }
    public decimal SecurityDepositHoldUsd { get; set; }
    public decimal TotalChargedUsd { get; set; }
    public decimal HostPayoutUsd { get; set; }

    public string? GuestMessage { get; set; }
    public string? HostResponseMessage { get; set; }

    public int? CheckInOdometerKm { get; set; }
    public int? CheckOutOdometerKm { get; set; }
    public string? CheckInPhotos { get; set; }  // JSON array
    public string? CheckOutPhotos { get; set; } // JSON array

    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? PaymentIntentId { get; set; }

    public Conversation? Conversation { get; set; }
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public Availability? AvailabilityBlock { get; set; }
}
