namespace CarSharing.Api.Services.Host;

public record EligibilityResult(bool CanList, List<string> Missing);

public interface IHostEligibilityService
{
    Task<EligibilityResult> CheckEligibilityAsync(Guid userId);
    Task AssertCanListAsync(Guid userId);
}
