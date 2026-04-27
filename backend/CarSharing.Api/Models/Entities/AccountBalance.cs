namespace CarSharing.Api.Models.Entities;

/// <summary>One row per user. Lazy-created on first use.</summary>
public class AccountBalance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    /// <summary>Funds free to spend (UZS).</summary>
    public decimal AvailableUzs { get; set; }

    /// <summary>Funds held for in-flight bookings (UZS).</summary>
    public decimal LockedUzs { get; set; }

    /// <summary>Optimistic concurrency token.</summary>
    public uint Version { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
}
