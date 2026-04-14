using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Payments;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Background;

public class PayoutJob
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PayoutJob> _logger;

    public PayoutJob(IServiceProvider serviceProvider, ILogger<PayoutJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var paymentService = scope.ServiceProvider.GetRequiredService<IPaymentService>();

        var completedBookings = await db.Bookings
            .Include(b => b.Car)
            .Where(b => b.Status == BookingStatus.Completed
                && b.CompletedAt.HasValue
                && !db.PayoutRecords.Any(p => p.BookingId == b.Id))
            .ToListAsync();

        foreach (var booking in completedBookings)
        {
            var payoutId = await paymentService.CreatePayoutAsync(booking.Car.OwnerId, booking.HostPayoutUsd);

            db.PayoutRecords.Add(new PayoutRecord
            {
                HostId = booking.Car.OwnerId,
                BookingId = booking.Id,
                AmountUsd = booking.HostPayoutUsd,
                Status = PayoutStatus.Completed,
                ProcessedAt = DateTimeOffset.UtcNow
            });

            _logger.LogInformation("Payout {Amount:C} for booking {BookingId} to host {HostId}",
                booking.HostPayoutUsd, booking.Id, booking.Car.OwnerId);
        }

        if (completedBookings.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
}
