namespace CarSharing.Api.Models.Entities;

public class Feature : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public ICollection<CarFeature> CarFeatures { get; set; } = new List<CarFeature>();
}

public class CarFeature
{
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
    public Guid FeatureId { get; set; }
    public Feature Feature { get; set; } = null!;
}
