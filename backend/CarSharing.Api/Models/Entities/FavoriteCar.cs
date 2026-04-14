namespace CarSharing.Api.Models.Entities;

public class FavoriteCar : AuditableEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;
    public Guid CarId { get; set; }
    public Car Car { get; set; } = null!;
}
