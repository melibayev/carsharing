using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Verification;

public interface IKycService
{
    Task<KycVerificationDto> SubmitAsync(SubmitKycRequest request, Guid userId);
    Task<KycVerificationDto?> GetLatestForUserAsync(Guid userId);
    Task<PagedResult<KycVerificationDto>> GetPendingAsync(int page, int pageSize, string? status = null);
    Task<KycVerificationDto> ReviewAsync(Guid kycId, ReviewKycRequest request, Guid reviewerId);
}
