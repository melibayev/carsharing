using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Host;

public class ListingReviewService : IListingReviewService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ListingReviewService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<ListingReviewResult> RunAutoChecksAsync(Car car, ApplicationUser host)
    {
        var checks = new List<AutoCheckResult>();
        var fraudScore = 0;

        // 1. Duplicate VIN
        if (!string.IsNullOrEmpty(car.Vin))
        {
            var dupVin = await _db.Cars.AnyAsync(c => c.Vin == car.Vin && c.Id != car.Id && c.Status != CarStatus.Removed);
            checks.Add(new AutoCheckResult("DuplicateVIN", !dupVin, dupVin ? "Another listed car has this VIN" : null));
            if (dupVin) fraudScore += 30;
        }

        // 2. Duplicate plate
        if (!string.IsNullOrEmpty(car.LicensePlate))
        {
            var dupPlate = await _db.Cars.AnyAsync(c => c.LicensePlate == car.LicensePlate && c.Id != car.Id && c.Status != CarStatus.Removed);
            checks.Add(new AutoCheckResult("DuplicatePlate", !dupPlate, dupPlate ? "Another listed car has this plate — may need admin confirmation" : null));
            if (dupPlate) fraudScore += 15;
        }

        // 3. Insurance expiry
        if (car.InsuranceExpiry.HasValue)
        {
            var valid = car.InsuranceExpiry.Value > DateTimeOffset.UtcNow.AddDays(30);
            checks.Add(new AutoCheckResult("InsuranceExpiry", valid, valid ? null : "Insurance expires within 30 days"));
            if (!valid) fraudScore += 20;
        }
        else
        {
            checks.Add(new AutoCheckResult("InsuranceExpiry", false, "No insurance expiry date"));
            fraudScore += 20;
        }

        // 4. Photos count
        var photoCount = car.Photos.Count;
        var photosOk = photoCount >= 8;
        checks.Add(new AutoCheckResult("PhotoCount", photosOk, photosOk ? null : $"Only {photoCount}/8 required photos"));

        // 5. VIN OCR consistency
        if (!string.IsNullOrEmpty(car.OcrExtractedVin) && !string.IsNullOrEmpty(car.Vin))
        {
            var match = string.Equals(car.OcrExtractedVin, car.Vin, StringComparison.OrdinalIgnoreCase);
            checks.Add(new AutoCheckResult("VinOcrMatch", match, match ? null : "VIN from OCR doesn't match entered VIN"));
            if (!match)
            {
                fraudScore += 25;
                car.VinMismatchFlagged = true;
            }
        }

        // 6. Account age check
        var accountAge = (DateTimeOffset.UtcNow - host.CreatedAt).TotalDays;
        if (accountAge < 7) fraudScore += 15;

        // 7. Fraud watchlist
        if (host.IsOnFraudWatchlist) fraudScore += 40;

        // Update host fraud score
        host.FraudRiskScore = Math.Min(100, fraudScore);

        // Determine auto-approve eligibility
        var autoApproveInDev = _config.GetValue<bool>("HOST_AUTO_APPROVE_IN_DEV", false);
        var canAutoApprove = autoApproveInDev || (
            car.VehicleTier is VehicleTier.Economy or VehicleTier.Standard &&
            fraudScore <= 30 &&
            checks.All(c => c.Passed) &&
            await HasSuccessfulPriorListingAsync(host.Id)
        );

        return new ListingReviewResult(canAutoApprove, checks, fraudScore);
    }

    private async Task<bool> HasSuccessfulPriorListingAsync(Guid hostId)
    {
        var sixMonthsAgo = DateTimeOffset.UtcNow.AddMonths(-6);
        return await _db.Cars.AnyAsync(c =>
            c.OwnerId == hostId &&
            c.Status == CarStatus.Listed &&
            !_db.Disputes.Any(d => d.Booking.Car.OwnerId == hostId && d.CreatedAt > sixMonthsAgo));
    }
}
