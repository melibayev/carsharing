using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Dtos;

// === Auth DTOs ===
public record RegisterRequest(string Email, string Password, string FirstName, string LastName, DateTimeOffset DateOfBirth);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record AuthResponse(string AccessToken, UserDto User);

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
    public Guid BookingId { get; set; }
    public string CarTitle { get; set; } = "";
    public string? CoverPhotoUrl { get; set; }
    public UserPublicDto? OtherParty { get; set; }
    public MessageDto? LastMessage { get; set; }
    public int UnreadCount { get; set; }
}

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid SenderId { get; set; }
    public string SenderName { get; set; } = "";
    public string? SenderPhotoUrl { get; set; }
    public string Body { get; set; } = "";
    public DateTimeOffset SentAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }
}

public record SendMessageRequest(string Body);

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
    DateTimeOffset CreatedAt, bool IsBanned);

// === Common ===
public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

// === Earnings ===
public record EarningsDto(
    decimal TotalEarnings, decimal MonthlyEarnings, decimal PendingPayouts,
    int TotalTrips, List<MonthlyEarningDto> MonthlyBreakdown,
    List<CarEarningDto> ByCarBreakdown);

public record MonthlyEarningDto(int Year, int Month, decimal Amount, int Trips);
public record CarEarningDto(Guid CarId, string CarTitle, decimal TotalEarnings, int TripCount);
