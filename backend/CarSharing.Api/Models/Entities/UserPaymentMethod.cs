using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class UserPaymentMethod
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public PaymentMethodType Type { get; set; }
    public string Brand { get; set; } = string.Empty;       // "Visa", "Mastercard", "Uzcard", "Humo"
    public string Last4 { get; set; } = string.Empty;
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
    public string CardholderName { get; set; } = string.Empty;

    /// <summary>Encrypted via IDataProtector. Fake token "pm_fake_xxx".</summary>
    public string ProviderToken { get; set; } = string.Empty;

    public DateTimeOffset? PhoneVerifiedAt { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;  // false while SMS pending

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
