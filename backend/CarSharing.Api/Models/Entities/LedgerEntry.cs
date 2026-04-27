using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

/// <summary>Immutable journal entry. Never update or delete — reversals are new entries.</summary>
public class LedgerEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public LedgerDirection Direction { get; set; }
    public LedgerEntryType Type { get; set; }

    /// <summary>Always positive. Direction tells the sign.</summary>
    public decimal AmountUzs { get; set; }

    /// <summary>Available balance AFTER this entry was applied.</summary>
    public decimal BalanceAfterUzs { get; set; }

    public Guid? RelatedBookingId { get; set; }
    public Booking? RelatedBooking { get; set; }

    public Guid? RelatedPaymentId { get; set; }

    public string Description { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid? CreatedByUserId { get; set; }
    public ApplicationUser? CreatedByUser { get; set; }

    public Guid? AccountBalanceId { get; set; }
    public AccountBalance? AccountBalance { get; set; }
}
