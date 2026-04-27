namespace CarSharing.Api.Models.Entities;

/// <summary>
/// SMS challenge for payment operations (add card, top-up).
/// Same lifecycle as EmailVerificationCode: 6 digits, 5-min expiry, SHA-256 hash.
/// </summary>
public class PaymentSmsChallenge
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>e.g. "add-card:{pendingMethodId}" or "topup:{intentId}"</summary>
    public string PurposeKey { get; set; } = string.Empty;

    /// <summary>SHA-256 hex hash. Plain-text is never stored.</summary>
    public string CodeHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }

    public int AttemptCount { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
