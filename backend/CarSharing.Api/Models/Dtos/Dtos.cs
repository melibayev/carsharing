using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Dtos;

// === Auth DTOs ===
public record RegisterRequest(string Email, string Password, string FirstName, string LastName, DateTimeOffset DateOfBirth);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record VerifyEmailCodeRequest(string Code);
public record AuthResponse(string AccessToken, UserDto User);
public record DeleteAccountRequest(string Password);

// === User DTOs ===
public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? ProfilePhotoUrl { get; set; }
    public string? Bio { get; set; }
    public string? PhoneNumber { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool IsIdentityVerified { get; set; }
    public decimal AverageRatingAsHost { get; set; }
    public decimal AverageRatingAsGuest { get; set; }
    public int HostTripCount { get; set; }
    public int GuestTripCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public string HostOnboardingStatus { get; set; } = "NotStarted";
    public bool EmailConfirmed { get; set; }
}

public class UserPublicDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = "";
    public string? ProfilePhotoUrl { get; set; }
    public string? Bio { get; set; }
    public decimal AverageRatingAsHost { get; set; }
    public int HostTripCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public bool IsAdmin { get; set; }
}

public record UpdateProfileRequest(
    string? FirstName, string? LastName, string? Bio, string? PhoneNumber);

// === Car DTOs ===
public class CarListDto
{
    public Guid Id { get; set; }
    public string Make { get; set; } = "";
    public string Model { get; set; } = "";
    public int Year { get; set; }
    public string City { get; set; } = "";
    public decimal DailyPriceUsd { get; set; }
    public decimal AverageRating { get; set; }
    public int TripCount { get; set; }
    public bool IsInstantBook { get; set; }
    public BodyType BodyType { get; set; }
    public Transmission Transmission { get; set; }
    public FuelType FuelType { get; set; }
    public int Seats { get; set; }
    public string? CoverPhotoUrl { get; set; }
    public List<string> PhotoUrls { get; set; } = new();
    public double? DistanceKm { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

public class CarDetailDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Make { get; set; } = "";
    public string Model { get; set; } = "";
    public int Year { get; set; }
    public string? Trim { get; set; }
    public BodyType BodyType { get; set; }
    public Transmission Transmission { get; set; }
    public FuelType FuelType { get; set; }
    public int Seats { get; set; }
    public int Doors { get; set; }
    public string? Color { get; set; }
    public int? OdometerKm { get; set; }
    public decimal DailyPriceUsd { get; set; }
    public int WeeklyDiscountPercent { get; set; }
    public int MonthlyDiscountPercent { get; set; }
    public decimal CleaningFeeUsd { get; set; }
    public decimal SecurityDepositUsd { get; set; }
    public int MinTripDays { get; set; }
    public int MaxTripDays { get; set; }
    public int AdvanceNoticeHours { get; set; }
    public int? DailyMileageLimitKm { get; set; }
    public decimal? ExtraKmFeeUsd { get; set; }
    public string? AddressLine { get; set; }
    public string City { get; set; } = "";
    public string? Region { get; set; }
    public string Country { get; set; } = "";
    public string? PostalCode { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? Description { get; set; }
    public string? Rules { get; set; }
    public CarStatus Status { get; set; }
    public bool IsInstantBook { get; set; }
    public decimal AverageRating { get; set; }
    public int TripCount { get; set; }
    public List<CarPhotoDto> Photos { get; set; } = new();
    public List<string> Features { get; set; } = new();
    public UserPublicDto? Host { get; set; }
    public List<ReviewDto> Reviews { get; set; } = new();
    public List<AvailabilityBlockDto> BlockedDates { get; set; } = new();
}

public record CreateCarRequest(
    string Make, string Model, int Year, string? Trim, string? Vin,
    string? LicensePlate, string? LicensePlateRegion,
    BodyType BodyType, Transmission Transmission, FuelType FuelType,
    int Seats, int Doors, string? Color, int? OdometerKm,
    decimal DailyPriceUsd, int WeeklyDiscountPercent, int MonthlyDiscountPercent,
    decimal CleaningFeeUsd, decimal SecurityDepositUsd,
    int MinTripDays, int MaxTripDays, int AdvanceNoticeHours,
    int? DailyMileageLimitKm, decimal? ExtraKmFeeUsd,
    string? AddressLine, string City, string? Region, string Country, string? PostalCode,
    string? Description, string? Rules, bool IsInstantBook, List<string>? Features);

public record UpdateCarRequest(
    string? Make, string? Model, int? Year, string? Trim, string? Vin,
    string? LicensePlate, string? LicensePlateRegion,
    BodyType? BodyType, Transmission? Transmission, FuelType? FuelType,
    int? Seats, int? Doors, string? Color, int? OdometerKm,
    decimal? DailyPriceUsd, int? WeeklyDiscountPercent, int? MonthlyDiscountPercent,
    decimal? CleaningFeeUsd, decimal? SecurityDepositUsd,
    int? MinTripDays, int? MaxTripDays, int? AdvanceNoticeHours,
    int? DailyMileageLimitKm, decimal? ExtraKmFeeUsd,
    string? AddressLine, string? City, string? Region, string? Country, string? PostalCode,
    string? Description, string? Rules, bool? IsInstantBook, List<string>? Features);

/// <summary>Host-facing PATCH payload — prices in UZS for ease of use.</summary>
public record HostPatchCarRequest(
    // Vehicle identity
    string? Make,
    string? Model,
    int? Year,
    string? Trim,
    string? Transmission,
    string? BodyType,
    string? FuelType,
    int? Seats,
    int? Doors,
    // Pricing
    decimal? DailyPriceUzs,
    int? WeeklyDiscountPercent,
    int? MonthlyDiscountPercent,
    decimal? CleaningFeeUzs,
    decimal? SecurityDepositUzs,
    int? MinTripDays,
    int? MaxTripDays,
    int? AdvanceNoticeHours,
    int? DailyMileageLimitKm,
    decimal? ExtraKmFeeUzs,
    // Details
    string? Description,
    string? Rules,
    bool? IsInstantBook,
    string? Color,
    int? OdometerKm,
    // Location
    string? AddressLine,
    string? City,
    double? Lat,
    double? Lng,
    int? PrivacyRadiusMeters,
    bool? CanDeliverToAirports,
    bool? SelfCheckInAvailable,
    bool? GpsTrackerInstalled,
    // Features
    List<string>? Features);

public class CarPhotoDto
{
    public Guid Id { get; set; }
    public string Url { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsCover { get; set; }
}

public record CarSearchRequest(
    string? City, double? Lat, double? Lng, double? RadiusKm,
    DateTimeOffset? StartDate, DateTimeOffset? EndDate,
    decimal? MinPrice, decimal? MaxPrice,
    BodyType? BodyType, string? Make, Transmission? Transmission,
    FuelType? FuelType, int? Seats, string? Features,
    bool? InstantBook, string? Sort, int Page = 1, int PageSize = 20);

public class AvailabilityBlockDto
{
    public Guid Id { get; set; }
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }
    public string Reason { get; set; } = "";
}

public record BlockDatesRequest(DateTimeOffset StartUtc, DateTimeOffset EndUtc);

// === Booking DTOs ===
public record QuoteRequest(Guid CarId, DateTimeOffset StartUtc, DateTimeOffset EndUtc);

public record QuoteResponse(
    int Days, decimal DailyRateUsd, decimal SubtotalUsd,
    decimal? DiscountAmount, string? DiscountType,
    decimal CleaningFeeUsd, decimal ServiceFeeUsd, decimal TaxesUsd,
    decimal SecurityDepositHoldUsd, decimal TotalChargedUsd, decimal HostPayoutUsd);

public record CreateBookingRequest(Guid CarId, DateTimeOffset StartUtc, DateTimeOffset EndUtc, string? GuestMessage);

public class BookingDto
{
    public Guid Id { get; set; }
    public Guid CarId { get; set; }
    public Guid GuestId { get; set; }
    public string CarTitle { get; set; } = "";
    public string? CoverPhotoUrl { get; set; }
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }
    public BookingStatus Status { get; set; }
    public decimal DailyRateUsd { get; set; }
    public int Days { get; set; }
    public decimal SubtotalUsd { get; set; }
    public decimal CleaningFeeUsd { get; set; }
    public decimal ServiceFeeUsd { get; set; }
    public decimal TaxesUsd { get; set; }
    public decimal SecurityDepositHoldUsd { get; set; }
    public decimal TotalChargedUsd { get; set; }
    public decimal HostPayoutUsd { get; set; }
    public string? GuestMessage { get; set; }
    public string? HostResponseMessage { get; set; }
    public int? CheckInOdometerKm { get; set; }
    public int? CheckOutOdometerKm { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public UserPublicDto? Guest { get; set; }
    public UserPublicDto? Host { get; set; }
    public bool CanReview { get; set; }
}

public record RejectBookingRequest(string Reason);
public record RejectCarRequest(string Reason);
public record CancelBookingRequest(string Reason);
public record CheckInRequest(int OdometerKm, List<string>? PhotoUrls);
public record CheckOutRequest(int OdometerKm, List<string>? PhotoUrls);
public record DisputeBookingRequest(string Reason);

// === Review DTOs ===
public record CreateReviewRequest(
    Guid BookingId, int Rating, int? CleanlinessRating,
    int? CommunicationRating, int? AccuracyRating, string Comment);

public class ReviewDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = "";
    public string? AuthorPhotoUrl { get; set; }
    public ReviewAuthorRole AuthorRole { get; set; }
    public int Rating { get; set; }
    public int? CleanlinessRating { get; set; }
    public int? CommunicationRating { get; set; }
    public int? AccuracyRating { get; set; }
    public string Comment { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
}

// === Message DTOs ===
public class ConversationDto
{
    public Guid Id { get; set; }
    public Guid? BookingId { get; set; }  // null for direct/support conversations
    public string? CarTitle { get; set; }  // null for direct conversations
    public string? CoverPhotoUrl { get; set; }
    public UserPublicDto? OtherParty { get; set; }
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
    public bool IsArchived { get; set; }
}

public class BookingPreviewDto
{
    public Guid BookingId { get; set; }
    public string CarTitle { get; set; } = "";
    public string? CarPhotoUrl { get; set; }
    public string City { get; set; } = "";
    public int Seats { get; set; }
    public string FuelType { get; set; } = "";
    public DateTimeOffset StartUtc { get; set; }
    public DateTimeOffset EndUtc { get; set; }
    public decimal TotalUsd { get; set; }
    public string Status { get; set; } = "";
    public int Days { get; set; }
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = "";
    public string? SenderPhotoUrl { get; set; }
    public string Type { get; set; } = "Text";
    public string? Body { get; set; }
    public string? AttachmentUrl { get; set; }
    public BookingPreviewDto? BookingPreview { get; set; }
    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
    public bool IsDeleted { get; set; }
    public Guid? ReplyToMessageId { get; set; }
    public string? ReplyToSenderName { get; set; }
    public string? ReplyToBody { get; set; }
    public string? ReplyToType { get; set; }
    public string? ReplyToAttachmentUrl { get; set; }
}

public record SendMessageRequest(string Body, Guid? ReplyToMessageId = null);
public record EditMessageRequest(string Body);

// === Notification DTOs ===
public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string? LinkUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

// === Host DTOs ===
public record EligibilityDto(bool CanList, List<string> Missing);

public class PayoutMethodDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Last4 { get; set; } = "";
    public string HolderName { get; set; } = "";
    public string? BankName { get; set; }
    public bool IsDefault { get; set; }
    public DateTimeOffset AddedAt { get; set; }
}

public record AttachPayoutMethodRequest(
    string Type, // UzcardCard | HumoCard | VisaMasterCard | BankAccountUZS | BankAccountUSD
    string Brand,
    string Last4,
    string HolderName,
    string? BankName,
    string TokenizedDetails // card number or account number, encrypted by client
);

public record SignAgreementRequest(string Version);

public class CarDraftDto
{
    public Guid Id { get; set; }
    public string CurrentStep { get; set; } = "";
    public string? PlateNumber { get; set; }
    public string? Vin { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Trim { get; set; }
    public string? Color { get; set; }
    public int? OdometerKm { get; set; }
    public string? Transmission { get; set; }
    public string? FuelType { get; set; }
    public int? Seats { get; set; }
    public int? Doors { get; set; }
    public string? BodyType { get; set; }
    public string? VehicleTier { get; set; }
    public string? OwnershipRelation { get; set; }
    public string? InsurancePolicyUrl { get; set; }
    public DateTimeOffset? InsuranceExpiry { get; set; }
    public string? TechnicalInspectionUrl { get; set; }
    public DateTimeOffset? TechnicalInspectionExpiry { get; set; }
    public bool GpsTrackerInstalled { get; set; }
    public string? PhotosJson { get; set; }
    public string? AddressLine { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public string? PostalCode { get; set; }
    public decimal? Lat { get; set; }
    public decimal? Lng { get; set; }
    public int PrivacyRadiusMeters { get; set; } = 300;
    public bool CanDeliverToAirports { get; set; }
    public string? DeliveryLocationsJson { get; set; }
    public bool SelfCheckInAvailable { get; set; }
    public string? SelfCheckInMethod { get; set; }
    public int AdvanceNoticeHours { get; set; } = 24;
    public int MinTripDays { get; set; } = 1;
    public int MaxTripDays { get; set; } = 30;
    public string? BlockedDatesJson { get; set; }
    public decimal? DailyPriceUzs { get; set; }
    public int WeeklyDiscountPercent { get; set; }
    public int MonthlyDiscountPercent { get; set; }
    public decimal CleaningFeeUzs { get; set; }
    public decimal SecurityDepositUzs { get; set; }
    public int DailyKmLimit { get; set; } = 300;
    public decimal ExtraKmFeeUzs { get; set; }
    public string? Rules { get; set; }
    public string? CustomRules { get; set; }
    public bool IsInstantBook { get; set; }
    public string? Description { get; set; }
    public List<string>? Features { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public record PatchDraftRequest(
    string? PlateNumber, string? Vin, string? Make, string? Model, int? Year,
    string? Trim, string? Color, int? OdometerKm, string? Transmission,
    string? FuelType, int? Seats, int? Doors, string? BodyType,
    string? OwnershipRelation, string? InsurancePolicyUrl, DateTimeOffset? InsuranceExpiry,
    string? TechnicalInspectionUrl, DateTimeOffset? TechnicalInspectionExpiry,
    bool? GpsTrackerInstalled, string? PhotosJson, string? AddressLine, string? City,
    string? Region, string? PostalCode, decimal? Lat, decimal? Lng,
    int? PrivacyRadiusMeters, bool? CanDeliverToAirports, string? DeliveryLocationsJson,
    bool? SelfCheckInAvailable, string? SelfCheckInMethod, int? AdvanceNoticeHours,
    int? MinTripDays, int? MaxTripDays, string? BlockedDatesJson,
    decimal? DailyPriceUzs, int? WeeklyDiscountPercent, int? MonthlyDiscountPercent,
    decimal? CleaningFeeUzs, decimal? SecurityDepositUzs, int? DailyKmLimit,
    decimal? ExtraKmFeeUzs, string? Rules, string? CustomRules,
    bool? IsInstantBook, string? Description, string? CurrentStep,
    List<string>? Features
);

public record SubmitDraftResponse(Guid CarId, string Status, int EstimatedReviewMinutes);

public record VinAvailableResponse(bool Available);

// === Admin DTOs ===
public record AdminMetricsDto(
    int TotalUsers, int TotalCars, int TotalBookings,
    int PendingApprovals, int ActiveDisputes,
    decimal TotalRevenue, decimal MonthlyRevenue,
    List<RecentActivityDto> RecentActivity);

public record RecentActivityDto(string Type, string Description, DateTimeOffset Timestamp);

public record AdminUserDto(
    Guid Id, string Email, string FirstName, string LastName,
    bool IsIdentityVerified, int HostTripCount, int GuestTripCount,
    DateTimeOffset CreatedAt, bool IsBanned, string? PhoneNumber = null);

public record AdminBookingDto(
    Guid Id,
    string CarTitle,
    string? CoverPhotoUrl,
    string GuestName,
    string GuestEmail,
    string? GuestPhone,
    string HostName,
    string HostEmail,
    BookingStatus Status,
    decimal TotalChargedUsd,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    DateTimeOffset CreatedAt,
    string? GuestMessage,
    DateTimeOffset? ConfirmedAt);

public class AdminCarDetailDto
{
    public Guid Id { get; set; }
    public string Make { get; set; } = "";
    public string Model { get; set; } = "";
    public int Year { get; set; }
    public string? Vin { get; set; }
    public string? Color { get; set; }
    public string? LicensePlate { get; set; }
    public string OwnerName { get; set; } = "";
    public string OwnerEmail { get; set; } = "";
    public string? OwnerPhone { get; set; }
    public string? TechPassportFrontUrl { get; set; }
    public string? TechPassportBackUrl { get; set; }
    public string? InsurancePolicyUrl { get; set; }
    public DateTimeOffset? InsuranceExpiry { get; set; }
    public string? TechnicalInspectionUrl { get; set; }
    public DateTimeOffset? TechnicalInspectionExpiry { get; set; }
    public string? AuthorizationLetterUrl { get; set; }
    public string? GpsTrackerPhotoUrl { get; set; }
    public bool VinMismatchFlagged { get; set; }
    public string OwnershipRelation { get; set; } = "";
    public List<string> PhotoUrls { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
}

// === Common ===
public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

// === Earnings ===
public record EarningsDto(
    decimal TotalEarnings, decimal MonthlyEarnings, decimal PendingPayouts,
    int TotalTrips, List<MonthlyEarningDto> MonthlyBreakdown,
    List<CarEarningDto> ByCarBreakdown);

public record MonthlyEarningDto(int Year, int Month, decimal Amount, int Trips);
public record CarEarningDto(Guid CarId, string CarTitle, decimal TotalEarnings, int TripCount);

// === KYC DTOs ===
public record SubmitKycRequest(
    KycDocumentType DocumentType,
    string DocumentFrontUrl,
    string? DocumentBackUrl,
    string? SelfieUrl,
    string? DocumentNumber,
    DateTimeOffset? DocumentExpiry);

public class KycVerificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = "";
    public string UserEmail { get; set; } = "";
    public KycStatus Status { get; set; }
    public KycDocumentType DocumentType { get; set; }
    public string DocumentFrontUrl { get; set; } = "";
    public string? DocumentBackUrl { get; set; }
    public string? SelfieUrl { get; set; }
    public string? DocumentNumber { get; set; }
    public DateTimeOffset? DocumentExpiry { get; set; }
    public string? RejectionReason { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public record ReviewKycRequest(bool Approved, string? RejectionReason, string? Notes);

// === Dispute DTOs ===
public record CreateDisputeRequest(
    Guid BookingId,
    DisputeCategory Category,
    string Description,
    List<string>? EvidenceUrls);

public class DisputeDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public string BookingTitle { get; set; } = "";
    public Guid FiledById { get; set; }
    public string FiledByName { get; set; } = "";
    public DisputeStatus Status { get; set; }
    public DisputeCategory Category { get; set; }
    public string Description { get; set; } = "";
    public List<string> EvidenceUrls { get; set; } = new();
    public string? Resolution { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public record ResolveDisputeRequest(string Resolution, decimal? RefundAmount);

// === Audit DTOs ===
public class AuditLogDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public Guid? EntityId { get; set; }
    public string? ActorEmail { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

// === Admin Extended ===
public record AdminCarDto(
    Guid Id, string Make, string Model, int Year, string City,
    decimal DailyPriceUsd, CarStatus Status, string OwnerName,
    string OwnerEmail, decimal AverageRating, int TripCount,
    DateTimeOffset CreatedAt, string? CoverPhotoUrl = null, bool VinMismatchFlagged = false);

public record AdminFinanceDto(
    decimal TotalRevenue, decimal MonthlyRevenue,
    decimal PendingPayouts, decimal TotalPayouts,
    int CompletedBookings, decimal AverageBookingValue,
    List<MonthlyRevenueDto> MonthlyBreakdown);

public record MonthlyRevenueDto(int Year, int Month, decimal Revenue, decimal Payouts, int Bookings);

// === Onboarding DTOs ===
public class OnboardingStatusDto
{
    public ProfileCompletionStatus? Status { get; set; }
    public int CurrentStep { get; set; }
    public bool IsComplete { get; set; }
    public string Email { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? MiddleName { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public string? PhoneNumber { get; set; }
    public string? HomeAddressLine { get; set; }
    public string? HomeCity { get; set; }
    public string? HomeRegionId { get; set; }
    public string? HomePostalCode { get; set; }
    public string? Gender { get; set; }
    public string? LicenseIssuedCountry { get; set; }
    public string? LicenseIssuedRegionId { get; set; }
    public DateTimeOffset? DriverLicenseExpiry { get; set; }
    public string? DriverLicensePhotoUrl { get; set; }
    public string? DriverLicenseBackUrl { get; set; }
    public string? DriverLicenseSelfieUrl { get; set; }
    public string? IdentityDocumentType { get; set; }
    public string? IdentityDocumentFrontUrl { get; set; }
    public string? IdentityDocumentBackUrl { get; set; }
    public string? IdentitySelfieUrl { get; set; }
    public bool Step4Skipped { get; set; }
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
    public string? CardholderName { get; set; }
}

public record OnboardingStep2Request(
    string FirstName,
    string LastName,
    string? MiddleName,
    DateTimeOffset DateOfBirth,
    string? Gender,
    string PhoneNumber,
    string HomeAddressLine,
    string HomeCity,
    string HomeRegionId,
    string? HomePostalCode,
    decimal? HomeLat,
    decimal? HomeLng);

public record OnboardingStep3Request(
    string DriverLicenseNumber,
    DateTimeOffset DriverLicenseExpiry,
    string DriverLicensePhotoUrl,
    string DriverLicenseBackUrl,
    string DriverLicenseSelfieUrl,
    string? LicenseIssuedCountry,
    string? LicenseIssuedRegionId);

public record OnboardingStep4Request(
    bool Skipped,
    string? DocumentType,
    string? DocumentNumber,
    string? DocumentFrontUrl,
    string? DocumentBackUrl,
    string? SelfieUrl);

public record OnboardingStep5Request(
    string CardholderName,
    string Last4,
    string Brand,
    string Expiry,
    string? BillingAddressJson);

public record DocumentUploadResponse(string Url);

public record EmailAvailableResponse(bool Available);

// === Payment System DTOs ===

// Balance
public class AccountBalanceDto
{
    public decimal AvailableUzs { get; set; }
    public decimal LockedUzs { get; set; }
    public uint Version { get; set; }
}

public class LedgerEntryDto
{
    public Guid Id { get; set; }
    public string Direction { get; set; } = "";  // "Credit" | "Debit"
    public string Type { get; set; } = "";
    public decimal AmountUzs { get; set; }
    public decimal BalanceAfterUzs { get; set; }
    public string Description { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public Guid? RelatedBookingId { get; set; }
    public string? CarTitle { get; set; }
    public string? CarPhotoUrl { get; set; }
}

public record TopUpIntentRequest(decimal AmountUzs, Guid? PaymentMethodId);

public class TopUpIntentResponse
{
    public Guid IntentId { get; set; }
    public bool SmsRequired { get; set; }
    public string PhoneHint { get; set; } = "";
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? NextResendAllowedAt { get; set; }
}

public record ConfirmTopUpRequest(Guid IntentId, string Code);

// Payment Methods
public class UserPaymentMethodDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "";
    public string Brand { get; set; } = "";
    public string Last4 { get; set; } = "";
    public int ExpMonth { get; set; }
    public int ExpYear { get; set; }
    public string CardholderName { get; set; } = "";
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? PhoneVerifiedAt { get; set; }
}

public record AddCardIntentRequest(
    string CardNumber,
    int ExpMonth,
    int ExpYear,
    string? Cvv,              // null/empty for UzCard & Humo (no CVV on local cards)
    string CardholderName,
    string? Type = null);     // auto-detected from card prefix if omitted

public class AddCardIntentResponse
{
    public Guid PaymentMethodId { get; set; }
    public string MaskedCard { get; set; } = "";
    public string PhoneHint { get; set; } = "";
    public string Last4 { get; set; } = "";
    public string Brand { get; set; } = "";
    public DateTimeOffset SmsExpiresAt { get; set; }
    public DateTimeOffset? NextResendAllowedAt { get; set; }
}

public record ConfirmCardRequest(Guid PaymentMethodId, string Code);
public record ResendCardSmsRequest(Guid PaymentMethodId);

// Checkout
public class CheckoutDto
{
    public BookingDto Booking { get; set; } = null!;
    public PriceBreakdownDto PriceBreakdown { get; set; } = null!;
    public AccountBalanceDto Balance { get; set; } = null!;
    public List<UserPaymentMethodDto> PaymentMethods { get; set; } = new();
    public Guid? RecommendedMethodId { get; set; }
    public DateTimeOffset LockExpiresAt { get; set; }
}

public class PriceBreakdownDto
{
    public decimal DailyRateUzs { get; set; }
    public int Days { get; set; }
    public decimal SubtotalUzs { get; set; }
    public decimal? DiscountAmountUzs { get; set; }
    public string? DiscountType { get; set; }
    public decimal CleaningFeeUzs { get; set; }
    public decimal ServiceFeeUzs { get; set; }
    public decimal TaxesUzs { get; set; }
    public decimal TotalUzs { get; set; }
}

public record PayBookingRequest(string Method, Guid? PaymentMethodId);

public class PayBookingResponse
{
    public Guid PaymentId { get; set; }
    public string Status { get; set; } = "";
    public string BookingStatus { get; set; } = "";
}

// Receipts
public class ReceiptDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public Guid PaymentId { get; set; }
    public string ReceiptNumber { get; set; } = "";
    public string? PdfUrl { get; set; }
    public DateTimeOffset? EmailedAt { get; set; }
    public decimal TotalUzs { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
    public string PaymentMethod { get; set; } = "";
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
}

// Payments (admin)
public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public string CarTitle { get; set; } = "";
    public string GuestName { get; set; } = "";
    public string Method { get; set; } = "";
    public string? CardLast4 { get; set; }
    public string? CardBrand { get; set; }
    public decimal AmountUzs { get; set; }
    public string Status { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? AuthorizedAt { get; set; }
    public DateTimeOffset? CapturedAt { get; set; }
    public decimal RefundedAmountUzs { get; set; }
}

public record AdminRefundRequest(decimal AmountUzs, string Reason);
public record AdminBalanceAdjustmentRequest(Guid UserId, decimal AmountUzs, string Direction, string Reason);
