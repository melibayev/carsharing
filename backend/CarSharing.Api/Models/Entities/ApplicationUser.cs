using CarSharing.Api.Models.Enums;
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

    // Onboarding fields
    public ProfileCompletionStatus? OnboardingStatus { get; set; }
    public bool Step4Skipped { get; set; }
    public string? MiddleName { get; set; }
    public string? Gender { get; set; }
    public string? HomeAddressLine { get; set; }
    public string? HomeCity { get; set; }
    public string? HomeRegionId { get; set; }
    public string? HomePostalCode { get; set; }
    public decimal? HomeLat { get; set; }
    public decimal? HomeLng { get; set; }
    public string? LicenseIssuedCountry { get; set; }
    public string? LicenseIssuedRegionId { get; set; }
    public string? DriverLicenseBackUrl { get; set; }
    public string? DriverLicenseSelfieUrl { get; set; }
    public IdentityDocumentType IdentityDocumentType { get; set; }
    public string? IdentityDocumentNumber { get; set; }
    public string? IdentityDocumentFrontUrl { get; set; }
    public string? IdentityDocumentBackUrl { get; set; }
    public string? IdentitySelfieUrl { get; set; }
    public string? PaymentMethodId { get; set; }
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
    public string? CardholderName { get; set; }
    public string? BillingAddressJson { get; set; }
    public DateTimeOffset? ReminderSentAt { get; set; }

    // Host onboarding fields
    public HostOnboardingStatus HostOnboardingStatus { get; set; } = HostOnboardingStatus.NotStarted;
    public DateTimeOffset? HostAgreementSignedAt { get; set; }
    public string? HostAgreementVersion { get; set; }
    public Guid? HostPayoutMethodId { get; set; }
    public int FraudRiskScore { get; set; }
    public bool IsOnFraudWatchlist { get; set; }
    public bool IsBanned { get; set; }
    public bool IsSystemUser { get; set; }
    public DateTimeOffset? HostOnboardingReminderSentAt { get; set; }

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
    public ICollection<PayoutMethod> PayoutMethods { get; set; } = new List<PayoutMethod>();
    public ICollection<CarDraft> CarDrafts { get; set; } = new List<CarDraft>();
    public PayoutMethod? HostPayoutMethod { get; set; }
}
