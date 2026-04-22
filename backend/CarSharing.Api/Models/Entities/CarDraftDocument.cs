namespace CarSharing.Api.Models.Entities;

public class CarDraftDocument : AuditableEntity
{
    public Guid CarDraftId { get; set; }
    public CarDraft CarDraft { get; set; } = null!;

    public string Category { get; set; } = string.Empty; // techPassportFront, techPassportBack, insurance, etc.
    public string Url { get; set; } = string.Empty;
    public string? PublicId { get; set; }
    public string? OriginalFileName { get; set; }
}
