using System.Security.Claims;
using System.Text.Json;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Host;
using CarSharing.Api.Services.Notifications;
using CarSharing.Api.Services.Payments;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/host")]
[Authorize]
public class HostController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IHostEligibilityService _eligibility;
    private readonly IListingReviewService _listingReview;
    private readonly IPaymentService _paymentService;
    private readonly IPhotoStorage _photoStorage;
    private readonly INotificationService _notifications;
    private readonly IBalanceService _balance;
    private readonly IDataProtector _protector;

    public HostController(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        IHostEligibilityService eligibility,
        IListingReviewService listingReview,
        IPaymentService paymentService,
        IPhotoStorage photoStorage,
        INotificationService notifications,
        IBalanceService balance,
        IDataProtectionProvider dataProtectionProvider)
    {
        _db = db;
        _userManager = userManager;
        _eligibility = eligibility;
        _listingReview = listingReview;
        _paymentService = paymentService;
        _photoStorage = photoStorage;
        _notifications = notifications;
        _balance = balance;
        _protector = dataProtectionProvider.CreateProtector("HostPayoutSecrets");
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Eligibility ─────────────────────────────────────────────────────────

    [HttpGet("eligibility")]
    public async Task<ActionResult<EligibilityDto>> GetEligibility()
    {
        var result = await _eligibility.CheckEligibilityAsync(CurrentUserId);
        return Ok(new EligibilityDto(result.CanList, result.Missing));
    }

    // ─── Onboarding ──────────────────────────────────────────────────────────

    [HttpPost("onboarding/identity/confirm")]
    public async Task<IActionResult> ConfirmIdentity()
    {
        var user = await _db.Users
            .Include(u => u.KycVerifications)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId);

        if (user == null) return NotFound();

        var latestKyc = user.KycVerifications.OrderByDescending(k => k.CreatedAt).FirstOrDefault();
        if (latestKyc == null || latestKyc.Status != KycStatus.Approved)
            return BadRequest(new { message = "Identity verification not approved" });

        if (user.HostOnboardingStatus == HostOnboardingStatus.NotStarted)
        {
            user.HostOnboardingStatus = HostOnboardingStatus.IdentityConfirmed;
            await _userManager.UpdateAsync(user);
        }

        return Ok(new { status = user.HostOnboardingStatus.ToString() });
    }

    [HttpPost("onboarding/payout")]
    public async Task<IActionResult> AttachPayoutMethod([FromBody] AttachPayoutMethodRequest request)
    {
        var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
        if (user == null) return NotFound();

        if (user.HostOnboardingStatus == HostOnboardingStatus.NotStarted)
            return BadRequest(new { message = "Complete identity confirmation first" });

        var providerRef = await _paymentService.AttachPayoutMethodAsync(
            CurrentUserId, request.Type, request.TokenizedDetails);

        var encryptedRef = _protector.Protect(providerRef);

        if (!Enum.TryParse<PayoutMethodType>(request.Type, out var methodType))
            return BadRequest(new { message = "Invalid payout method type" });

        var method = new PayoutMethod
        {
            UserId = CurrentUserId,
            Type = methodType,
            Brand = request.Brand,
            Last4 = request.Last4,
            HolderName = request.HolderName,
            BankName = request.BankName,
            ProviderReference = encryptedRef,
            IsDefault = true,
        };

        // Clear any previous default
        var existing = await _db.PayoutMethods.Where(p => p.UserId == CurrentUserId).ToListAsync();
        foreach (var e in existing) e.IsDefault = false;

        _db.PayoutMethods.Add(method);

        user.HostPayoutMethodId = method.Id;
        if (user.HostOnboardingStatus < HostOnboardingStatus.PayoutAdded)
            user.HostOnboardingStatus = HostOnboardingStatus.PayoutAdded;

        await _db.SaveChangesAsync();
        await _userManager.UpdateAsync(user);

        return Ok(MapPayoutMethod(method));
    }

    [HttpGet("onboarding/payout-methods")]
    public async Task<ActionResult<List<PayoutMethodDto>>> GetPayoutMethods()
    {
        var methods = await _db.PayoutMethods
            .Where(p => p.UserId == CurrentUserId)
            .OrderByDescending(p => p.IsDefault)
            .ThenByDescending(p => p.AddedAt)
            .ToListAsync();

        return Ok(methods.Select(MapPayoutMethod).ToList());
    }

    [HttpDelete("onboarding/payout-methods/{id:guid}")]
    public async Task<IActionResult> DeletePayoutMethod(Guid id)
    {
        var method = await _db.PayoutMethods
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == CurrentUserId);
        if (method == null) return NotFound();

        _db.PayoutMethods.Remove(method);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("onboarding/agreement")]
    public async Task<IActionResult> SignAgreement([FromBody] SignAgreementRequest request)
    {
        var user = await _userManager.FindByIdAsync(CurrentUserId.ToString());
        if (user == null) return NotFound();

        if (user.HostOnboardingStatus < HostOnboardingStatus.PayoutAdded)
            return BadRequest(new { message = "Add a payout method first" });

        user.HostAgreementSignedAt = DateTimeOffset.UtcNow;
        user.HostAgreementVersion = request.Version;
        user.HostOnboardingStatus = HostOnboardingStatus.Complete;

        await _userManager.UpdateAsync(user);

        await _notifications.CreateAsync(
            CurrentUserId,
            NotificationType.HostOnboardingStepCompleted,
            "Host setup complete!",
            "You can now list your car.",
            "/host");

        return Ok(new { status = "Complete" });
    }

    // ─── VIN availability ────────────────────────────────────────────────────

    [HttpGet("cars/vin-available")]
    public async Task<ActionResult<VinAvailableResponse>> CheckVin([FromQuery] string vin)
    {
        if (string.IsNullOrWhiteSpace(vin) || vin.Length != 17)
            return BadRequest(new { message = "VIN must be 17 characters" });

        var exists = await _db.Cars.AnyAsync(c =>
            c.Vin == vin.ToUpperInvariant() && c.Status != CarStatus.Removed);

        return Ok(new VinAvailableResponse(!exists));
    }

    // ─── Car Drafts ──────────────────────────────────────────────────────────

    [HttpPost("cars/drafts")]
    public async Task<ActionResult<CarDraftDto>> CreateDraft()
    {
        await _eligibility.AssertCanListAsync(CurrentUserId);

        var draft = new CarDraft { UserId = CurrentUserId };
        _db.CarDrafts.Add(draft);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDraft), new { id = draft.Id }, MapDraft(draft));
    }

    [HttpGet("cars/drafts/{id:guid}")]
    public async Task<ActionResult<CarDraftDto>> GetDraft(Guid id)
    {
        var draft = await _db.CarDrafts
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == CurrentUserId);

        if (draft == null) return NotFound();
        return Ok(MapDraft(draft));
    }

    [HttpGet("cars/drafts")]
    public async Task<ActionResult<List<CarDraftDto>>> GetDrafts()
    {
        var drafts = await _db.CarDrafts
            .Where(d => d.UserId == CurrentUserId)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync();

        return Ok(drafts.Select(MapDraft).ToList());
    }

    [HttpPatch("cars/drafts/{id:guid}")]
    public async Task<ActionResult<CarDraftDto>> PatchDraft(Guid id, [FromBody] PatchDraftRequest req)
    {
        var draft = await _db.CarDrafts
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == CurrentUserId);

        if (draft == null) return NotFound();

        if (req.PlateNumber != null) draft.PlateNumber = req.PlateNumber.ToUpperInvariant();
        if (req.Vin != null) draft.Vin = req.Vin.ToUpperInvariant();
        if (req.Make != null) draft.Make = req.Make;
        if (req.Model != null) draft.Model = req.Model;
        if (req.Year != null) draft.Year = req.Year;
        if (req.Trim != null) draft.Trim = req.Trim;
        if (req.Color != null) draft.Color = req.Color;
        if (req.OdometerKm != null) draft.OdometerKm = req.OdometerKm;
        if (req.Transmission != null && Enum.TryParse<Transmission>(req.Transmission, out var tx)) draft.Transmission = tx;
        if (req.FuelType != null && Enum.TryParse<FuelType>(req.FuelType, out var ft)) draft.FuelType = ft;
        if (req.Seats != null) draft.Seats = req.Seats;
        if (req.Doors != null) draft.Doors = req.Doors;
        if (req.BodyType != null && Enum.TryParse<BodyType>(req.BodyType, out var bt)) draft.BodyType = bt;
        if (req.OwnershipRelation != null && Enum.TryParse<OwnershipRelation>(req.OwnershipRelation, out var or)) draft.OwnershipRelation = or;
        if (req.InsurancePolicyUrl != null) draft.InsurancePolicyUrl = req.InsurancePolicyUrl;
        if (req.InsuranceExpiry != null) draft.InsuranceExpiry = req.InsuranceExpiry;
        if (req.TechnicalInspectionUrl != null) draft.TechnicalInspectionUrl = req.TechnicalInspectionUrl;
        if (req.TechnicalInspectionExpiry != null) draft.TechnicalInspectionExpiry = req.TechnicalInspectionExpiry;
        if (req.GpsTrackerInstalled != null) draft.GpsTrackerInstalled = req.GpsTrackerInstalled.Value;
        if (req.PhotosJson != null) draft.PhotosJson = req.PhotosJson;
        if (req.AddressLine != null) draft.AddressLine = req.AddressLine;
        if (req.City != null) draft.City = req.City;
        if (req.Region != null) draft.Region = req.Region;
        if (req.PostalCode != null) draft.PostalCode = req.PostalCode;
        if (req.Lat != null) draft.Lat = req.Lat;
        if (req.Lng != null) draft.Lng = req.Lng;
        if (req.PrivacyRadiusMeters != null) draft.PrivacyRadiusMeters = req.PrivacyRadiusMeters.Value;
        if (req.CanDeliverToAirports != null) draft.CanDeliverToAirports = req.CanDeliverToAirports.Value;
        if (req.DeliveryLocationsJson != null) draft.DeliveryLocationsJson = req.DeliveryLocationsJson;
        if (req.SelfCheckInAvailable != null) draft.SelfCheckInAvailable = req.SelfCheckInAvailable.Value;
        if (req.SelfCheckInMethod != null) draft.SelfCheckInMethod = req.SelfCheckInMethod;
        if (req.AdvanceNoticeHours != null) draft.AdvanceNoticeHours = req.AdvanceNoticeHours.Value;
        if (req.MinTripDays != null) draft.MinTripDays = req.MinTripDays.Value;
        if (req.MaxTripDays != null) draft.MaxTripDays = req.MaxTripDays.Value;
        if (req.BlockedDatesJson != null) draft.BlockedDatesJson = req.BlockedDatesJson;
        if (req.DailyPriceUzs != null) draft.DailyPriceUzs = req.DailyPriceUzs;
        if (req.WeeklyDiscountPercent != null) draft.WeeklyDiscountPercent = req.WeeklyDiscountPercent.Value;
        if (req.MonthlyDiscountPercent != null) draft.MonthlyDiscountPercent = req.MonthlyDiscountPercent.Value;
        if (req.CleaningFeeUzs != null) draft.CleaningFeeUzs = req.CleaningFeeUzs.Value;
        if (req.SecurityDepositUzs != null) draft.SecurityDepositUzs = req.SecurityDepositUzs.Value;
        if (req.DailyKmLimit != null) draft.DailyKmLimit = req.DailyKmLimit.Value;
        if (req.ExtraKmFeeUzs != null) draft.ExtraKmFeeUzs = req.ExtraKmFeeUzs.Value;
        if (req.Rules != null) draft.Rules = req.Rules;
        if (req.CustomRules != null) draft.CustomRules = req.CustomRules;
        if (req.IsInstantBook != null) draft.IsInstantBook = req.IsInstantBook.Value;
        if (req.Description != null) draft.Description = req.Description;
        if (req.CurrentStep != null && Enum.TryParse<CarDraftStep>(req.CurrentStep, out var step)) draft.CurrentStep = step;
        if (req.Features != null) draft.FeaturesJson = JsonSerializer.Serialize(req.Features);

        // Auto-detect vehicle tier from price
        draft.VehicleTier = DetectTier(draft.DailyPriceUzs ?? 0);

        await _db.SaveChangesAsync();
        return Ok(MapDraft(draft));
    }

    [HttpPost("cars/drafts/{id:guid}/documents")]
    public async Task<IActionResult> UploadDocument(Guid id, [FromForm] IFormFile file, [FromForm] string category)
    {
        var draft = await _db.CarDrafts
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == CurrentUserId);
        if (draft == null) return NotFound();

        using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, $"host-docs/{id}");

        var doc = new CarDraftDocument
        {
            CarDraftId = id,
            Category = category,
            Url = result.Url,
            PublicId = result.PublicId,
            OriginalFileName = file.FileName
        };
        _db.CarDraftDocuments.Add(doc);
        await _db.SaveChangesAsync();

        return Ok(new { docId = doc.Id, url = result.Url, category });
    }

    [HttpDelete("cars/drafts/{id:guid}/documents/{docId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id, Guid docId)
    {
        var doc = await _db.CarDraftDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.CarDraftId == id);
        if (doc == null) return NotFound();

        if (doc.PublicId != null)
            await _photoStorage.DeleteAsync(doc.PublicId);

        _db.CarDraftDocuments.Remove(doc);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("cars/drafts/{id:guid}/submit")]
    public async Task<ActionResult<SubmitDraftResponse>> SubmitDraft(Guid id)
    {
        await _eligibility.AssertCanListAsync(CurrentUserId);

        var draft = await _db.CarDrafts
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == CurrentUserId);
        if (draft == null) return NotFound();

        // Resolve documents uploaded via CarDraftDocument rows into draft URL fields
        var draftDocs = await _db.CarDraftDocuments
            .Where(d => d.CarDraftId == id)
            .ToListAsync();

        foreach (var doc in draftDocs)
        {
            switch (doc.Category.ToLower())
            {
                case "techpassportfront":   draft.TechPassportFrontUrl      = doc.Url; break;
                case "techpassportback":    draft.TechPassportBackUrl       = doc.Url; break;
                case "insurancepolicy":     draft.InsurancePolicyUrl        = doc.Url; break;
                case "technicalinspection": draft.TechnicalInspectionUrl    = doc.Url; break;
                case "authorizationletter": draft.AuthorizationLetterUrl    = doc.Url; break;
                case "gpstracker":          draft.GpsTrackerPhotoUrl        = doc.Url; break;
            }
        }

        // Basic validation
        if (string.IsNullOrEmpty(draft.Make) || string.IsNullOrEmpty(draft.Vin) || draft.DailyPriceUzs == null)
            return BadRequest(new { message = "Draft is incomplete" });

        var user = await _db.Users.FindAsync(CurrentUserId);
        if (user == null) return NotFound();

        // Build price in USD for backward compat (1 USD ~ 12800 UZS rough estimate)
        const decimal UzsToUsd = 12800m;
        var dailyUsd = (draft.DailyPriceUzs ?? 0) / UzsToUsd;

        Point? location = null;
        if (draft.Lat.HasValue && draft.Lng.HasValue)
            location = new Point((double)draft.Lng.Value, (double)draft.Lat.Value) { SRID = 4326 };

        var tier = draft.VehicleTier ?? VehicleTier.Economy;

        var car = new Car
        {
            OwnerId = CurrentUserId,
            Make = draft.Make!,
            Model = draft.Model ?? "",
            Year = draft.Year ?? 2020,
            Trim = draft.Trim,
            Vin = draft.Vin,
            LicensePlate = draft.PlateNumber,
            Color = draft.Color,
            OdometerKm = draft.OdometerKm,
            BodyType = draft.BodyType ?? BodyType.Sedan,
            Transmission = draft.Transmission ?? Transmission.Automatic,
            FuelType = draft.FuelType ?? FuelType.Gasoline,
            Seats = draft.Seats ?? 5,
            Doors = draft.Doors ?? 4,
            DailyPriceUsd = dailyUsd,
            WeeklyDiscountPercent = draft.WeeklyDiscountPercent,
            MonthlyDiscountPercent = draft.MonthlyDiscountPercent,
            CleaningFeeUsd = draft.CleaningFeeUzs / UzsToUsd,
            SecurityDepositUsd = draft.SecurityDepositUzs / UzsToUsd,
            MinTripDays = draft.MinTripDays,
            MaxTripDays = draft.MaxTripDays,
            AdvanceNoticeHours = draft.AdvanceNoticeHours,
            DailyMileageLimitKm = draft.DailyKmLimit,
            AddressLine = draft.AddressLine,
            City = draft.City ?? "",
            Region = draft.Region,
            Country = "UZ",
            PostalCode = draft.PostalCode,
            Location = location,
            Description = draft.Description,
            Rules = draft.Rules,
            IsInstantBook = draft.IsInstantBook,
            VehicleTier = tier,
            InsurancePolicyUrl = draft.InsurancePolicyUrl,
            InsuranceExpiry = draft.InsuranceExpiry,
            TechnicalInspectionUrl = draft.TechnicalInspectionUrl,
            TechnicalInspectionExpiry = draft.TechnicalInspectionExpiry,
            OwnershipRelation = draft.OwnershipRelation ?? OwnershipRelation.RegisteredOwner,
            TechPassportFrontUrl = draft.TechPassportFrontUrl,
            TechPassportBackUrl = draft.TechPassportBackUrl,
            GpsTrackerInstalled = draft.GpsTrackerInstalled,
            OcrExtractedVin = draft.OcrExtractedVin,
            PrivacyRadiusMeters = draft.PrivacyRadiusMeters,
            CanDeliverToAirports = draft.CanDeliverToAirports,
            DeliveryLocationsJson = draft.DeliveryLocationsJson,
            SelfCheckInAvailable = draft.SelfCheckInAvailable,
            SelfCheckInMethod = draft.SelfCheckInMethod,
        };

        _db.Cars.Add(car);

        // Create CarPhoto records from draft document uploads
        var photoDocs = draftDocs
            .Where(d => d.Category.Equals("photo", StringComparison.OrdinalIgnoreCase))
            .ToList();
        for (int i = 0; i < photoDocs.Count; i++)
        {
            _db.CarPhotos.Add(new CarPhoto
            {
                CarId = car.Id,
                Url = photoDocs[i].Url,
                PublicId = photoDocs[i].PublicId,
                SortOrder = i,
                IsCover = i == 0,
            });
        }

        // Attach features from draft
        if (!string.IsNullOrEmpty(draft.FeaturesJson))
        {
            var featureNames = JsonSerializer.Deserialize<List<string>>(draft.FeaturesJson);
            if (featureNames?.Count > 0)
            {
                var dbFeatures = await _db.Features
                    .Where(f => featureNames.Contains(f.Name))
                    .ToListAsync();
                foreach (var feature in dbFeatures)
                    _db.CarFeatures.Add(new CarFeature { CarId = car.Id, FeatureId = feature.Id });
            }
        }

        // Run auto-checks
        var review = await _listingReview.RunAutoChecksAsync(car, user);
        user.FraudRiskScore = review.FraudScore;

        car.Status = review.CanAutoApprove ? CarStatus.Listed : CarStatus.PendingApproval;
        car.RequiresManualReview = tier is VehicleTier.Premium or VehicleTier.Luxury || !review.CanAutoApprove;

        _db.CarDrafts.Remove(draft);
        await _db.SaveChangesAsync();

        var statusText = car.Status == CarStatus.Listed ? "Listed" : "PendingApproval";
        var estimatedMinutes = review.CanAutoApprove ? 0 : 60;

        await _notifications.CreateAsync(
            CurrentUserId,
            NotificationType.ListingSubmitted,
            "Listing submitted for review",
            $"Your {car.Make} {car.Model} has been submitted.",
            $"/host/cars/{car.Id}");

        return Ok(new SubmitDraftResponse(car.Id, statusText, estimatedMinutes));
    }

    // ─── Host Cars ───────────────────────────────────────────────────────────

    [HttpGet("cars")]
    public async Task<IActionResult> GetMyCars([FromQuery] string? status, [FromQuery] int page = 1)
    {
        var query = _db.Cars
            .Include(c => c.Photos)
            .Where(c => c.OwnerId == CurrentUserId);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CarStatus>(status, out var cs))
            query = query.Where(c => c.Status == cs);

        var total = await query.CountAsync();
        var cars = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * 20)
            .Take(20)
            .ToListAsync();

        return Ok(new { total, page, items = cars.Select(c => new {
            c.Id, c.Make, c.Model, c.Year, c.Status, c.VehicleTier,
            c.DailyPriceUsd, c.AverageRating, c.TripCount,
            CoverPhotoUrl = c.Photos.FirstOrDefault(p => p.IsCover)?.Url ?? c.Photos.FirstOrDefault()?.Url
        })});
    }

    [HttpGet("cars/{id:guid}")]
    public async Task<IActionResult> GetCar(Guid id)
    {
        var car = await _db.Cars
            .Include(c => c.Photos)
            .Include(c => c.CarFeatures).ThenInclude(cf => cf.Feature)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);

        if (car == null) return NotFound();

        const decimal UsdToUzs = 12800m;
        return Ok(new {
            car.Id, car.Make, car.Model, car.Year, car.Trim, car.Color,
            car.OdometerKm, car.Status, car.VehicleTier,
            car.BodyType, car.Transmission, car.FuelType, car.Seats, car.Doors,
            DailyPriceUzs        = Math.Round(car.DailyPriceUsd * UsdToUzs),
            CleaningFeeUzs       = Math.Round(car.CleaningFeeUsd * UsdToUzs),
            SecurityDepositUzs   = Math.Round(car.SecurityDepositUsd * UsdToUzs),
            ExtraKmFeeUzs        = car.ExtraKmFeeUsd.HasValue ? Math.Round(car.ExtraKmFeeUsd.Value * UsdToUzs) : (decimal?)null,
            car.WeeklyDiscountPercent, car.MonthlyDiscountPercent,
            car.MinTripDays, car.MaxTripDays, car.AdvanceNoticeHours,
            car.DailyMileageLimitKm, car.IsInstantBook,
            car.Description, car.Rules,
            CoverPhotoUrl = car.Photos.FirstOrDefault(p => p.IsCover)?.Url ?? car.Photos.FirstOrDefault()?.Url,
            Photos = car.Photos.OrderBy(p => p.SortOrder).Select(p => new { p.Id, p.Url, p.IsCover, p.SortOrder }).ToList(),
            car.AddressLine, car.City,
            Lat = car.Location != null ? (double?)car.Location.Y : null,
            Lng = car.Location != null ? (double?)car.Location.X : null,
            car.PrivacyRadiusMeters, car.CanDeliverToAirports,
            car.SelfCheckInAvailable, car.GpsTrackerInstalled,
            Features = car.CarFeatures.Select(cf => cf.Feature.Name).ToList(),
        });
    }

    // ─── Car Photo Management ────────────────────────────────────────────────

    [HttpPost("cars/{id:guid}/photos")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadCarPhoto(Guid id, [FromForm] IFormFile file)
    {
        var car = await _db.Cars.Include(c => c.Photos)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();

        if (!file.ContentType.StartsWith("image/"))
            return BadRequest(new { message = "Only image files are allowed." });

        await using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, $"cars/{id}");

        var nextOrder = car.Photos.Any() ? car.Photos.Max(p => p.SortOrder) + 1 : 0;
        var isCover = !car.Photos.Any();
        var photo = new CarPhoto { CarId = car.Id, Url = result.Url, PublicId = result.PublicId, SortOrder = nextOrder, IsCover = isCover };
        _db.CarPhotos.Add(photo);
        await _db.SaveChangesAsync();

        return Ok(new { photo.Id, photo.Url, photo.IsCover, photo.SortOrder });
    }

    [HttpDelete("cars/{id:guid}/photos/{photoId:guid}")]
    public async Task<IActionResult> DeleteCarPhoto(Guid id, Guid photoId)
    {
        var car = await _db.Cars.Include(c => c.Photos)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();

        var photo = car.Photos.FirstOrDefault(p => p.Id == photoId);
        if (photo == null) return NotFound();

        if (photo.PublicId != null)
            await _photoStorage.DeleteAsync(photo.PublicId);

        _db.CarPhotos.Remove(photo);

        // If we removed the cover, promote the next photo
        if (photo.IsCover)
        {
            var next = car.Photos.Where(p => p.Id != photoId).OrderBy(p => p.SortOrder).FirstOrDefault();
            if (next != null) next.IsCover = true;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("cars/{id:guid}/photos/{photoId:guid}/cover")]
    public async Task<IActionResult> SetCarPhotoCover(Guid id, Guid photoId)
    {
        var car = await _db.Cars.Include(c => c.Photos)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();

        foreach (var p in car.Photos)
            p.IsCover = p.Id == photoId;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("cars/{id:guid}/snooze")]
    public async Task<IActionResult> SnoozeCar(Guid id)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();
        car.Status = CarStatus.Snoozed;
        await _db.SaveChangesAsync();
        return Ok(new { status = "Snoozed" });
    }

    [HttpPost("cars/{id:guid}/unsnooze")]
    public async Task<IActionResult> UnsnoozeCar(Guid id)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();
        car.Status = CarStatus.Listed;
        await _db.SaveChangesAsync();
        return Ok(new { status = "Listed" });
    }

    [HttpPost("cars/{id:guid}/unlist")]
    public async Task<IActionResult> UnlistCar(Guid id)
    {
        var car = await _db.Cars.FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();
        car.Status = CarStatus.Removed;
        await _db.SaveChangesAsync();
        return Ok(new { status = "Removed" });
    }

    [HttpPatch("cars/{id:guid}")]
    public async Task<IActionResult> PatchCar(Guid id, [FromBody] HostPatchCarRequest req)
    {
        var car = await _db.Cars
            .Include(c => c.CarFeatures)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();

        const decimal UzsToUsd = 12800m;

        // Vehicle identity
        if (req.Make != null) car.Make = req.Make;
        if (req.Model != null) car.Model = req.Model;
        if (req.Year.HasValue) car.Year = req.Year.Value;
        if (req.Trim != null) car.Trim = req.Trim;
        if (req.Transmission != null && Enum.TryParse<Transmission>(req.Transmission, out var tr)) car.Transmission = tr;
        if (req.BodyType != null && Enum.TryParse<BodyType>(req.BodyType, out var bt)) car.BodyType = bt;
        if (req.FuelType != null && Enum.TryParse<FuelType>(req.FuelType, out var ft)) car.FuelType = ft;
        if (req.Seats.HasValue) car.Seats = req.Seats.Value;
        if (req.Doors.HasValue) car.Doors = req.Doors.Value;

        // Pricing
        if (req.DailyPriceUzs.HasValue) { car.DailyPriceUsd = req.DailyPriceUzs.Value / UzsToUsd; car.VehicleTier = DetectTier(req.DailyPriceUzs.Value); }
        if (req.CleaningFeeUzs.HasValue)   car.CleaningFeeUsd         = req.CleaningFeeUzs.Value / UzsToUsd;
        if (req.SecurityDepositUzs.HasValue) car.SecurityDepositUsd   = req.SecurityDepositUzs.Value / UzsToUsd;
        if (req.ExtraKmFeeUzs.HasValue)    car.ExtraKmFeeUsd          = req.ExtraKmFeeUzs.Value / UzsToUsd;
        if (req.WeeklyDiscountPercent.HasValue)  car.WeeklyDiscountPercent  = req.WeeklyDiscountPercent.Value;
        if (req.MonthlyDiscountPercent.HasValue) car.MonthlyDiscountPercent = req.MonthlyDiscountPercent.Value;
        if (req.MinTripDays.HasValue)        car.MinTripDays           = req.MinTripDays.Value;
        if (req.MaxTripDays.HasValue)        car.MaxTripDays           = req.MaxTripDays.Value;
        if (req.AdvanceNoticeHours.HasValue) car.AdvanceNoticeHours    = req.AdvanceNoticeHours.Value;
        if (req.DailyMileageLimitKm.HasValue) car.DailyMileageLimitKm = req.DailyMileageLimitKm.Value;
        if (req.Description != null)         car.Description           = req.Description;
        if (req.Rules != null)               car.Rules                 = req.Rules;
        if (req.IsInstantBook.HasValue)      car.IsInstantBook         = req.IsInstantBook.Value;
        if (req.Color != null)               car.Color                 = req.Color;
        if (req.OdometerKm.HasValue)         car.OdometerKm            = req.OdometerKm.Value;

        // Location
        if (req.AddressLine != null) car.AddressLine = req.AddressLine;
        if (req.City != null) car.City = req.City;
        if (req.Lat.HasValue && req.Lng.HasValue)
            car.Location = new Point(req.Lng.Value, req.Lat.Value) { SRID = 4326 };
        if (req.PrivacyRadiusMeters.HasValue) car.PrivacyRadiusMeters = req.PrivacyRadiusMeters.Value;
        if (req.CanDeliverToAirports.HasValue) car.CanDeliverToAirports = req.CanDeliverToAirports.Value;
        if (req.SelfCheckInAvailable.HasValue) car.SelfCheckInAvailable = req.SelfCheckInAvailable.Value;
        if (req.GpsTrackerInstalled.HasValue) car.GpsTrackerInstalled = req.GpsTrackerInstalled.Value;

        // Features
        if (req.Features != null)
        {
            _db.CarFeatures.RemoveRange(car.CarFeatures);
            var featureEnts = await _db.Features.Where(f => req.Features.Contains(f.Name)).ToListAsync();
            foreach (var feat in featureEnts)
                _db.CarFeatures.Add(new CarFeature { CarId = car.Id, FeatureId = feat.Id });
        }

        await _db.SaveChangesAsync();
        return Ok(new { car.Id, car.Make, car.Model, car.Year, car.Status, car.VehicleTier });
    }

    [HttpGet("features")]
    public async Task<ActionResult<List<string>>> GetAvailableFeatures()
    {
        var names = await _db.Features.OrderBy(f => f.Name).Select(f => f.Name).ToListAsync();
        return Ok(names);
    }

    [HttpDelete("cars/{id:guid}")]
    public async Task<IActionResult> DeleteCar(Guid id)
    {
        var car = await _db.Cars
            .Include(c => c.Bookings)
            .FirstOrDefaultAsync(c => c.Id == id && c.OwnerId == CurrentUserId);
        if (car == null) return NotFound();

        var activeStatuses = new[] { BookingStatus.PendingApproval, BookingStatus.Confirmed, BookingStatus.InProgress };
        var hasActive = car.Bookings.Any(b => activeStatuses.Contains(b.Status));
        if (hasActive)
            return BadRequest(new { message = "Cannot delete a car with active bookings." });

        car.Status = CarStatus.Removed;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Host Dashboard Metrics ──────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var hostId = CurrentUserId;
        var now = DateTimeOffset.UtcNow;
        var startOfMonth = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        // Include all non-cancelled, non-rejected bookings for revenue reporting
        // (host is credited at approval time, not only when trip ends)
        var activeStatuses = new[] {
            BookingStatus.Confirmed, BookingStatus.InProgress, BookingStatus.Completed
        };
        var allActive = await _db.Bookings
            .Include(b => b.Car)
            .Where(b => b.Car.OwnerId == hostId && activeStatuses.Contains(b.Status))
            .ToListAsync();

        // Use ConfirmedAt as the revenue date (when money was actually transferred)
        var thisMonthRevenue = allActive
            .Where(b => (b.ConfirmedAt ?? b.CreatedAt) >= startOfMonth)
            .Sum(b => b.HostPayoutUsd);

        var lastMonthRevenue = allActive
            .Where(b => (b.ConfirmedAt ?? b.CreatedAt) >= startOfLastMonth
                     && (b.ConfirmedAt ?? b.CreatedAt) < startOfMonth)
            .Sum(b => b.HostPayoutUsd);

        var upcomingTrips = await _db.Bookings
            .Include(b => b.Car)
            .CountAsync(b => b.Car.OwnerId == hostId &&
                b.Status == BookingStatus.Confirmed &&
                b.StartUtc >= now);

        var myCars = await _db.Cars
            .Where(c => c.OwnerId == hostId && c.Status == CarStatus.Listed)
            .CountAsync();

        var thirtyDaysAgo = now.AddDays(-30);
        var totalDays = myCars * 30;
        var bookedDays = await _db.Bookings
            .Include(b => b.Car)
            .Where(b => b.Car.OwnerId == hostId &&
                b.Status != BookingStatus.Rejected &&
                b.Status != BookingStatus.CancelledByGuest &&
                b.Status != BookingStatus.CancelledByHost &&
                b.StartUtc >= thirtyDaysAgo)
            .SumAsync(b => (int)Math.Round((b.EndUtc - b.StartUtc).TotalDays));

        var occupancy = totalDays > 0 ? (double)bookedDays / totalDays * 100 : 0;

        var avgRating = await _db.Reviews
            .Include(r => r.Car)
            .Where(r => r.Car != null && r.Car.OwnerId == hostId && r.AuthorRole == ReviewAuthorRole.Guest)
            .AverageAsync(r => (double?)r.Rating) ?? 0;

        // Monthly revenue for the last 6 months
        var sixMonthsAgo = startOfMonth.AddMonths(-5);
        var monthlyRevenue = allActive
            .Where(b => (b.ConfirmedAt ?? b.CreatedAt) >= sixMonthsAgo)
            .GroupBy(b => new
            {
                (b.ConfirmedAt ?? b.CreatedAt).Year,
                (b.ConfirmedAt ?? b.CreatedAt).Month
            })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Revenue = g.Sum(b => b.HostPayoutUsd),
                Trips = g.Count()
            })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToList();

        // Fill missing months with zero
        var monthlyChart = Enumerable.Range(0, 6)
            .Select(i => startOfMonth.AddMonths(-5 + i))
            .Select(m =>
            {
                var entry = monthlyRevenue.FirstOrDefault(x => x.Year == m.Year && x.Month == m.Month);
                return new
                {
                    Label = m.ToString("MMM"),
                    Revenue = entry?.Revenue ?? 0m,
                    Trips = entry?.Trips ?? 0
                };
            })
            .ToList();

        // Top cars by revenue
        var topCars = allActive
            .GroupBy(b => b.Car)
            .Select(g => new
            {
                CarId = g.Key.Id,
                Name = $"{g.Key.Year} {g.Key.Make} {g.Key.Model}",
                Revenue = g.Sum(b => b.HostPayoutUsd),
                Trips = g.Count()
            })
            .OrderByDescending(c => c.Revenue)
            .Take(5)
            .ToList();

        // Wallet balance
        var walletBalance = await _db.AccountBalances
            .Where(b => b.UserId == hostId)
            .Select(b => new { b.AvailableUzs, b.LockedUzs })
            .FirstOrDefaultAsync();

        // Pending bookings count
        var pendingApprovals = await _db.Bookings
            .Include(b => b.Car)
            .CountAsync(b => b.Car.OwnerId == hostId && b.Status == BookingStatus.PendingApproval);

        const decimal usdToUzs = 12_800m;

        return Ok(new
        {
            RevenueThisMonth = thisMonthRevenue * usdToUzs,
            LastMonthRevenue = lastMonthRevenue * usdToUzs,
            UpcomingTrips = upcomingTrips,
            Occupancy = Math.Round(occupancy, 1),
            AverageRating = Math.Round(avgRating, 2),
            PendingApprovals = pendingApprovals,
            WalletBalance = walletBalance?.AvailableUzs ?? 0m,
            MonthlyChart = monthlyChart.Select(m => new
            {
                m.Label,
                Revenue = m.Revenue * usdToUzs,
                m.Trips
            }),
            TopCars = topCars.Select(c => new
            {
                c.CarId,
                c.Name,
                Revenue = c.Revenue * usdToUzs,
                c.Trips
            }),
        });
    }

    // ─── Host Wallet ─────────────────────────────────────────────────────────

    [HttpGet("wallet")]
    public async Task<IActionResult> GetWallet()
    {
        var balance = await _balance.GetBalanceAsync(CurrentUserId);
        return Ok(balance);
    }

    [HttpGet("wallet/ledger")]
    public async Task<IActionResult> GetWalletLedger([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var ledger = await _balance.GetLedgerAsync(CurrentUserId, page, pageSize);
        return Ok(ledger);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private static VehicleTier DetectTier(decimal dailyPriceUzs) =>
        dailyPriceUzs >= 10_000_000m ? VehicleTier.Luxury  :
        dailyPriceUzs >=  5_000_000m ? VehicleTier.Premium :
        dailyPriceUzs >=  2_000_000m ? VehicleTier.Standard:
                                        VehicleTier.Economy;

    private static PayoutMethodDto MapPayoutMethod(PayoutMethod m) => new()
    {
        Id = m.Id,
        Type = m.Type.ToString(),
        Brand = m.Brand,
        Last4 = m.Last4,
        HolderName = m.HolderName,
        BankName = m.BankName,
        IsDefault = m.IsDefault,
        AddedAt = m.AddedAt,
    };

    private static CarDraftDto MapDraft(CarDraft d) => new()
    {
        Id = d.Id,
        CurrentStep = d.CurrentStep.ToString(),
        PlateNumber = d.PlateNumber,
        Vin = d.Vin,
        Make = d.Make,
        Model = d.Model,
        Year = d.Year,
        Trim = d.Trim,
        Color = d.Color,
        OdometerKm = d.OdometerKm,
        Transmission = d.Transmission?.ToString(),
        FuelType = d.FuelType?.ToString(),
        Seats = d.Seats,
        Doors = d.Doors,
        BodyType = d.BodyType?.ToString(),
        VehicleTier = d.VehicleTier?.ToString(),
        OwnershipRelation = d.OwnershipRelation?.ToString(),
        InsurancePolicyUrl = d.InsurancePolicyUrl,
        InsuranceExpiry = d.InsuranceExpiry,
        TechnicalInspectionUrl = d.TechnicalInspectionUrl,
        TechnicalInspectionExpiry = d.TechnicalInspectionExpiry,
        GpsTrackerInstalled = d.GpsTrackerInstalled,
        PhotosJson = d.PhotosJson,
        AddressLine = d.AddressLine,
        City = d.City,
        Region = d.Region,
        PostalCode = d.PostalCode,
        Lat = d.Lat,
        Lng = d.Lng,
        PrivacyRadiusMeters = d.PrivacyRadiusMeters,
        CanDeliverToAirports = d.CanDeliverToAirports,
        DeliveryLocationsJson = d.DeliveryLocationsJson,
        SelfCheckInAvailable = d.SelfCheckInAvailable,
        SelfCheckInMethod = d.SelfCheckInMethod,
        AdvanceNoticeHours = d.AdvanceNoticeHours,
        MinTripDays = d.MinTripDays,
        MaxTripDays = d.MaxTripDays,
        BlockedDatesJson = d.BlockedDatesJson,
        DailyPriceUzs = d.DailyPriceUzs,
        WeeklyDiscountPercent = d.WeeklyDiscountPercent,
        MonthlyDiscountPercent = d.MonthlyDiscountPercent,
        CleaningFeeUzs = d.CleaningFeeUzs,
        SecurityDepositUzs = d.SecurityDepositUzs,
        DailyKmLimit = d.DailyKmLimit,
        ExtraKmFeeUzs = d.ExtraKmFeeUzs,
        Rules = d.Rules,
        CustomRules = d.CustomRules,
        IsInstantBook = d.IsInstantBook,
        Description = d.Description,
        Features = d.FeaturesJson != null
            ? JsonSerializer.Deserialize<List<string>>(d.FeaturesJson)
            : null,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt,
    };
}
