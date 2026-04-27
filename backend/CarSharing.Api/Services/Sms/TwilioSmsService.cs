namespace CarSharing.Api.Services.Sms;

/// <summary>
/// Production Twilio SMS service. Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
/// and TWILIO_FROM_PHONE to be configured. Set TWILIO_ENABLED=false in dev/CI to use
/// LocalSmsService instead.
/// </summary>
public class TwilioSmsService : ISmsService
{
    private readonly ILogger<TwilioSmsService> _logger;
    private readonly string _accountSid;
    private readonly string _authToken;
    private readonly string _fromPhone;

    public TwilioSmsService(ILogger<TwilioSmsService> logger, IConfiguration config)
    {
        _logger = logger;
        _accountSid = config["Twilio:AccountSid"]
            ?? throw new InvalidOperationException("Twilio:AccountSid is not configured.");
        _authToken = config["Twilio:AuthToken"]
            ?? throw new InvalidOperationException("Twilio:AuthToken is not configured.");
        _fromPhone = config["Twilio:FromPhone"]
            ?? throw new InvalidOperationException("Twilio:FromPhone is not configured.");
    }

    public async Task<SmsResult> SendVerificationCodeAsync(string phoneE164, string code, CancellationToken ct = default)
    {
        if (!IsValidE164(phoneE164))
            return new SmsResult(false, "INVALID_PHONE", "Phone number must be in E.164 format.", null);

        var maskedPhone = MaskPhone(phoneE164);

        try
        {
            // Use HttpClient directly to avoid adding the Twilio NuGet dependency in this phase.
            // This calls the Twilio Messages API REST endpoint.
            using var handler = new HttpClientHandler();
            using var client = new HttpClient(handler);

            var credentials = Convert.ToBase64String(
                System.Text.Encoding.ASCII.GetBytes($"{_accountSid}:{_authToken}"));
            client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", credentials);

            var body = $"Your CarSharing verification code is {code}. Valid for 5 minutes. Don't share it with anyone.";
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", phoneE164),
                new KeyValuePair<string, string>("From", _fromPhone),
                new KeyValuePair<string, string>("Body", body),
            });

            var response = await client.PostAsync(
                $"https://api.twilio.com/2010-04-01/Accounts/{_accountSid}/Messages.json",
                content, ct);

            var json = await response.Content.ReadAsStringAsync(ct);

            if (response.IsSuccessStatusCode)
            {
                // Extract SID from JSON (avoid full JSON parsing for simplicity)
                var sidStart = json.IndexOf("\"sid\":\"", StringComparison.Ordinal);
                string? sid = null;
                if (sidStart >= 0)
                {
                    var start = sidStart + 7;
                    var end = json.IndexOf('"', start);
                    if (end > start) sid = json[start..end];
                }

                _logger.LogInformation("[TwilioSMS] Sent to {Phone}: sid={Sid}", maskedPhone, sid);
                return new SmsResult(true, null, null, sid);
            }
            else
            {
                // Parse error code
                var errorCodeMatch = System.Text.RegularExpressions.Regex.Match(json, @"""code""\s*:\s*(\d+)");
                var errorCode = errorCodeMatch.Success ? errorCodeMatch.Groups[1].Value : null;

                var userMessage = MapTwilioError(errorCode);
                _logger.LogWarning("[TwilioSMS] Failed to {Phone}: {StatusCode} code={ErrorCode}",
                    maskedPhone, (int)response.StatusCode, errorCode);

                return new SmsResult(false, errorCode, userMessage, null);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[TwilioSMS] Exception sending to {Phone}", maskedPhone);
            return new SmsResult(false, "EXCEPTION", "We couldn't send the code right now. Please try again.", null);
        }
    }

    private static string MapTwilioError(string? code) => code switch
    {
        "21211" => "Your phone number on file looks invalid. Please update your profile.",
        "21610" => "This number stopped receiving messages from us. Contact support.",
        "21408" => "SMS sending is not configured. Check the dev-sms.log file.",
        _ => "We couldn't send the code right now. Please try again."
    };

    private static bool IsValidE164(string phone)
        => phone.StartsWith('+') && phone.Length >= 8 && phone.Length <= 16
           && phone.Skip(1).All(char.IsDigit);

    private static string MaskPhone(string phone)
    {
        if (phone.Length < 8) return "***";
        return phone[..4] + new string('*', phone.Length - 7) + phone[^3..];
    }
}
