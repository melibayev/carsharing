using MailKit.Net.Smtp;
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

            using var client = new SmtpClient();
            var host = _config["Smtp:Host"] ?? "mailhog";
            var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 1025;
            await client.ConnectAsync(host, port, false);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
