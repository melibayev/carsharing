using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Payments;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
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
    private readonly IPaymentService _paymentService;
    private readonly IDataProtector _protector;

    public OnboardingController(
        UserManager<ApplicationUser> userManager,
        IPhotoStorage photoStorage,
        IPaymentService paymentService,
        IDataProtectionProvider dataProtectionProvider)
    {
        _userManager = userManager;
        _photoStorage = photoStorage;
        _paymentService = paymentService;
        _protector = dataProtectionProvider.CreateProtector("OnboardingSecrets");
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
        user.Gender = request.Gender;
        user.PhoneNumber = request.PhoneNumber;
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
            user.IsPhoneVerified = true;
        user.HomeAddressLine = request.HomeAddressLine;
        user.HomeCity = request.HomeCity;
        user.HomeRegionId = request.HomeRegionId;
        user.HomePostalCode = request.HomePostalCode;
        user.HomeLat = request.HomeLat;
        user.HomeLng = request.HomeLng;

        if (user.OnboardingStatus is null or ProfileCompletionStatus.Step1Done)
            user.OnboardingStatus = ProfileCompletionStatus.Step2Done;

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step3")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep3([FromBody] OnboardingStep3Request request)
    {
        var user = await GetCurrentUserAsync();

        user.DriverLicenseNumber = _protector.Protect(request.DriverLicenseNumber);
        user.DriverLicenseExpiry = request.DriverLicenseExpiry;
        user.DriverLicensePhotoUrl = request.DriverLicensePhotoUrl;
        user.DriverLicenseBackUrl = request.DriverLicenseBackUrl;
        user.DriverLicenseSelfieUrl = request.DriverLicenseSelfieUrl;
        user.LicenseIssuedCountry = request.LicenseIssuedCountry;
        user.LicenseIssuedRegionId = request.LicenseIssuedRegionId;

        if (user.OnboardingStatus is ProfileCompletionStatus.Step2Done)
            user.OnboardingStatus = ProfileCompletionStatus.Step3Done;

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step4")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep4([FromBody] OnboardingStep4Request request)
    {
        var user = await GetCurrentUserAsync();

        if (request.Skipped)
        {
            user.Step4Skipped = true;
        }
        else
        {
            user.IdentityDocumentType = request.DocumentType switch
            {
                "Passport" => IdentityDocumentType.Passport,
                "NationalId" => IdentityDocumentType.NationalId,
                _ => IdentityDocumentType.None,
            };
            if (!string.IsNullOrEmpty(request.DocumentNumber))
                user.IdentityDocumentNumber = _protector.Protect(request.DocumentNumber);
            user.IdentityDocumentFrontUrl = request.DocumentFrontUrl;
            user.IdentityDocumentBackUrl = request.DocumentBackUrl;
            user.IdentitySelfieUrl = request.SelfieUrl;
        }

        if (user.OnboardingStatus is ProfileCompletionStatus.Step3Done)
            user.OnboardingStatus = ProfileCompletionStatus.Step4Done;

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPatch("step5")]
    public async Task<ActionResult<OnboardingStatusDto>> UpdateStep5([FromBody] OnboardingStep5Request request)
    {
        var user = await GetCurrentUserAsync();

        var paymentMethodId = await _paymentService.CreateSetupIntentAsync(user.Id);

        user.PaymentMethodId = paymentMethodId;
        user.CardLast4 = request.Last4;
        user.CardBrand = request.Brand;
        user.CardholderName = request.CardholderName;
        user.BillingAddressJson = request.BillingAddressJson;
        user.OnboardingStatus = ProfileCompletionStatus.Complete;
        user.IsIdentityVerified = true;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _userManager.UpdateAsync(user);
        return Ok(MapStatus(user));
    }

    [HttpPost("documents/upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<ActionResult<DocumentUploadResponse>> UploadDocument(IFormFile file)
    {
        if (file.Length == 0 || file.Length > 10 * 1024 * 1024)
            return BadRequest(new ProblemDetails { Title = "File must be between 1 byte and 10 MB." });

        // Verify magic bytes, not just Content-Type
        var allowedSignatures = new Dictionary<string, byte[][]>
        {
            ["image/jpeg"] = [new byte[] { 0xFF, 0xD8, 0xFF }],
            ["image/png"] = [new byte[] { 0x89, 0x50, 0x4E, 0x47 }],
            ["image/webp"] = [new byte[] { 0x52, 0x49, 0x46, 0x46 }],
        };

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        ms.Position = 0;
        var header = new byte[12];
        await ms.ReadAsync(header.AsMemory(0, Math.Min(12, (int)ms.Length)));
        ms.Position = 0;

        var isValid = false;
        foreach (var (_, signatures) in allowedSignatures)
        {
            foreach (var sig in signatures)
            {
                if (header.AsSpan(0, sig.Length).SequenceEqual(sig))
                {
                    isValid = true;
                    break;
                }
            }
            if (isValid) break;
        }

        if (!isValid)
            return BadRequest(new ProblemDetails { Title = "Only JPEG, PNG, and WebP files are allowed." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
        var folder = $"user-docs/{userId}";
        var result = await _photoStorage.UploadAsync(ms, file.FileName, folder);
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
            MiddleName = user.MiddleName,
            DateOfBirth = user.DateOfBirth,
            PhoneNumber = user.PhoneNumber,
            HomeAddressLine = user.HomeAddressLine,
            HomeCity = user.HomeCity,
            HomeRegionId = user.HomeRegionId,
            HomePostalCode = user.HomePostalCode,
            Gender = user.Gender,
            LicenseIssuedCountry = user.LicenseIssuedCountry,
            LicenseIssuedRegionId = user.LicenseIssuedRegionId,
            DriverLicenseExpiry = user.DriverLicenseExpiry,
            DriverLicensePhotoUrl = user.DriverLicensePhotoUrl,
            DriverLicenseBackUrl = user.DriverLicenseBackUrl,
            DriverLicenseSelfieUrl = user.DriverLicenseSelfieUrl,
            IdentityDocumentType = user.IdentityDocumentType == Models.Enums.IdentityDocumentType.None
                ? null
                : user.IdentityDocumentType.ToString(),
            IdentityDocumentFrontUrl = user.IdentityDocumentFrontUrl,
            IdentityDocumentBackUrl = user.IdentityDocumentBackUrl,
            IdentitySelfieUrl = user.IdentitySelfieUrl,
            Step4Skipped = user.Step4Skipped,
            CardLast4 = user.CardLast4,
            CardBrand = user.CardBrand,
            CardholderName = user.CardholderName,
        };
    }
}
