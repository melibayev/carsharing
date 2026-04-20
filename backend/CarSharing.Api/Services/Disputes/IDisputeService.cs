using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Disputes;

public interface IDisputeService
{
    Task<DisputeDto> CreateAsync(CreateDisputeRequest request, Guid userId);
    Task<DisputeDto> GetByIdAsync(Guid disputeId);
    Task<PagedResult<DisputeDto>> GetAllAsync(string? status, int page, int pageSize);
    Task<DisputeDto> ResolveAsync(Guid disputeId, ResolveDisputeRequest request, Guid adminId);
    Task<DisputeDto> EscalateAsync(Guid disputeId, Guid adminId);
}
