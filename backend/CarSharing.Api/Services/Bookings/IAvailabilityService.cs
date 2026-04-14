namespace CarSharing.Api.Services.Bookings;

public interface IAvailabilityService
{
    Task<bool> IsAvailableAsync(Guid carId, DateTimeOffset start, DateTimeOffset end, Guid? callerId = null);
}
