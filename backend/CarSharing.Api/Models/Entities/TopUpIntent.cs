namespace CarSharing.Api.Models.Entities;

/// <summary>
/// Tracks top-up intents before SMS confirmation.
/// </summary>
public class TopUpIntent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid? PaymentMethodId { get; set; }
    public UserPaymentMethod? PaymentMethod { get; set; }
    public decimal AmountUzs { get; set; }
    public bool IsConfirmed { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
