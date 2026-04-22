using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Services.Host;

public record AutoCheckResult(string Check, bool Passed, string? Message = null);
public record ListingReviewResult(bool CanAutoApprove, List<AutoCheckResult> Checks, int FraudScore);

public interface IListingReviewService
{
    Task<ListingReviewResult> RunAutoChecksAsync(Car car, ApplicationUser host);
}
