namespace CarSharing.Api.Services.Auth;

public interface IEmailVerificationService
{
    /// <summary>
    /// Generate a code, invalidate any previous, send the email.
    /// Returns the plaintext code only when running in Development (for devCode in API response); null in production.
    /// </summary>
    Task<string?> IssueAndSendAsync(Guid userId, string email, string firstName, string? ipAddress, string? userAgent);

    /// <summary>Verify a submitted 6-digit code. Returns the reason on failure.</summary>
    Task<EmailVerifyResult> VerifyCodeAsync(Guid userId, string submittedCode, string? ipAddress);

    /// <summary>Get the current verification status for the resend-countdown UI.</summary>
    Task<EmailVerifyStatusDto> GetStatusAsync(Guid userId);
}

public record EmailVerifyResult(bool Success, EmailVerifyFailureReason? FailureReason, int? AttemptsRemaining);

public enum EmailVerifyFailureReason
{
    WrongCode,
    Expired,
    Consumed,
    RateLimited,
    NoLiveCode,
}

public record EmailVerifyStatusDto(
    bool EmailConfirmed,
    DateTimeOffset? LastCodeSentAt,
    DateTimeOffset? NextResendAllowedAt);
