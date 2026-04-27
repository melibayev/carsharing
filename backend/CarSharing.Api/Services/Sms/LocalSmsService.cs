namespace CarSharing.Api.Services.Sms;

/// <summary>
/// SMS service used when TWILIO_ENABLED=false (dev/CI). Writes to a file instead of
/// actually sending a message. The code is never logged — only written to the dev file.
/// </summary>
public class LocalSmsService : ISmsService
{
    private readonly ILogger<LocalSmsService> _logger;
    private readonly string _logPath;

    public LocalSmsService(ILogger<LocalSmsService> logger, IConfiguration config)
    {
        _logger = logger;
        _logPath = config["Sms:DevLogPath"] ?? "/app/dev-sms.log";
    }

    public async Task<SmsResult> SendVerificationCodeAsync(string phoneE164, string code, CancellationToken ct = default)
    {
        if (!IsValidE164(phoneE164))
            return new SmsResult(false, "INVALID_PHONE", "Phone number must be in E.164 format.", null);

        var maskedPhone = MaskPhone(phoneE164);
        _logger.LogInformation("[LocalSMS] Would have sent code to {Phone}", maskedPhone);

        try
        {
            var dir = Path.GetDirectoryName(_logPath);
            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);

            await File.AppendAllTextAsync(
                _logPath,
                $"[{DateTimeOffset.UtcNow:O}] to {phoneE164}: {code}\n",
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[LocalSMS] Could not write to dev-sms.log at {Path}", _logPath);
        }

        var fakeSid = $"SM_local_{Guid.NewGuid():N}";
        return new SmsResult(true, null, null, fakeSid);
    }

    private static bool IsValidE164(string phone)
        => phone.StartsWith('+') && phone.Length >= 8 && phone.Length <= 16
           && phone.Skip(1).All(char.IsDigit);

    private static string MaskPhone(string phone)
    {
        if (phone.Length < 8) return "***";
        return phone[..4] + new string('*', phone.Length - 7) + phone[^3..];
    }
}
