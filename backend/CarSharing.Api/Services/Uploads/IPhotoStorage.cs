namespace CarSharing.Api.Services.Uploads;

public record PhotoUploadResult(string Url, string? PublicId);

public interface IPhotoStorage
{
    Task<PhotoUploadResult> UploadAsync(Stream fileStream, string fileName, string folder);
    Task DeleteAsync(string publicId);
}
