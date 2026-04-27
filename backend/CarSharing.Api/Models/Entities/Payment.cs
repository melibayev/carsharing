using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public PaymentMethod Method { get; set; }
    public Guid? PaymentMethodId { get; set; }
    public UserPaymentMethod? PaymentMethodRef { get; set; }

    public decimal AmountUzs { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    /// <summary>"pi_fake_xxx" for card payments.</summary>
    public string? ProviderRef { get; set; }

    public string? FailureReason { get; set; }
    public DateTimeOffset? AuthorizedAt { get; set; }
    public DateTimeOffset? CapturedAt { get; set; }
    public DateTimeOffset? RefundedAt { get; set; }
    public decimal RefundedAmountUzs { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Idempotency key — "bookingId:userId:method".</summary>
    public string? IdempotencyKey { get; set; }

    public Receipt? Receipt { get; set; }
}
