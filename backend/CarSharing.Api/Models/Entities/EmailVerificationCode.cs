namespace CarSharing.Api.Models.Entities;

public class EmailVerificationCode
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>SHA-256 hex hash of the 6-digit code. Plain-text is never persisted.</summary>
    public string CodeHash { get; set; } = null!;

    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ConsumedAt { get; set; }

    /// <summary>Count of wrong submissions against THIS code (max 5 before invalidation).</summary>
    public int AttemptCount { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
