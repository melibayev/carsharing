using CarSharing.Api.Data;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Host;

public class HostNotEligibleException : Exception
{
    public List<string> Reasons { get; }
    public HostNotEligibleException(List<string> reasons)
        : base("Host is not eligible to list: " + string.Join(", ", reasons))
    {
        Reasons = reasons;
    }
}

public class HostEligibilityService : IHostEligibilityService
{
    private readonly AppDbContext _db;

    public HostEligibilityService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<EligibilityResult> CheckEligibilityAsync(Guid userId)
    {
        var user = await _db.Users
            .Include(u => u.KycVerifications)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return new EligibilityResult(false, new List<string> { "UserNotFound" });

        var missing = new List<string>();

        if (!user.IsPhoneVerified)
            missing.Add("PhoneNotVerified");

        if (user.DateOfBirth == null)
            missing.Add("DateOfBirthMissing");
        else
        {
            var age = DateTimeOffset.UtcNow.Year - user.DateOfBirth.Value.Year;
            if (user.DateOfBirth.Value > DateTimeOffset.UtcNow.AddYears(-age)) age--;
            if (age < 21)
                missing.Add("Under21");
        }

        var latestKyc = user.KycVerifications
            .OrderByDescending(k => k.CreatedAt)
            .FirstOrDefault();
        if (latestKyc == null || latestKyc.Status != KycStatus.Approved)
            missing.Add("IdentityNotVerified");

        if (user.HostOnboardingStatus != HostOnboardingStatus.Complete)
            missing.Add("HostOnboardingIncomplete");

        if (user.HostAgreementSignedAt == null)
            missing.Add("HostAgreementNotSigned");

        if (user.IsBanned)
            missing.Add("UserBanned");

        if (user.IsOnFraudWatchlist)
            missing.Add("OnFraudWatchlist");

        return new EligibilityResult(missing.Count == 0, missing);
    }

    public async Task AssertCanListAsync(Guid userId)
    {
        var result = await CheckEligibilityAsync(userId);
        if (!result.CanList)
            throw new HostNotEligibleException(result.Missing);
    }
}
