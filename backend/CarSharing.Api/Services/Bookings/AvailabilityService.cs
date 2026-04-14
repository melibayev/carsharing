using CarSharing.Api.Data;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Bookings;

public class AvailabilityService : IAvailabilityService
{
    private readonly AppDbContext _db;

    public AvailabilityService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> IsAvailableAsync(Guid carId, DateTimeOffset start, DateTimeOffset end, Guid? callerId = null)
    {
        var car = await _db.Cars.FindAsync(carId);
        if (car == null) return false;

        // Must be Listed
        if (car.Status != CarStatus.Listed) return false;

        // Owner can't book own car
        if (callerId.HasValue && car.OwnerId == callerId.Value) return false;

        var days = (int)Math.Ceiling((end - start).TotalDays);

        // Trip duration constraints
        if (days < car.MinTripDays || days > car.MaxTripDays) return false;

        // Advance notice
        if ((start - DateTimeOffset.UtcNow).TotalHours < car.AdvanceNoticeHours) return false;

        // Check for overlapping availability blocks
        var hasBlockOverlap = await _db.Availabilities.AnyAsync(a =>
            a.CarId == carId && a.StartUtc < end && a.EndUtc > start);
        if (hasBlockOverlap) return false;

        // Check for overlapping active bookings
        var hasBookingOverlap = await _db.Bookings.AnyAsync(b =>
            b.CarId == carId &&
            (b.Status == BookingStatus.PendingApproval ||
             b.Status == BookingStatus.Confirmed ||
             b.Status == BookingStatus.InProgress) &&
            b.StartUtc < end && b.EndUtc > start);
        if (hasBookingOverlap) return false;

        return true;
    }
}
