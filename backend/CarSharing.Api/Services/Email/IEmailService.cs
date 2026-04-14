namespace CarSharing.Api.Services.Email;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string email, string firstName, string token);
    Task SendPasswordResetEmailAsync(string email, string firstName, string token);
    Task SendBookingRequestedEmailAsync(string hostEmail, string hostName, string carTitle, string guestName);
    Task SendBookingConfirmedEmailAsync(string guestEmail, string guestName, string carTitle);
    Task SendBookingRejectedEmailAsync(string guestEmail, string guestName, string carTitle, string reason);
    Task SendGenericEmailAsync(string toEmail, string subject, string htmlBody);
}
