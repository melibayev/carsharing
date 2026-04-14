using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class Review : AuditableEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public ApplicationUser Author { get; set; } = null!;
    public Guid SubjectId { get; set; }
    public ApplicationUser Subject { get; set; } = null!;
    public ReviewAuthorRole AuthorRole { get; set; }

    public int Rating { get; set; }
    public int? CleanlinessRating { get; set; }
    public int? CommunicationRating { get; set; }
    public int? AccuracyRating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public bool IsPublished { get; set; }

    public Guid? CarId { get; set; }
    public Car? Car { get; set; }
}
