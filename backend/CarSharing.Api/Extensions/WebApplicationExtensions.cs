using CarSharing.Api.Data;
using CarSharing.Api.Data.Seed;
using CarSharing.Api.Middleware;
using CarSharing.Api.Services.Background;
using CarSharing.Api.Services.Host;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Extensions;

public static class WebApplicationExtensions
{
    public static async Task RunMigrationsAsync(this WebApplication app)
    {
        var config = app.Configuration;
        var runMigrations = config.GetValue<bool>("App:RunMigrationsOnStartup");

        if (!runMigrations) return;

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        logger.LogInformation("Running database migrations...");

        var retries = 0;
        const int maxRetries = 10;

        while (retries < maxRetries)
        {
            try
            {
                await db.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully.");
                return;
            }
            catch (Exception ex) when (retries < maxRetries - 1)
            {
                retries++;
                logger.LogWarning(ex, "Migration attempt {Attempt} failed, retrying in 3s...", retries);
                await Task.Delay(3000);
            }
        }
    }

    public static async Task RunSeederAsync(this WebApplication app)
    {
        var config = app.Configuration;
        var seedOnStartup = config.GetValue<bool>("App:SeedOnStartup");

        if (!seedOnStartup) return;

        using var scope = app.Services.CreateScope();
        var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
        await seeder.SeedAsync();
    }

    public static void ConfigureHangfireJobs(this WebApplication app)
    {
        RecurringJob.AddOrUpdate<BookingExpiryJob>(
            "booking-expiry",
            job => job.ExecuteAsync(),
            Cron.Minutely);

        RecurringJob.AddOrUpdate<PayoutJob>(
            "process-payouts",
            job => job.ExecuteAsync(),
            Cron.Daily);

        RecurringJob.AddOrUpdate<ReviewReminderJob>(
            "review-reminders",
            job => job.ExecuteAsync(),
            Cron.Daily);

        RecurringJob.AddOrUpdate<HostOnboardingReminderJob>(
            "host-onboarding-reminders",
            job => job.ExecuteAsync(),
            Cron.Daily);
    }

    public static void UseCustomMiddleware(this WebApplication app)
    {
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<ExceptionHandlingMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
    }
}
