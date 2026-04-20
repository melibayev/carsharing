using Microsoft.AspNetCore.Identity;

namespace CarSharing.Api.Models.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTimeOffset? DateOfBirth { get; set; }
    public string? ProfilePhotoUrl { get; set; }
    public string? Bio { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool IsIdentityVerified { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public DateTimeOffset? DriverLicenseExpiry { get; set; }
    public string? DriverLicensePhotoUrl { get; set; }
    public string? StripeCustomerId { get; set; }
    public string? StripeConnectAccountId { get; set; }
    public decimal AverageRatingAsHost { get; set; }
    public decimal AverageRatingAsGuest { get; set; }
    public int HostTripCount { get; set; }
    public int GuestTripCount { get; set; }
    public int CancellationCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public string FullName => $"{FirstName} {LastName}";

    public ICollection<Car> Cars { get; set; } = new List<Car>();
    public ICollection<Booking> GuestBookings { get; set; } = new List<Booking>();
    public ICollection<Review> AuthoredReviews { get; set; } = new List<Review>();
    public ICollection<Review> ReceivedReviews { get; set; } = new List<Review>();
    public ICollection<Message> SentMessages { get; set; } = new List<Message>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<FavoriteCar> FavoriteCars { get; set; } = new List<FavoriteCar>();
    public ICollection<PayoutRecord> Payouts { get; set; } = new List<PayoutRecord>();
    public ICollection<KycVerification> KycVerifications { get; set; } = new List<KycVerification>();
    public ICollection<Dispute> FiledDisputes { get; set; } = new List<Dispute>();
}
