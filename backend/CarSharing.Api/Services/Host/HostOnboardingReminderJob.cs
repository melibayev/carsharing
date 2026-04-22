using CarSharing.Api.Data;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Email;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Host;

public class HostOnboardingReminderJob
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<HostOnboardingReminderJob> _logger;

    public HostOnboardingReminderJob(AppDbContext db, IEmailService email, ILogger<HostOnboardingReminderJob> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var cutoff = DateTimeOffset.UtcNow.AddDays(-7);

        var users = await _db.Users
            .Where(u =>
                u.HostOnboardingStatus != HostOnboardingStatus.NotStarted &&
                u.HostOnboardingStatus != HostOnboardingStatus.Complete &&
                u.CreatedAt <= cutoff &&
                u.HostOnboardingReminderSentAt == null)
            .ToListAsync();

        foreach (var user in users)
        {
            try
            {
                await _email.SendGenericEmailAsync(
                    user.Email!,
                    "Complete your host setup to start earning",
                    $"<p>Hi {user.FirstName},</p><p>You started setting up your host profile but haven't finished yet.</p><p>Complete your setup at: <a href='https://carsharing.uz/host/become-a-host'>Become a Host</a></p><p>The CarSharing team</p>");

                user.HostOnboardingReminderSentAt = DateTimeOffset.UtcNow;
                _logger.LogInformation("Sent host onboarding reminder to {UserId}", user.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send host onboarding reminder to {UserId}", user.Id);
            }
        }

        await _db.SaveChangesAsync();
    }
}
