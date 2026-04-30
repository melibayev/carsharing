using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Payments;

public class BalanceService : IBalanceService
{
    private readonly AppDbContext _db;
    private readonly IPaymentSmsService _sms;
    private readonly ILogger<BalanceService> _logger;

    // Conversion: existing booking prices are stored in USD field names but are actually UZS
    // (1:1 mapping — the DB "Usd" fields contain UZS amounts in this Uzbekistan deployment)

    public BalanceService(AppDbContext db, IPaymentSmsService sms, ILogger<BalanceService> logger)
    {
        _db = db;
        _sms = sms;
        _logger = logger;
    }

    public async Task<AccountBalance> GetOrCreateAsync(Guid userId, CancellationToken ct = default)
    {
        var balance = await _db.AccountBalances
            .FirstOrDefaultAsync(b => b.UserId == userId, ct);

        if (balance is null)
        {
            balance = new AccountBalance
            {
                UserId = userId,
                AvailableUzs = 0,
                LockedUzs = 0,
                Version = 0,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            _db.AccountBalances.Add(balance);
            await _db.SaveChangesAsync(ct);
        }

        return balance;
    }

    public async Task<AccountBalanceDto> GetBalanceAsync(Guid userId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);
        return new AccountBalanceDto
        {
            AvailableUzs = balance.AvailableUzs,
            LockedUzs = balance.LockedUzs,
            Version = balance.Version
        };
    }

    public async Task<PagedResult<LedgerEntryDto>> GetLedgerAsync(Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.LedgerEntries
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt);

        var total = await query.CountAsync(ct);

