using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Cars;

public interface ICarService
{
    Task<CarDetailDto> GetByIdAsync(Guid carId, Guid? callerId = null);
    Task<CarDetailDto> CreateAsync(CreateCarRequest request, Guid ownerId);
    Task<CarDetailDto> UpdateAsync(Guid carId, UpdateCarRequest request, Guid ownerId);
    Task DeleteAsync(Guid carId, Guid ownerId);
    Task<CarDetailDto> PublishAsync(Guid carId, Guid ownerId);
    Task<CarDetailDto> SnoozeAsync(Guid carId, Guid ownerId);
    Task<CarDetailDto> UnsnoozeAsync(Guid carId, Guid ownerId);
    Task<List<CarListDto>> GetByOwnerAsync(Guid ownerId);
    Task<CarPhotoDto> AddPhotoAsync(Guid carId, Guid ownerId, Stream fileStream, string fileName, string contentType);
    Task DeletePhotoAsync(Guid carId, Guid photoId, Guid ownerId);
    Task<Guid> BlockDatesAsync(Guid carId, Guid ownerId, BlockDatesRequest request);
    Task DeleteBlockAsync(Guid carId, Guid blockId, Guid ownerId);
}
