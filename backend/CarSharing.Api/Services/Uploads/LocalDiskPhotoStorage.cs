namespace CarSharing.Api.Services.Uploads;

public class LocalDiskPhotoStorage : IPhotoStorage
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<LocalDiskPhotoStorage> _logger;

    public LocalDiskPhotoStorage(IWebHostEnvironment env, ILogger<LocalDiskPhotoStorage> logger)
    {
        _env = env;
        _logger = logger;
    }

    public async Task<PhotoUploadResult> UploadAsync(Stream fileStream, string fileName, string folder)
    {
        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", folder);
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext)) ext = ".jpg";

        var safeName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, safeName);

        using var fs = File.Create(filePath);
        await fileStream.CopyToAsync(fs);

        var url = $"/uploads/{folder}/{safeName}";
        _logger.LogInformation("Photo saved to local disk: {Url}", url);

        return new PhotoUploadResult(url, null);
    }

    public Task DeleteAsync(string publicId)
    {
        // For local disk, publicId is not used — files cleaned up manually
        return Task.CompletedTask;
    }
}
