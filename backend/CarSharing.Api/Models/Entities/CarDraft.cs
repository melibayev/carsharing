using CarSharing.Api.Models.Enums;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Models.Entities;

public class CarDraft : AuditableEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public CarDraftStep CurrentStep { get; set; } = CarDraftStep.VehicleIdentity;

    // Step 1 — Vehicle identity
    public string? PlateNumber { get; set; }
    public string? Vin { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public string? Trim { get; set; }
    public string? Color { get; set; }
    public int? OdometerKm { get; set; }
    public Transmission? Transmission { get; set; }
    public FuelType? FuelType { get; set; }
    public int? Seats { get; set; }
    public int? Doors { get; set; }
    public BodyType? BodyType { get; set; }
    public VehicleTier? VehicleTier { get; set; }

    // Step 2 — Ownership & docs
    public OwnershipRelation? OwnershipRelation { get; set; }
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

    // Step 3 — Photos (stored as JSON array of {url, publicId, slot, sortOrder, isCover})
    public string? PhotosJson { get; set; }

    // Step 4 — Location & availability
    public string? AddressLine { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public string? PostalCode { get; set; }
    public decimal? Lat { get; set; }
    public decimal? Lng { get; set; }
    public Point? Location { get; set; }
    public int PrivacyRadiusMeters { get; set; } = 300;
    public bool CanDeliverToAirports { get; set; }
    public string? DeliveryLocationsJson { get; set; }
    public bool SelfCheckInAvailable { get; set; }
    public string? SelfCheckInMethod { get; set; }
    public int AdvanceNoticeHours { get; set; } = 24;
    public int MinTripDays { get; set; } = 1;
    public int MaxTripDays { get; set; } = 30;
    public string? BlockedDatesJson { get; set; }

    // Step 5 — Pricing & rules
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
}
