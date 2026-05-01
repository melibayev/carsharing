using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Uploads;
using CarSharing.Api.Services.Verification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/kyc")]
[Authorize]
public class KycController : ControllerBase
{
    private readonly IKycService _kycService;
    private readonly IPhotoStorage _photoStorage;

    public KycController(IKycService kycService, IPhotoStorage photoStorage)
    {
        _kycService = kycService;
        _photoStorage = photoStorage;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<ActionResult<KycVerificationDto>> Submit(
        [FromForm] string documentType,
        [FromForm] IFormFile documentFront,
        [FromForm] IFormFile? documentBack,
        [FromForm] IFormFile? selfie,
        [FromForm] string? documentNumber,
        [FromForm] string? documentExpiry)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (!Enum.TryParse<KycDocumentType>(documentType, true, out var docType))
            return BadRequest(new { message = "Invalid document type." });

        // Upload files
        using var frontStream = documentFront.OpenReadStream();
        var frontResult = await _photoStorage.UploadAsync(frontStream, documentFront.FileName, "kyc");

        string? backUrl = null;
        if (documentBack != null)
        {
            using var backStream = documentBack.OpenReadStream();
            backUrl = (await _photoStorage.UploadAsync(backStream, documentBack.FileName, "kyc")).Url;
        }

        string? selfieUrl = null;
        if (selfie != null)
        {
            using var selfieStream = selfie.OpenReadStream();
            selfieUrl = (await _photoStorage.UploadAsync(selfieStream, selfie.FileName, "kyc")).Url;
        }

        DateTimeOffset? expiry = null;
        if (!string.IsNullOrWhiteSpace(documentExpiry) && DateTimeOffset.TryParse(documentExpiry, out var parsed))
            expiry = parsed;

        var request = new SubmitKycRequest(docType, frontResult.Url, backUrl, selfieUrl, documentNumber, expiry);
        var result = await _kycService.SubmitAsync(request, userId);
        return Ok(result);
    }

    [HttpGet("status")]
    public async Task<ActionResult<KycVerificationDto>> GetStatus()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _kycService.GetLatestForUserAsync(userId);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
