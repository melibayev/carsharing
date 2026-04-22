using System.Security.Cryptography;
using System.Text;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;

namespace CarSharing.Api.Services.Auth;

public class EmailVerificationService : IEmailVerificationService
{
    // Rate-limit constants
    private const int CodeExpirySeconds = 600;           // 10 minutes
    private const int ResendCooldownSeconds = 60;
    private const int ResendDailyMax = 5;
    private const int MaxWrongAttemptsPerCode = 5;
    private const int MaxVerifyAttemptsPerUserPerHour = 15;
    private const int MaxVerifyAttemptsPerIpPerHour = 60;
    private const int MaxResendPerIpPerHour = 30;

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<EmailVerificationService> _logger;
    private readonly IHostEnvironment _env;

    public EmailVerificationService(
        AppDbContext db,
        IEmailService emailService,
        IConnectionMultiplexer redis,
        ILogger<EmailVerificationService> logger,
        IHostEnvironment env)
    {
        _db = db;
        _emailService = emailService;
        _redis = redis;
        _logger = logger;
        _env = env;
    }

    // ── Issue & Send ────────────────────────────────────────────────────────────────

    public async Task<string?> IssueAndSendAsync(Guid userId, string email, string firstName, string? ipAddress, string? userAgent)
    {
        await CheckResendRateLimitsAsync(userId, ipAddress, throwOnExceeded: true);

        // Invalidate any previous live codes
        var previous = await _db.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.ConsumedAt == null)
            .ToListAsync();
        foreach (var old in previous)
            old.ConsumedAt = DateTimeOffset.UtcNow;

