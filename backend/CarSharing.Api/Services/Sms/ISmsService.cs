namespace CarSharing.Api.Services.Sms;

public record SmsResult(bool Success, string? ErrorCode, string? ErrorMessage, string? MessageSid);

public interface ISmsService
{
    Task<SmsResult> SendVerificationCodeAsync(string phoneE164, string code, CancellationToken ct = default);
}
