using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class KycVerification : AuditableEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public KycStatus Status { get; set; } = KycStatus.Pending;
    public KycDocumentType DocumentType { get; set; }

    public string DocumentFrontUrl { get; set; } = string.Empty;
    public string? DocumentBackUrl { get; set; }
    public string? SelfieUrl { get; set; }

    public string? DocumentNumber { get; set; }
    public DateTimeOffset? DocumentExpiry { get; set; }

    public string? RejectionReason { get; set; }
    public Guid? ReviewedById { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }

    public string? Notes { get; set; }
}
