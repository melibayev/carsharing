using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class PayoutMethod : AuditableEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public PayoutMethodType Type { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Last4 { get; set; } = string.Empty;
    public string HolderName { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? ProviderReference { get; set; } // encrypted
    public bool IsDefault { get; set; }
    public DateTimeOffset AddedAt { get; set; } = DateTimeOffset.UtcNow;
}
