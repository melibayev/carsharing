using CarSharing.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Background;

public class ReviewReminderJob
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReviewReminderJob> _logger;

    public ReviewReminderJob(IServiceProvider serviceProvider, ILogger<ReviewReminderJob> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Auto-publish reviews after 14 days
        var cutoff = DateTimeOffset.UtcNow.AddDays(-14);
        var unpublished = await db.Reviews
            .Where(r => !r.IsPublished && r.CreatedAt < cutoff)
            .ToListAsync();

        foreach (var review in unpublished)
        {
            review.IsPublished = true;
            _logger.LogInformation("Auto-published review {ReviewId}", review.Id);
        }

        if (unpublished.Count > 0)
        {
            await db.SaveChangesAsync();
        }
    }
}
