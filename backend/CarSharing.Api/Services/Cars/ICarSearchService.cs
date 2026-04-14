using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Cars;

public interface ICarSearchService
{
    Task<PagedResult<CarListDto>> SearchAsync(CarSearchRequest request, Guid? callerId = null);
    Task<List<CarListDto>> GetFeaturedAsync(int count = 8);
}