        var rawItems = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.Direction,
                e.Type,
                e.AmountUzs,
                e.BalanceAfterUzs,
                e.Description,
                e.CreatedAt,
                e.RelatedBookingId,
            })
            .ToListAsync(ct);

        // Batch-load booking → car info for entries that have a booking reference
        var bookingIds = rawItems
            .Where(e => e.RelatedBookingId.HasValue)
            .Select(e => e.RelatedBookingId!.Value)
            .Distinct()
            .ToList();

        var carInfoByBooking = await _db.Bookings
            .Where(b => bookingIds.Contains(b.Id))
            .Select(b => new
            {
                BookingId = b.Id,
                CarTitle = b.Car.Make + " " + b.Car.Model + " " + b.Car.Year,
                CarPhotoUrl = b.Car.Photos.Where(p => p.IsCover).Select(p => p.Url).FirstOrDefault()
                              ?? b.Car.Photos.Select(p => p.Url).FirstOrDefault()
            })
            .ToDictionaryAsync(x => x.BookingId, ct);

        var items = rawItems.Select(e =>
        {
            carInfoByBooking.TryGetValue(e.RelatedBookingId ?? Guid.Empty, out var carInfo);
            return new LedgerEntryDto
            {
                Id = e.Id,
                Direction = e.Direction.ToString(),
                Type = e.Type.ToString(),
                AmountUzs = e.AmountUzs,
                BalanceAfterUzs = e.BalanceAfterUzs,
                Description = e.Description,
                CreatedAt = e.CreatedAt,
                RelatedBookingId = e.RelatedBookingId,
                CarTitle = carInfo?.CarTitle,
                CarPhotoUrl = carInfo?.CarPhotoUrl,
            };
        }).ToList();

        return new PagedResult<LedgerEntryDto>(items, total, page, pageSize);
    }

    public async Task<TopUpIntentResponse> CreateTopUpIntentAsync(
        Guid userId, TopUpIntentRequest request,
        string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var phoneE164 = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.PhoneNumber)
            .FirstOrDefaultAsync(ct);
        if (request.AmountUzs < 50_000)
            throw new InvalidOperationException("Minimum top-up amount is 50,000 so'm.");
        if (request.AmountUzs > 50_000_000)
            throw new InvalidOperationException("Maximum top-up amount per transaction is 50,000,000 so'm.");

        // Check daily top-up count
        var today = DateTimeOffset.UtcNow.Date;
        var dailyCount = await _db.TopUpIntents
            .CountAsync(t => t.UserId == userId && t.CreatedAt >= today && t.IsConfirmed, ct);
        if (dailyCount >= 5)
            throw new InvalidOperationException("You have reached the daily top-up limit (5 per day).");

        // Validate payment method if specified
        if (request.PaymentMethodId.HasValue)
        {
            var method = await _db.UserPaymentMethods
                .FirstOrDefaultAsync(m => m.Id == request.PaymentMethodId.Value
                    && m.UserId == userId && m.IsActive && m.DeletedAt == null, ct);
            if (method is null)
                throw new InvalidOperationException("Payment method not found.");
        }

        var intent = new TopUpIntent
        {
            UserId = userId,
            PaymentMethodId = request.PaymentMethodId,
            AmountUzs = request.AmountUzs,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15)
        };
        _db.TopUpIntents.Add(intent);
        await _db.SaveChangesAsync(ct);

        // Issue SMS challenge
        if (string.IsNullOrEmpty(phoneE164))
            throw new InvalidOperationException("Phone number not set on your profile. Please update your profile first.");

        var purposeKey = $"topup:{intent.Id}";
        var smsResult = await _sms.IssueAsync(userId, purposeKey, phoneE164, ipAddress, userAgent, ct);
        if (!smsResult.Success)
            throw new InvalidOperationException(smsResult.ErrorMessage ?? "Failed to send SMS.");

        return new TopUpIntentResponse
        {
            IntentId = intent.Id,
            SmsRequired = true,
            PhoneHint = MaskPhone(phoneE164),
            ExpiresAt = intent.ExpiresAt,
            NextResendAllowedAt = smsResult.NextResendAllowedAt
        };
    }

    public async Task ConfirmTopUpAsync(Guid userId, ConfirmTopUpRequest request, CancellationToken ct = default)
    {
        var intent = await _db.TopUpIntents
            .FirstOrDefaultAsync(t => t.Id == request.IntentId && t.UserId == userId, ct);

        if (intent is null || intent.ExpiresAt < DateTimeOffset.UtcNow || intent.IsConfirmed)
            throw new InvalidOperationException("Top-up intent is invalid or expired.");

        var purposeKey = $"topup:{intent.Id}";
        var verifyResult = await _sms.VerifyAsync(userId, purposeKey, request.Code, ct);
        if (!verifyResult.Succeeded)
            throw new InvalidOperationException(verifyResult.ErrorMessage ?? "Invalid code.");

        // Credit the balance
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            var balance = await GetOrCreateAsync(userId, ct);

            // Optimistic concurrency check
            var originalVersion = balance.Version;
            balance.AvailableUzs += intent.AmountUzs;
            balance.Version++;
            balance.UpdatedAt = DateTimeOffset.UtcNow;
            intent.IsConfirmed = true;

            var entry = new LedgerEntry
            {
                UserId = userId,
                Direction = LedgerDirection.Credit,
                Type = LedgerEntryType.TopUp,
                AmountUzs = intent.AmountUzs,
                BalanceAfterUzs = balance.AvailableUzs,
                Description = $"Balance top-up",
                AccountBalanceId = balance.Id,
                RelatedPaymentId = intent.PaymentMethodId
            };
            _db.LedgerEntries.Add(entry);

            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            _logger.LogInformation("[Balance] Topped up {Amount} for user {UserId}", intent.AmountUzs, userId);
        }
        catch (DbUpdateConcurrencyException)
        {
            await tx.RollbackAsync(ct);
            throw new InvalidOperationException("Balance was updated concurrently. Please refresh and try again.");
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task LockFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);

        if (balance.AvailableUzs < amountUzs)
            throw new InvalidOperationException("Insufficient balance.");

        balance.AvailableUzs -= amountUzs;
        balance.LockedUzs += amountUzs;
        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = userId,
            Direction = LedgerDirection.Debit,
            Type = LedgerEntryType.BookingHold,
            AmountUzs = amountUzs,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = "Booking hold",
            RelatedBookingId = bookingId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task ReleaseFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);

        var release = Math.Min(amountUzs, balance.LockedUzs);
        balance.LockedUzs -= release;
        balance.AvailableUzs += release;
        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = userId,
            Direction = LedgerDirection.Credit,
            Type = LedgerEntryType.BookingHoldRelease,
            AmountUzs = release,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = "Booking hold released",
            RelatedBookingId = bookingId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task CaptureFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, Guid paymentId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);

        var capture = Math.Min(amountUzs, balance.LockedUzs);
        balance.LockedUzs -= capture;
        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = userId,
            Direction = LedgerDirection.Debit,
            Type = LedgerEntryType.BookingCapture,
            AmountUzs = capture,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = "Booking payment captured",
            RelatedBookingId = bookingId,
            RelatedPaymentId = paymentId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task CreditRefundAsync(Guid userId, decimal amountUzs, Guid bookingId, Guid paymentId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);

        balance.AvailableUzs += amountUzs;
        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = userId,
            Direction = LedgerDirection.Credit,
            Type = LedgerEntryType.RefundCredit,
            AmountUzs = amountUzs,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = "Refund credited",
            RelatedBookingId = bookingId,
            RelatedPaymentId = paymentId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task CreditHostEarningAsync(Guid hostId, decimal amountUzs, Guid bookingId, Guid? paymentId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(hostId, ct);

        balance.AvailableUzs += amountUzs;
        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = hostId,
            Direction = LedgerDirection.Credit,
            Type = LedgerEntryType.HostEarning,
            AmountUzs = amountUzs,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = "Trip earning credited",
            RelatedBookingId = bookingId,
            RelatedPaymentId = paymentId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task AdminAdjustAsync(Guid userId, decimal amountUzs, string direction, string reason, Guid adminId, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(userId, ct);
        var isCredit = direction.Equals("Credit", StringComparison.OrdinalIgnoreCase);

        if (isCredit)
            balance.AvailableUzs += amountUzs;
        else
        {
            if (balance.AvailableUzs < amountUzs)
                throw new InvalidOperationException("Cannot debit more than the available balance.");
            balance.AvailableUzs -= amountUzs;
        }

        balance.Version++;
        balance.UpdatedAt = DateTimeOffset.UtcNow;

        _db.LedgerEntries.Add(new LedgerEntry
        {
            UserId = userId,
            Direction = isCredit ? LedgerDirection.Credit : LedgerDirection.Debit,
            Type = isCredit ? LedgerEntryType.AdjustmentCredit : LedgerEntryType.AdjustmentDebit,
            AmountUzs = amountUzs,
            BalanceAfterUzs = balance.AvailableUzs,
            Description = $"Admin adjustment: {reason}",
            CreatedByUserId = adminId,
            AccountBalanceId = balance.Id
        });

        await _db.SaveChangesAsync(ct);
    }

    private static string MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone)) return "";
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        return digits.Length >= 4
            ? phone[..^4].Aggregate("", (a, c) => a + (char.IsDigit(c) ? '•' : c)) + phone[^4..]
            : phone;
    }
}
