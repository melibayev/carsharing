using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CarSharing.Api.Services.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string email, string firstName, string token)
    {
        var subject = "Welcome to CarSharing — Verify Your Email";
        var body = $@"
            <h2>Welcome to CarSharing, {firstName}!</h2>
            <p>Thanks for signing up. Please verify your email to get started.</p>
            <p><a href='http://localhost:3000/verify-email?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}' style='background:#FF5A1F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;'>Verify Email</a></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>";

        await SendGenericEmailAsync(email, subject, body);
    }

    public async Task SendPasswordResetEmailAsync(string email, string firstName, string token)
    {
        var subject = "CarSharing — Reset Your Password";
        var body = $@"
            <h2>Password Reset Request</h2>
            <p>Hi {firstName}, we received a request to reset your password.</p>
            <p><a href='http://localhost:3000/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(email)}' style='background:#FF5A1F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;'>Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>";

        await SendGenericEmailAsync(email, subject, body);
    }

    public async Task SendBookingRequestedEmailAsync(string hostEmail, string hostName, string carTitle, string guestName)
    {
        var subject = $"CarSharing — New Booking Request for {carTitle}";
        var body = $@"
            <h2>New Booking Request</h2>
            <p>Hi {hostName}, {guestName} has requested to book your {carTitle}.</p>
            <p><a href='http://localhost:3000/host/bookings' style='background:#FF5A1F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;'>View Request</a></p>";

        await SendGenericEmailAsync(hostEmail, subject, body);
    }

    public async Task SendBookingConfirmedEmailAsync(string guestEmail, string guestName, string carTitle)
    {
        var subject = $"CarSharing — Your Booking for {carTitle} is Confirmed!";
        var body = $@"
            <h2>Booking Confirmed!</h2>
            <p>Hi {guestName}, great news! Your booking for {carTitle} has been confirmed.</p>
            <p><a href='http://localhost:3000/trips' style='background:#FF5A1F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;'>View Trip</a></p>";

        await SendGenericEmailAsync(guestEmail, subject, body);
    }

    public async Task SendBookingRejectedEmailAsync(string guestEmail, string guestName, string carTitle, string reason)
    {
        var subject = $"CarSharing — Booking Update for {carTitle}";
        var body = $@"
            <h2>Booking Declined</h2>
            <p>Hi {guestName}, unfortunately your booking request for {carTitle} was declined.</p>
            <p>Reason: {reason}</p>
            <p><a href='http://localhost:3000/search' style='background:#FF5A1F;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;'>Find Another Car</a></p>";

        await SendGenericEmailAsync(guestEmail, subject, body);
    }

    public async Task SendGenericEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Smtp:From"] ?? "hello@CarSharing.dev"));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <h1 style='color:#0B1F3A;font-size:24px;'>🚗 CarSharing</h1>
                    </div>
                    {htmlBody}
                    <hr style='border:none;border-top:1px solid #E5E7EB;margin:32px 0;'/>
                    <p style='color:#5B6472;font-size:12px;text-align:center;'>
                        CarSharing — Your next drive, from someone down the street.
                    </p>
                </div>"
            };

            message.Body = bodyBuilder.ToMessageBody();

            await SendMessageAsync(message);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }

    public async Task SendEmailVerificationCodeAsync(string email, string firstName, string code)
    {
        // Subject contains the code — intentional (industry standard: Stripe, GitHub, Airbnb)
        var subject = $"Your CarSharing verification code: {code}";

        // Build digit cells for email-client-safe HTML table
        var digitCells = string.Concat(code.Select(d =>
            $"<td style=\"width:48px;height:56px;text-align:center;vertical-align:middle;" +
            $"font-size:28px;font-weight:700;font-family:monospace,Courier New;" +
            $"background:#F3F4F6;border:1px solid #D1D5DB;border-radius:8px;padding:0 4px;\">{d}</td>"));

        var htmlBody = $@"
            <h2 style='color:#0B1F3A;font-size:22px;font-weight:600;margin-bottom:8px;'>Verify your email</h2>
            <p style='color:#374151;font-size:15px;margin-bottom:24px;'>
              Hi {System.Net.WebUtility.HtmlEncode(firstName)}, enter this code to finish creating your CarSharing account.
            </p>
            <table cellpadding='0' cellspacing='6' style='margin:0 auto 24px;border-collapse:separate;'>
              <tr>{digitCells}</tr>
            </table>
            <p style='color:#6B7280;font-size:13px;'>
              This code expires in 10 minutes. If you didn't request it, you can safely ignore this email.
            </p>";

        var textBody =
            $"Hi {firstName},\r\n\r\n" +
            $"Enter this code to finish creating your CarSharing account:\r\n\r\n" +
            $"{string.Join(" ", code.ToCharArray())}\r\n\r\n" +
            $"This code expires in 10 minutes.\r\n" +
            $"If you didn't request it, you can safely ignore this email.\r\n\r\n" +
            $"— The CarSharing team";

        try
        {
            var message = new MimeMessage();
            message.From.Add(MailboxAddress.Parse(_config["Smtp:From"] ?? "hello@CarSharing.dev"));
            message.To.Add(MailboxAddress.Parse(email));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = $@"
                <div style='font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>
                    <div style='text-align:center;margin-bottom:24px;'>
                        <span style='color:#0B1F3A;font-size:22px;font-weight:700;letter-spacing:-0.5px;'>CarSharing</span>
                    </div>
                    {htmlBody}
                    <hr style='border:none;border-top:1px solid #E5E7EB;margin:32px 0;'/>
                    <p style='color:#5B6472;font-size:12px;text-align:center;'>
                        CarSharing — Your next drive, from someone down the street.
                    </p>
                </div>",
                TextBody = textBody,
            };

            message.Body = bodyBuilder.ToMessageBody();

            await SendMessageAsync(message);

            // Do NOT log the code itself — log only that it was sent
            _logger.LogInformation("Verification code email sent to user with email {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification code email to {Email}", email);
            throw;
        }
    }

    private async Task SendMessageAsync(MimeMessage message)
    {
        var host = _config["Smtp:Host"] ?? "localhost";
        var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
        var username = _config["Smtp:Username"];
        var password = _config["Smtp:Password"];

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
        if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}

