using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Reviews;

public interface IReviewService
{
    Task<ReviewDto> CreateAsync(CreateReviewRequest request, Guid authorId);
    Task<List<ReviewDto>> GetByCarAsync(Guid carId);
    Task<List<ReviewDto>> GetByUserAsync(Guid userId);
}
