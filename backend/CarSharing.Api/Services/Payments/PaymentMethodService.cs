using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Payments;

public interface IPaymentMethodService
{
    Task<List<UserPaymentMethodDto>> GetMethodsAsync(Guid userId, CancellationToken ct = default);
    Task<AddCardIntentResponse> CreateAddCardIntentAsync(Guid userId, AddCardIntentRequest request, string? ipAddress, string? userAgent, CancellationToken ct = default);
    Task<UserPaymentMethodDto> ConfirmAddCardAsync(Guid userId, ConfirmCardRequest request, CancellationToken ct = default);
    Task<SmsChallengeResult> ResendSmsAsync(Guid userId, ResendCardSmsRequest request, string? ipAddress, string? userAgent, CancellationToken ct = default);
    Task SetDefaultAsync(Guid userId, Guid methodId, CancellationToken ct = default);
    Task DeleteAsync(Guid userId, Guid methodId, CancellationToken ct = default);
}

public class PaymentMethodService : IPaymentMethodService
{
    private const int MaxActiveCards = 5;

    private readonly AppDbContext _db;
    private readonly IPaymentSmsService _sms;
    private readonly ILogger<PaymentMethodService> _logger;

    public PaymentMethodService(AppDbContext db, IPaymentSmsService sms, ILogger<PaymentMethodService> logger)
    {
        _db = db;
        _sms = sms;
        _logger = logger;
    }

