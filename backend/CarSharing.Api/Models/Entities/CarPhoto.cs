namespace CarSharing.Api.Models.Entities;

public class CarPhoto : AuditableEntity
{
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
    public string Url { get; set; } = string.Empty;
    public string? PublicId { get; set; }
    public int SortOrder { get; set; }
    public bool IsCover { get; set; }
}
