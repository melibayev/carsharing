using System.Security.Cryptography;
using System.Text;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Services.Sms;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;

namespace CarSharing.Api.Services.Payments;

public interface IPaymentSmsService
{
    /// <summary>
    /// Issues a new SMS challenge for the given purpose. Returns the intent ID and expiry info.
    /// Handles cooldowns and rate limits.
    /// </summary>
    Task<SmsChallengeResult> IssueAsync(
        Guid userId, string purposeKey, string phoneE164,
        string? ipAddress, string? userAgent, CancellationToken ct = default);

    /// <summary>
    /// Verifies the 6-digit code. Returns false on wrong code, too many attempts, or expiry.
    /// </summary>
    Task<SmsVerifyResult> VerifyAsync(Guid userId, string purposeKey, string code, CancellationToken ct = default);
}

public record SmsChallengeResult(
    bool Success,
    Guid? ChallengeId,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? NextResendAllowedAt,
    string? ErrorMessage);

public record SmsVerifyResult(bool Succeeded, int AttemptsLeft, string? ErrorMessage);

public class PaymentSmsService : IPaymentSmsService
{
    private const int CodeLength = 6;
    private const int ExpiryMinutes = 5;
    private const int MaxAttempts = 5;
    private const int ResendCooldownSeconds = 60;
    private const int MaxSendsPerDay = 20;
    private const int MaxSendsPerHourPerIp = 60;

    private readonly AppDbContext _db;
    private readonly ISmsService _sms;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<PaymentSmsService> _logger;
    private readonly string? _devLogPath;

    public PaymentSmsService(
        AppDbContext db, ISmsService sms,
        IConnectionMultiplexer redis, ILogger<PaymentSmsService> logger,
        IConfiguration config)
    {
        _db = db;
        _sms = sms;
        _redis = redis;
        _logger = logger;
        _devLogPath = config["Sms:DevLogPath"];
    }

    public async Task<SmsChallengeResult> IssueAsync(
        Guid userId, string purposeKey, string phoneE164,
        string? ipAddress, string? userAgent, CancellationToken ct = default)
    {
        var redis = _redis.GetDatabase();

        // Check per-user 24-hour send limit
        var userDayKey = $"sms:sends:user:{userId}:{DateTimeOffset.UtcNow:yyyyMMdd}";
        var userSends = await redis.StringGetAsync(userDayKey);
        if (userSends.HasValue && int.TryParse(userSends, out var sends) && sends >= MaxSendsPerDay)
            return new SmsChallengeResult(false, null, null, null, "Daily SMS limit reached. Try again tomorrow.");

        // Check per-IP hourly rate limit
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipKey = $"sms:sends:ip:{ipAddress}:{DateTimeOffset.UtcNow:yyyyMMddHH}";
            var ipSends = await redis.StringGetAsync(ipKey);
            if (ipSends.HasValue && int.TryParse(ipSends, out var ipCount) && ipCount >= MaxSendsPerHourPerIp)
                return new SmsChallengeResult(false, null, null, null, "Too many SMS requests from this network. Try later.");
        }

        // Check resend cooldown per purpose
        var cooldownKey = $"sms:cooldown:{userId}:{purposeKey}";
        var cooldownVal = await redis.StringGetAsync(cooldownKey);
        if (cooldownVal.HasValue)
        {
            var nextAllowed = DateTimeOffset.Parse(cooldownVal!.ToString());
            return new SmsChallengeResult(false, null, null, nextAllowed,
                $"Please wait before requesting another code.");
        }

        // Generate code
        var code = GenerateCode();
        var codeHash = HashCode(code);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(ExpiryMinutes);

        // Invalidate old unconsumed challenges for this purpose
        var old = await _db.PaymentSmsChallenges
            .Where(c => c.UserId == userId && c.PurposeKey == purposeKey && c.ConsumedAt == null)
            .ToListAsync(ct);
        foreach (var o in old)
            o.ConsumedAt = DateTimeOffset.UtcNow;