        // Generate 6-digit code (crypto-random)
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000);
        var codeString = code.ToString("D6");
        var hash = HashCode(codeString);

        var entity = new EmailVerificationCode
        {
            UserId = userId,
            CodeHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(CodeExpirySeconds),
            CreatedAt = DateTimeOffset.UtcNow,
            IpAddress = ipAddress,
            UserAgent = userAgent,
        };
        _db.EmailVerificationCodes.Add(entity);
        await _db.SaveChangesAsync();

        // Record resend timestamps in Redis
        await RecordResendAsync(userId, ipAddress);

        // Send email — code leaves the server for the last time here
        await _emailService.SendEmailVerificationCodeAsync(email, firstName, codeString);

        _logger.LogInformation(
            "Email verification code issued for user {UserId}, expires at {ExpiresAt}",
            userId, entity.ExpiresAt);

        if (_env.IsDevelopment())
        {
            _logger.LogWarning("[DEV] Email verification code for {Email}: {Code}", email, codeString);
            return codeString;
        }

        return null;
    }

    // ── Verify ──────────────────────────────────────────────────────────────────────

    public async Task<EmailVerifyResult> VerifyCodeAsync(Guid userId, string submittedCode, string? ipAddress)
    {
        // Per-user rolling rate limit
        var userHourKey = $"email_verify_attempts_user:{userId}";
        var userCountStr = await _redis.GetDatabase().StringGetAsync(userHourKey);
        var userCount = userCountStr.HasValue ? (int)userCountStr : 0;
        if (userCount >= MaxVerifyAttemptsPerUserPerHour)
            return new EmailVerifyResult(false, EmailVerifyFailureReason.RateLimited, null);

        // Per-IP rolling rate limit
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipHourKey = $"email_verify_attempts_ip:{ipAddress}";
            var ipCountStr = await _redis.GetDatabase().StringGetAsync(ipHourKey);
            var ipCount = ipCountStr.HasValue ? (int)ipCountStr : 0;
            if (ipCount >= MaxVerifyAttemptsPerIpPerHour)
                return new EmailVerifyResult(false, EmailVerifyFailureReason.RateLimited, null);
        }

        // Increment rolling counters
        var db = _redis.GetDatabase();
        var pipe = db.CreateBatch();
        _ = pipe.StringIncrementAsync(userHourKey);
        _ = pipe.KeyExpireAsync(userHourKey, TimeSpan.FromHours(1));
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipKey = $"email_verify_attempts_ip:{ipAddress}";
            _ = pipe.StringIncrementAsync(ipKey);
            _ = pipe.KeyExpireAsync(ipKey, TimeSpan.FromHours(1));
        }
        pipe.Execute();

        // Find the live code
        var liveCode = await _db.EmailVerificationCodes
            .Where(c => c.UserId == userId && c.ConsumedAt == null)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        if (liveCode == null)
            return new EmailVerifyResult(false, EmailVerifyFailureReason.NoLiveCode, null);

        if (liveCode.ExpiresAt < DateTimeOffset.UtcNow)
        {
            liveCode.ConsumedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
            return new EmailVerifyResult(false, EmailVerifyFailureReason.Expired, null);
        }

        var submittedHash = HashCode(submittedCode);
        var storedHashBytes = Convert.FromHexString(liveCode.CodeHash);
        var submittedHashBytes = Convert.FromHexString(submittedHash);
        var match = CryptographicOperations.FixedTimeEquals(submittedHashBytes, storedHashBytes);

        if (!match)
        {
            liveCode.AttemptCount++;
            var remaining = MaxWrongAttemptsPerCode - liveCode.AttemptCount;

            _logger.LogWarning(
                "Wrong email verification code for user {UserId}, attempt {Attempt}, reason {Reason}, ip {Ip}",
                userId, liveCode.AttemptCount, "WrongCode", ipAddress);

            if (liveCode.AttemptCount >= MaxWrongAttemptsPerCode)
            {
                liveCode.ConsumedAt = DateTimeOffset.UtcNow;
                await _db.SaveChangesAsync();
                return new EmailVerifyResult(false, EmailVerifyFailureReason.Consumed, 0);
            }

            await _db.SaveChangesAsync();
            return new EmailVerifyResult(false, EmailVerifyFailureReason.WrongCode, remaining);
        }

        // Success — consume the code
        liveCode.ConsumedAt = DateTimeOffset.UtcNow;

        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.EmailConfirmed = true;
            if (user.OnboardingStatus == ProfileCompletionStatus.Step1Done)
                user.OnboardingStatus = ProfileCompletionStatus.EmailVerified;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Email verified successfully for user {UserId}", userId);

        return new EmailVerifyResult(true, null, null);
    }

    // ── Status ──────────────────────────────────────────────────────────────────────

    public async Task<EmailVerifyStatusDto> GetStatusAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        var confirmed = user?.EmailConfirmed ?? false;

        var lastCode = await _db.EmailVerificationCodes
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync();

        DateTimeOffset? nextResendAllowedAt = null;
        if (lastCode != null)
        {
            var cooldownEnd = lastCode.CreatedAt.AddSeconds(ResendCooldownSeconds);
            if (cooldownEnd > DateTimeOffset.UtcNow)
                nextResendAllowedAt = cooldownEnd;
        }

        return new EmailVerifyStatusDto(confirmed, lastCode?.CreatedAt, nextResendAllowedAt);
    }

    // ── Rate-limit helpers ──────────────────────────────────────────────────────────

    private async Task CheckResendRateLimitsAsync(Guid userId, string? ipAddress, bool throwOnExceeded)
    {
        var db = _redis.GetDatabase();

        // Per-user cooldown (60 seconds)
        var cooldownKey = $"email_verify_resend:{userId}";
        if (await db.KeyExistsAsync(cooldownKey))
        {
            if (throwOnExceeded)
                throw new RateLimitException("Please wait before requesting another code.", retryAfterSeconds: (int?)((await db.KeyTimeToLiveAsync(cooldownKey))?.TotalSeconds) ?? 60);
        }

        // Per-user daily limit (5 per 24h)
        var dailyKey = $"email_verify_resend_daily:{userId}";
        var dailyCountStr = await db.StringGetAsync(dailyKey);
        var dailyCount = dailyCountStr.HasValue ? (int)dailyCountStr : 0;
        if (dailyCount >= ResendDailyMax)
        {
            if (throwOnExceeded)
                throw new RateLimitException("You have requested too many codes today. Please try again tomorrow.", retryAfterSeconds: null);
        }

        // Per-IP hourly limit (30 per hour)
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipKey = $"email_verify_resend_ip:{ipAddress}";
            var ipCountStr = await db.StringGetAsync(ipKey);
            var ipCount = ipCountStr.HasValue ? (int)ipCountStr : 0;
            if (ipCount >= MaxResendPerIpPerHour)
            {
                if (throwOnExceeded)
                    throw new RateLimitException("Too many requests from this IP. Please try again later.", retryAfterSeconds: null);
            }
        }
    }

    private async Task RecordResendAsync(Guid userId, string? ipAddress)
    {
        var db = _redis.GetDatabase();

        // Cooldown key (60s)
        await db.StringSetAsync(
            $"email_verify_resend:{userId}",
            "1",
            TimeSpan.FromSeconds(ResendCooldownSeconds));

        // Daily counter
        var dailyKey = $"email_verify_resend_daily:{userId}";
        var batch = db.CreateBatch();
        _ = batch.StringIncrementAsync(dailyKey);
        _ = batch.KeyExpireAsync(dailyKey, TimeSpan.FromHours(24));
        batch.Execute();

        // IP hourly counter
        if (!string.IsNullOrEmpty(ipAddress))
        {
            var ipKey = $"email_verify_resend_ip:{ipAddress}";
            var ipBatch = db.CreateBatch();
            _ = ipBatch.StringIncrementAsync(ipKey);
            _ = ipBatch.KeyExpireAsync(ipKey, TimeSpan.FromHours(1));
            ipBatch.Execute();
        }
    }

    // ── Crypto helpers ──────────────────────────────────────────────────────────────

    private static string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}

/// <summary>Thrown when a rate limit is exceeded; carries a Retry-After value if applicable.</summary>
public class RateLimitException : Exception
{
    public int? RetryAfterSeconds { get; }
    public RateLimitException(string message, int? retryAfterSeconds) : base(message)
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}
