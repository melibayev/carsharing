using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
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

    public KycController(IKycService kycService)
    {
        _kycService = kycService;
    }

    [HttpPost]
    public async Task<ActionResult<KycVerificationDto>> Submit([FromBody] SubmitKycRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
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