        // Create new challenge
        var challenge = new PaymentSmsChallenge
        {
            UserId = userId,
            PurposeKey = purposeKey,
            CodeHash = codeHash,
            ExpiresAt = expiresAt,
            IpAddress = ipAddress,
            UserAgent = userAgent
        };
        _db.PaymentSmsChallenges.Add(challenge);
        await _db.SaveChangesAsync(ct);

        // Always write to dev log if configured (ensures code is accessible in dev even if Twilio fails)
        if (!string.IsNullOrEmpty(_devLogPath))
        {
            try
            {
                var dir = Path.GetDirectoryName(_devLogPath);
                if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
                await File.AppendAllTextAsync(_devLogPath,
                    $"[{DateTimeOffset.UtcNow:O}] to {phoneE164}: {code}\n", ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[PaymentSms] Could not write to dev log at {Path}", _devLogPath);
            }
        }

        // Send SMS
        var smsResult = await _sms.SendVerificationCodeAsync(phoneE164, code, ct);
        if (!smsResult.Success)
        {
            if (!string.IsNullOrEmpty(_devLogPath))
            {
                // Dev fallback: code already written to log, proceed so developer can continue
                _logger.LogWarning("[PaymentSms] SMS failed ({Error}) — dev-log fallback active, code written to {Path}",
                    smsResult.ErrorMessage, _devLogPath);
            }
            else
            {
                _logger.LogWarning("[PaymentSms] SMS failed for user {UserId}: {Error}", userId, smsResult.ErrorMessage);
                return new SmsChallengeResult(false, null, null, null, smsResult.ErrorMessage);
            }
        }

        // Set rate-limit counters
        var nextResend = DateTimeOffset.UtcNow.AddSeconds(ResendCooldownSeconds);
        await redis.StringSetAsync(cooldownKey, nextResend.ToString("O"), TimeSpan.FromSeconds(ResendCooldownSeconds));
        await redis.StringIncrementAsync(userDayKey);
        await redis.KeyExpireAsync(userDayKey, TimeSpan.FromDays(1));
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipKey = $"sms:sends:ip:{ipAddress}:{DateTimeOffset.UtcNow:yyyyMMddHH}";
            await redis.StringIncrementAsync(ipKey);
            await redis.KeyExpireAsync(ipKey, TimeSpan.FromHours(1));
        }

        return new SmsChallengeResult(true, challenge.Id, expiresAt, nextResend, null);
    }

    public async Task<SmsVerifyResult> VerifyAsync(Guid userId, string purposeKey, string code, CancellationToken ct = default)
    {
        var challenge = await _db.PaymentSmsChallenges
            .Where(c => c.UserId == userId && c.PurposeKey == purposeKey && c.ConsumedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (challenge is null)
            return new SmsVerifyResult(false, 0, "No active code found. Please request a new one.");

        if (challenge.ExpiresAt < DateTimeOffset.UtcNow)
        {
            challenge.ConsumedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(ct);
            return new SmsVerifyResult(false, 0, "Code has expired. Please request a new one.");
        }

        if (challenge.AttemptCount >= MaxAttempts)
        {
            challenge.ConsumedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(ct);
            return new SmsVerifyResult(false, 0, "Too many wrong attempts. Please request a new code.");
        }

        var inputHash = HashCode(code);
        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(inputHash),
            Encoding.UTF8.GetBytes(challenge.CodeHash)))
        {
            challenge.AttemptCount++;
            await _db.SaveChangesAsync(ct);
            var left = MaxAttempts - challenge.AttemptCount;
            return new SmsVerifyResult(false, left,
                $"That code isn't right. You have {left} attempt{(left == 1 ? "" : "s")} left.");
        }

        challenge.ConsumedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return new SmsVerifyResult(true, MaxAttempts, null);
    }

    private static string GenerateCode()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var num = BitConverter.ToUInt32(bytes, 0) % 1_000_000;
        return num.ToString("D6");
    }

    private static string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
