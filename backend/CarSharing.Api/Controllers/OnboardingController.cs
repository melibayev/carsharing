using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using CarSharing.Api.Models.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPhotoStorage _photoStorage;

    public OnboardingController(
        UserManager<ApplicationUser> userManager,
        IPhotoStorage photoStorage)
    {
        _userManager = userManager;
        _photoStorage = photoStorage;
    }

    [HttpGet("status")]
    public async Task<ActionResult<OnboardingStatusDto>> GetStatus()
    {
        var user = await GetCurrentUserAsync();
        return Ok(MapStatus(user));
    }

    [HttpPatch("step2")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep2([FromBody] OnboardingStep2Request request)
    {
        var user = await GetCurrentUserAsync();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.MiddleName = request.MiddleName;
        user.DateOfBirth = request.DateOfBirth;
        user.PhoneNumber = request.PhoneNumber;
        user.AddressLine1 = request.AddressLine1;
        user.AddressCity = request.AddressCity;
        user.AddressRegion = request.AddressRegion;
        user.AddressPostalCode = request.AddressPostalCode;
        user.OnboardingStatus = ProfileCompletionStatus.Step2Done;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step3")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep3([FromBody] OnboardingStep3Request request)
    {
        var user = await GetCurrentUserAsync();

        user.DriverLicenseNumber = request.DriverLicenseNumber;
        user.DriverLicenseExpiry = request.DriverLicenseExpiry;
        user.DriverLicensePhotoUrl = request.DriverLicensePhotoUrl;
        user.OnboardingStatus = ProfileCompletionStatus.Step3Done;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step4")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep4([FromBody] OnboardingStep4Request request)
    {
        var user = await GetCurrentUserAsync();

        user.NationalIdNumber = request.NationalIdNumber;
        user.NationalIdFrontUrl = request.NationalIdFrontUrl;
        user.NationalIdBackUrl = request.NationalIdBackUrl;
        user.SelfieUrl = request.SelfieUrl;
        user.OnboardingStatus = ProfileCompletionStatus.Step4Done;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step5")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep5([FromBody] OnboardingStep5Request request)
    {
        var user = await GetCurrentUserAsync();

        user.PaymentMethodLast4 = request.PaymentMethodLast4;
        user.PaymentMethodBrand = request.PaymentMethodBrand;
        user.OnboardingStatus = ProfileCompletionStatus.Complete;
        user.IsIdentityVerified = true;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPost("documents/upload")]
    public async Task<ActionResult<DocumentUploadResponse>> UploadDocument(IFormFile file)
    {
        if (file.Length == 0 || file.Length > 10 * 1024 * 1024)
            return BadRequest(new ProblemDetails { Title = "File must be between 1 byte and 10MB." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "application/pdf" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new ProblemDetails { Title = "Only JPEG, PNG, WebP, and PDF files are allowed." });

        using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, "onboarding");
        return Ok(new DocumentUploadResponse(result.Url));
    }

    [AllowAnonymous]
    [HttpGet("email-available")]
    public async Task<ActionResult<EmailAvailableResponse>> CheckEmailAvailable([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new ProblemDetails { Title = "Email is required." });

        var existing = await _userManager.FindByEmailAsync(email);
        return Ok(new EmailAvailableResponse(existing == null));
    }

    private async Task<ApplicationUser> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException();
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new UnauthorizedAccessException();
        return user;
    }

    private static OnboardingStatusDto MapStatus(ApplicationUser user)
    {
        var status = user.OnboardingStatus;
        var step = status switch
        {
            null => 1,
            ProfileCompletionStatus.Step1Done => 2,
            ProfileCompletionStatus.Step2Done => 3,
            ProfileCompletionStatus.Step3Done => 4,
            ProfileCompletionStatus.Step4Done => 5,
            ProfileCompletionStatus.Complete => 5,
            ProfileCompletionStatus.Rejected => 1,
            _ => 1
        };

        return new OnboardingStatusDto
        {
            Status = status,
            CurrentStep = step,
            IsComplete = status == ProfileCompletionStatus.Complete,
            Email = user.Email ?? "",
            FirstName = user.FirstName,
            LastName = user.LastName,
        };
    }
}
