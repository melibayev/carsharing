using System.Security.Claims;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    private readonly IPhotoStorage _photoStorage;

    public UploadsController(IPhotoStorage photoStorage)
    {
        _photoStorage = photoStorage;
    }

    [HttpPost]
    public async Task<ActionResult> Upload(IFormFile file, [FromQuery] string folder = "general")
    {
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new ProblemDetails { Title = "File too large. Maximum 10MB." });

        using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, folder);
        return Ok(new { url = result.Url, publicId = result.PublicId });
    }
}
