using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace CarSharing.Api.Services.Uploads;

public class CloudinaryPhotoStorage : IPhotoStorage
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryPhotoStorage> _logger;

    public CloudinaryPhotoStorage(IConfiguration config, ILogger<CloudinaryPhotoStorage> logger)
    {
        _logger = logger;
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<PhotoUploadResult> UploadAsync(Stream fileStream, string fileName, string folder)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = $"CarSharing/{folder}",
            Transformation = new Transformation().Quality("auto").FetchFormat("webp")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
        {
            _logger.LogError("Cloudinary upload failed: {Error}", result.Error.Message);
            throw new InvalidOperationException($"Photo upload failed: {result.Error.Message}");
        }

        _logger.LogInformation("Photo uploaded to Cloudinary: {PublicId}", result.PublicId);

        return new PhotoUploadResult(result.SecureUrl.ToString(), result.PublicId);
    }

    public async Task DeleteAsync(string publicId)
    {
        var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
        if (result.Error != null)
        {
            _logger.LogWarning("Cloudinary delete failed for {PublicId}: {Error}", publicId, result.Error.Message);
        }
    }
}
