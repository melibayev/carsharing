using CarSharing.Api.Models.Enums;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Models.Entities;

public class Car : AuditableEntity
{
    public Guid OwnerId { get; set; }
    public ApplicationUser Owner { get; set; } = null!;

    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Trim { get; set; }
    public string? Vin { get; set; }
    public string? LicensePlate { get; set; }
    public string? LicensePlateRegion { get; set; }

    public BodyType BodyType { get; set; }
    public Transmission Transmission { get; set; }
    public FuelType FuelType { get; set; }
    public int Seats { get; set; } = 5;
    public int Doors { get; set; } = 4;
    public string? Color { get; set; }
    public int? OdometerKm { get; set; }

    public decimal DailyPriceUsd { get; set; }
    public int WeeklyDiscountPercent { get; set; }
    public int MonthlyDiscountPercent { get; set; }
    public decimal CleaningFeeUsd { get; set; }
    public decimal SecurityDepositUsd { get; set; }

    public int MinTripDays { get; set; } = 1;
    public int MaxTripDays { get; set; } = 30;
    public int AdvanceNoticeHours { get; set; } = 24;
    public int? DailyMileageLimitKm { get; set; }
    public decimal? ExtraKmFeeUsd { get; set; }

    public string? AddressLine { get; set; }
    public string City { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string Country { get; set; } = "US";
    public string? PostalCode { get; set; }
    public Point? Location { get; set; }

    public string? Description { get; set; }
    public string? Rules { get; set; }
    public int PrivacyRadiusMeters { get; set; } = 300;
    public bool CanDeliverToAirports { get; set; }
    public string? DeliveryLocationsJson { get; set; }
    public bool SelfCheckInAvailable { get; set; }
    public string? SelfCheckInMethod { get; set; }

    // Ownership
    public OwnershipRelation OwnershipRelation { get; set; } = OwnershipRelation.RegisteredOwner;
    public string? TechPassportFrontUrl { get; set; }
    public string? TechPassportBackUrl { get; set; }
    public string? AuthorizationLetterUrl { get; set; }
    public string? CompanyRegCertUrl { get; set; }
    public string? InsurancePolicyUrl { get; set; }
    public DateTimeOffset? InsuranceExpiry { get; set; }
    public string? TechnicalInspectionUrl { get; set; }
    public DateTimeOffset? TechnicalInspectionExpiry { get; set; }
    public bool GpsTrackerInstalled { get; set; }
    public string? GpsTrackerPhotoUrl { get; set; }
    public string? OcrExtractedVin { get; set; }
    public bool VinMismatchFlagged { get; set; }
    public bool RequiresManualReview { get; set; }

    public CarStatus Status { get; set; } = CarStatus.Draft;
    public bool IsInstantBook { get; set; }
    public VehicleTier VehicleTier { get; set; } = VehicleTier.Economy;
    public decimal AverageRating { get; set; }
    public int TripCount { get; set; }

    public ICollection<CarPhoto> Photos { get; set; } = new List<CarPhoto>();
    public ICollection<CarFeature> CarFeatures { get; set; } = new List<CarFeature>();
    public ICollection<Availability> BlockedDates { get; set; } = new List<Availability>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<FavoriteCar> FavoritedBy { get; set; } = new List<FavoriteCar>();
}
