using CarSharing.Api.Data;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Background;

public class BookingExpiryJob
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingExpiryJob> _logger;

    public BookingExpiryJob(IServiceProvider serviceProvider, ILogger<BookingExpiryJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);
        var expired = await db.Bookings
            .Include(b => b.AvailabilityBlock)
            .Where(b => b.Status == BookingStatus.PendingApproval && b.CreatedAt < cutoff)
            .ToListAsync();

        foreach (var booking in expired)
        {
            booking.Status = BookingStatus.CancelledByGuest;
            booking.CancelledAt = DateTimeOffset.UtcNow;
            booking.CancellationReason = "Auto-expired after 24 hours without host response.";

            if (booking.AvailabilityBlock != null)
            {
                db.Availabilities.Remove(booking.AvailabilityBlock);
            }

            _logger.LogInformation("Booking {BookingId} auto-expired", booking.Id);
        }

        if (expired.Count > 0)
        {
            await db.SaveChangesAsync();
            _logger.LogInformation("Expired {Count} pending bookings", expired.Count);
        }
    }
}
