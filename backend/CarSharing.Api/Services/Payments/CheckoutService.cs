using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Notifications;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Payments;

public interface ICheckoutService
{
    Task<CheckoutDto> GetCheckoutAsync(Guid bookingId, Guid userId, CancellationToken ct = default);
    Task<PayBookingResponse> PayAsync(Guid bookingId, Guid userId, PayBookingRequest request, string? idempotencyKey, CancellationToken ct = default);
}

public class CheckoutService : ICheckoutService
{
    private readonly AppDbContext _db;
    private readonly IBalanceService _balance;
    private readonly INotificationService _notifications;
    private readonly ILogger<CheckoutService> _logger;

    private const int CheckoutLockMinutes = 10;
    private const decimal UsdToUzsRate = 12_800m;

    public CheckoutService(
        AppDbContext db, IBalanceService balance,
        INotificationService notifications, ILogger<CheckoutService> logger)
    {
        _db = db;
        _balance = balance;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<CheckoutDto> GetCheckoutAsync(Guid bookingId, Guid userId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car).ThenInclude(c => c.Photos)
            .Include(b => b.Car).ThenInclude(c => c.Owner)
            .Include(b => b.Guest)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.GuestId == userId, ct);

        if (booking is null)
            throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.PendingApproval)
            throw new InvalidOperationException("This booking is not in a payable state.");

        // Set or refresh checkout lock
        if (booking.CheckoutLockExpiresAt is null || booking.CheckoutLockExpiresAt < DateTimeOffset.UtcNow)
        {
            booking.CheckoutLockExpiresAt = DateTimeOffset.UtcNow.AddMinutes(CheckoutLockMinutes);
            await _db.SaveChangesAsync(ct);
        }

        var balanceDto = await _balance.GetBalanceAsync(userId, ct);
        var methods = await _db.UserPaymentMethods
            .Where(m => m.UserId == userId && m.IsActive && m.DeletedAt == null)
            .OrderByDescending(m => m.IsDefault).ThenByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

        var totalUzs = booking.TotalChargedUsd * UsdToUzsRate;

        var breakdown = new PriceBreakdownDto
        {
            DailyRateUzs = booking.DailyRateUsd * UsdToUzsRate,
            Days = booking.Days,
            SubtotalUzs = booking.SubtotalUsd * UsdToUzsRate,
            CleaningFeeUzs = booking.CleaningFeeUsd * UsdToUzsRate,
            ServiceFeeUzs = booking.ServiceFeeUsd * UsdToUzsRate,
            TaxesUzs = booking.TaxesUsd * UsdToUzsRate,
            TotalUzs = totalUzs
        };

        var bookingDto = MapBookingDto(booking);
        var defaultMethod = methods.FirstOrDefault(m => m.IsDefault);

        return new CheckoutDto
        {
            Booking = bookingDto,
            PriceBreakdown = breakdown,
            Balance = balanceDto,
            PaymentMethods = methods.Select(MapMethodDto).ToList(),
            RecommendedMethodId = defaultMethod?.Id,
            LockExpiresAt = booking.CheckoutLockExpiresAt!.Value
        };
    }

    public async Task<PayBookingResponse> PayAsync(
        Guid bookingId, Guid userId,
        PayBookingRequest request, string? idempotencyKey, CancellationToken ct = default)
    {
        // Idempotency check
        if (!string.IsNullOrEmpty(idempotencyKey))
        {
            var existing = await _db.Payments
                .FirstOrDefaultAsync(p => p.IdempotencyKey == idempotencyKey, ct);
            if (existing is not null)
            {
                return new PayBookingResponse
                {
                    PaymentId = existing.Id,
                    Status = existing.Status.ToString(),
                    BookingStatus = (await _db.Bookings.Where(b => b.Id == bookingId).Select(b => b.Status).FirstOrDefaultAsync(ct)).ToString()
                };
            }
        }

        var booking = await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.GuestId == userId, ct);

        if (booking is null)
            throw new InvalidOperationException("Booking not found.");

        if (booking.Status != BookingStatus.PendingApproval)
            throw new InvalidOperationException("This booking is not in a payable state.");

        if (booking.CheckoutLockExpiresAt is not null && booking.CheckoutLockExpiresAt < DateTimeOffset.UtcNow)
            throw new InvalidOperationException("LOCK_EXPIRED");

        var totalUzs = booking.TotalChargedUsd * UsdToUzsRate;
        var method = Enum.TryParse<PaymentMethod>(request.Method, out var m) ? m : throw new InvalidOperationException("Invalid payment method.");

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            Payment payment;

            if (method == PaymentMethod.AccountBalance)
            {
                // Lock funds from balance
                await _balance.LockFundsAsync(userId, totalUzs, bookingId, ct);

                payment = new Payment
                {
                    BookingId = bookingId,
                    UserId = userId,
                    Method = PaymentMethod.AccountBalance,
                    AmountUzs = totalUzs,
                    Status = PaymentStatus.Authorized,
                    AuthorizedAt = DateTimeOffset.UtcNow,
                    IdempotencyKey = idempotencyKey
                };
                _db.Payments.Add(payment);

                // Immediately capture for balance payments (no separate host approval needed for funds)
                await _db.SaveChangesAsync(ct);
            }
            else if (method == PaymentMethod.Card)
            {
                if (!request.PaymentMethodId.HasValue)
                    throw new InvalidOperationException("PaymentMethodId is required for card payments.");

                var card = await _db.UserPaymentMethods
                    .FirstOrDefaultAsync(m2 => m2.Id == request.PaymentMethodId.Value
                        && m2.UserId == userId && m2.IsActive && m2.DeletedAt == null, ct);

                if (card is null)
                    throw new InvalidOperationException("Card not found.");

                // Fake card authorization
                var providerRef = $"pi_fake_{Guid.NewGuid():N}";

                payment = new Payment
                {
                    BookingId = bookingId,
                    UserId = userId,
                    Method = PaymentMethod.Card,
                    PaymentMethodId = card.Id,
                    AmountUzs = totalUzs,
                    Status = PaymentStatus.Authorized,
                    ProviderRef = providerRef,
                    AuthorizedAt = DateTimeOffset.UtcNow,
                    IdempotencyKey = idempotencyKey
                };
                _db.Payments.Add(payment);
                await _db.SaveChangesAsync(ct);
            }
            else
            {
                throw new InvalidOperationException("Unsupported payment method.");
            }

            // Move booking status
            if (booking.Car.IsInstantBook)
            {
                booking.Status = BookingStatus.Confirmed;
                booking.ConfirmedAt = DateTimeOffset.UtcNow;

                // Capture funds immediately for instant book
                if (method == PaymentMethod.AccountBalance)
                    await _balance.CaptureFundsAsync(userId, totalUzs, bookingId, payment.Id, ct);
                else
                {
                    payment.Status = PaymentStatus.Captured;
                    payment.CapturedAt = DateTimeOffset.UtcNow;
                }

                await _db.SaveChangesAsync(ct);
            }

            await tx.CommitAsync(ct);

            // Notify host
            try
            {
                await _notifications.CreateAsync(booking.Car.OwnerId, NotificationType.NewBookingRequest,
                    "New booking request",
                    $"{booking.Car.Make} {booking.Car.Model} — new booking request",
                    $"/host/bookings/{bookingId}");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to notify host about booking {BookingId}", bookingId);
            }

            _logger.LogInformation("[Checkout] Payment {PaymentId} created for booking {BookingId} via {Method}",
                payment.Id, bookingId, method);

            return new PayBookingResponse
            {
                PaymentId = payment.Id,
                Status = payment.Status.ToString(),
                BookingStatus = booking.Status.ToString()
            };
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    private static BookingDto MapBookingDto(Booking b) => new()
    {
        Id = b.Id,
        CarId = b.CarId,
        GuestId = b.GuestId,
        CarTitle = $"{b.Car.Year} {b.Car.Make} {b.Car.Model}",
        CoverPhotoUrl = b.Car.Photos.FirstOrDefault(p => p.IsCover)?.Url ?? b.Car.Photos.FirstOrDefault()?.Url,
        StartUtc = b.StartUtc,
        EndUtc = b.EndUtc,
        Status = b.Status,
        DailyRateUsd = b.DailyRateUsd,
        Days = b.Days,
        SubtotalUsd = b.SubtotalUsd,
        CleaningFeeUsd = b.CleaningFeeUsd,
        ServiceFeeUsd = b.ServiceFeeUsd,
        TaxesUsd = b.TaxesUsd,
        SecurityDepositHoldUsd = b.SecurityDepositHoldUsd,
        TotalChargedUsd = b.TotalChargedUsd,
        HostPayoutUsd = b.HostPayoutUsd,
        GuestMessage = b.GuestMessage,
        ConfirmedAt = b.ConfirmedAt,
        CreatedAt = b.CreatedAt,
        Host = b.Car.Owner == null ? null : new()
        {
            Id = b.Car.Owner.Id,
            FirstName = b.Car.Owner.FirstName,
            ProfilePhotoUrl = b.Car.Owner.ProfilePhotoUrl,
            AverageRatingAsHost = b.Car.Owner.AverageRatingAsHost,
            HostTripCount = b.Car.Owner.HostTripCount,
            CreatedAt = b.Car.Owner.CreatedAt
        }
    };

    private static UserPaymentMethodDto MapMethodDto(UserPaymentMethod m) => new()
    {
        Id = m.Id,
        Type = m.Type.ToString(),
        Brand = m.Brand,
        Last4 = m.Last4,
        ExpMonth = m.ExpMonth,
        ExpYear = m.ExpYear,
        CardholderName = m.CardholderName,
        IsDefault = m.IsDefault,
        IsActive = m.IsActive,
        CreatedAt = m.CreatedAt,
        PhoneVerifiedAt = m.PhoneVerifiedAt
    };
}