    public async Task<List<UserPaymentMethodDto>> GetMethodsAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.UserPaymentMethods
            .Where(m => m.UserId == userId && m.IsActive && m.DeletedAt == null)
            .OrderByDescending(m => m.IsDefault)
            .ThenByDescending(m => m.CreatedAt)
            .Select(m => MapToDto(m))
            .ToListAsync(ct);
    }

    public async Task<AddCardIntentResponse> CreateAddCardIntentAsync(
        Guid userId, AddCardIntentRequest request,
        string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var phoneE164 = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.PhoneNumber)
            .FirstOrDefaultAsync(ct);
        // Check card cap
        var activeCount = await _db.UserPaymentMethods
            .CountAsync(m => m.UserId == userId && m.IsActive && m.DeletedAt == null, ct);
        if (activeCount >= MaxActiveCards)
            throw new InvalidOperationException($"You can have at most {MaxActiveCards} active cards.");

        ValidateCard(request);

        // Tokenize (fake — full PAN never hits DB)
        var token = TokenizeCard(request.CardNumber);
        var (brand, last4) = DetectBrand(request.CardNumber);

        // Auto-detect or validates type
        var cardType = ResolveType(request.Type, request.CardNumber);

        // Create pending method (IsActive=false until SMS confirmed)
        var method = new UserPaymentMethod
        {
            UserId = userId,
            Type = cardType,
            Brand = brand,
            Last4 = last4,
            ExpMonth = request.ExpMonth,
            ExpYear = request.ExpYear,
            CardholderName = request.CardholderName.ToUpperInvariant(),
            ProviderToken = token,
            IsActive = false,
            IsDefault = activeCount == 0
        };
        _db.UserPaymentMethods.Add(method);
        await _db.SaveChangesAsync(ct);

        if (string.IsNullOrEmpty(phoneE164))
            throw new InvalidOperationException("Phone number not set on your profile. Please update your profile first.");

        var purposeKey = $"add-card:{method.Id}";
        var smsResult = await _sms.IssueAsync(userId, purposeKey, phoneE164, ipAddress, userAgent, ct);
        if (!smsResult.Success)
        {
            // Clean up pending method
            _db.UserPaymentMethods.Remove(method);
            await _db.SaveChangesAsync(ct);
            throw new InvalidOperationException(smsResult.ErrorMessage ?? "Failed to send SMS.");
        }

        return new AddCardIntentResponse
        {
            PaymentMethodId = method.Id,
            MaskedCard = $"•••• {last4}",
            PhoneHint = MaskPhone(phoneE164),
            Last4 = last4,
            Brand = brand,
            SmsExpiresAt = smsResult.ExpiresAt ?? DateTimeOffset.UtcNow.AddMinutes(5),
            NextResendAllowedAt = smsResult.NextResendAllowedAt
        };
    }

    public async Task<UserPaymentMethodDto> ConfirmAddCardAsync(
        Guid userId, ConfirmCardRequest request, CancellationToken ct = default)
    {
        var method = await _db.UserPaymentMethods
            .FirstOrDefaultAsync(m => m.Id == request.PaymentMethodId && m.UserId == userId, ct);

        if (method is null || method.DeletedAt != null)
            throw new InvalidOperationException("Pending card not found.");
        if (method.IsActive)
            throw new InvalidOperationException("Card is already confirmed.");

        var purposeKey = $"add-card:{method.Id}";
        var result = await _sms.VerifyAsync(userId, purposeKey, request.Code, ct);
        if (!result.Succeeded)
            throw new InvalidOperationException(result.ErrorMessage ?? "Invalid code.");

        method.IsActive = true;
        method.PhoneVerifiedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[PaymentMethod] Card confirmed for user {UserId}: {Brand}...{Last4}", userId, method.Brand, method.Last4);
        return MapToDto(method);
    }

    public async Task<SmsChallengeResult> ResendSmsAsync(
        Guid userId, ResendCardSmsRequest request,
        string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var phoneE164 = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.PhoneNumber)
            .FirstOrDefaultAsync(ct);
        var method = await _db.UserPaymentMethods
            .FirstOrDefaultAsync(m => m.Id == request.PaymentMethodId && m.UserId == userId && !m.IsActive, ct);

        if (method is null)
            throw new InvalidOperationException("Pending card not found.");

        if (string.IsNullOrEmpty(phoneE164))
            throw new InvalidOperationException("Phone number not set on your profile.");

        var purposeKey = $"add-card:{method.Id}";
        return await _sms.IssueAsync(userId, purposeKey, phoneE164, ipAddress, userAgent, ct);
    }

    public async Task SetDefaultAsync(Guid userId, Guid methodId, CancellationToken ct = default)
    {
        var methods = await _db.UserPaymentMethods
            .Where(m => m.UserId == userId && m.IsActive && m.DeletedAt == null)
            .ToListAsync(ct);

        foreach (var m in methods)
            m.IsDefault = m.Id == methodId;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid userId, Guid methodId, CancellationToken ct = default)
    {
        var method = await _db.UserPaymentMethods
            .FirstOrDefaultAsync(m => m.Id == methodId && m.UserId == userId && m.DeletedAt == null, ct);

        if (method is null)
            throw new InvalidOperationException("Payment method not found.");

        // Check if in-flight payment references it
        var inFlight = await _db.Payments
            .AnyAsync(p => p.PaymentMethodId == methodId
                && (p.Status == CarSharing.Api.Models.Enums.PaymentStatus.Pending
                    || p.Status == CarSharing.Api.Models.Enums.PaymentStatus.Authorized), ct);
        if (inFlight)
            throw new InvalidOperationException("Cannot remove a card that has an in-flight payment.");

        method.DeletedAt = DateTimeOffset.UtcNow;
        method.IsDefault = false;
        await _db.SaveChangesAsync(ct);
    }

    private static string TokenizeCard(string cardNumber)
    {
        // Full PAN is only in memory here. Token created, number then discarded.
        var token = $"pm_fake_{Guid.NewGuid():N}";
        // Zero out the card number from memory (it's a string so GC-managed, but we signal intent)
        return token;
    }

    private static (string Brand, string Last4) DetectBrand(string cardNumber)
    {
        var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
        var last4 = digits.Length >= 4 ? digits[^4..] : digits.PadLeft(4, '0');

        string brand;
        if (digits.StartsWith("8600"))
            brand = "Uzcard";
        else if (digits.StartsWith("9860"))
            brand = "Humo";
        else if (digits.StartsWith("4"))
            brand = "Visa";
        else if (digits.StartsWith("5") || digits.StartsWith("2"))
            brand = "Mastercard";
        else
            brand = "Unknown";

        return (brand, last4);
    }

    private static PaymentMethodType ResolveType(string? requestedType, string cardNumber)
    {
        if (!string.IsNullOrEmpty(requestedType) &&
            Enum.TryParse<PaymentMethodType>(requestedType, out var parsed))
            return parsed;

        var digits = new string(cardNumber.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("8600")) return PaymentMethodType.UzcardCard;
        if (digits.StartsWith("9860")) return PaymentMethodType.HumoCard;
        return PaymentMethodType.VisaMasterCard;
    }

    private static string MaskPhone(string? phone)
    {
        if (string.IsNullOrEmpty(phone)) return "";
        return phone.Length > 4
            ? phone[..^4].Aggregate("", (a, c) => a + (char.IsDigit(c) ? '•' : c)) + phone[^4..]
            : phone;
    }

    private static void ValidateCard(AddCardIntentRequest request)
    {
        var digits = new string(request.CardNumber.Where(char.IsDigit).ToArray());
        if (digits.Length < 16 || digits.Length > 19)
            throw new InvalidOperationException("Card number must be 16-19 digits.");

        if (!LuhnCheck(digits))
            throw new InvalidOperationException("Card number is invalid.");

        if (request.ExpMonth < 1 || request.ExpMonth > 12)
            throw new InvalidOperationException("Invalid expiry month.");

        var now = DateTimeOffset.UtcNow;
        if (request.ExpYear < now.Year || (request.ExpYear == now.Year && request.ExpMonth < now.Month))
            throw new InvalidOperationException("Card has expired.");

        // UzCard (8600) and Humo (9860) are local Uzbek cards that have no CVV
        var isLocalCard = digits.StartsWith("8600") || digits.StartsWith("9860");
        if (!isLocalCard)
        {
            var cvv = request.Cvv ?? "";
            if (cvv.Length < 3 || cvv.Length > 4 || !cvv.All(char.IsDigit))
                throw new InvalidOperationException("Invalid CVV.");
        }

        if (string.IsNullOrWhiteSpace(request.CardholderName) || request.CardholderName.Length < 2 || request.CardholderName.Length > 50)
            throw new InvalidOperationException("Cardholder name must be 2-50 characters.");
    }

    private static bool LuhnCheck(string digits)
    {
        var sum = 0;
        var alternate = false;
        for (int i = digits.Length - 1; i >= 0; i--)
        {
            var n = digits[i] - '0';
            if (alternate)
            {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    private static UserPaymentMethodDto MapToDto(UserPaymentMethod m) => new()
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
