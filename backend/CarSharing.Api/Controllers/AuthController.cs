using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IEmailVerificationService _emailVerificationService;

    public AuthController(
        IAuthService authService,
        IRefreshTokenService refreshTokenService,
        IEmailVerificationService emailVerificationService)
    {
        _authService = authService;
        _refreshTokenService = refreshTokenService;
        _emailVerificationService = emailVerificationService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        var result = await _authService.RegisterAsync(request, ip, ua);
        var (rawToken, _) = await _refreshTokenService.GenerateRefreshTokenAsync(
            result.User.Id);
        SetRefreshCookie(rawToken);
        return CreatedAtAction(nameof(Me), result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        var (rawToken, _) = await _refreshTokenService.GenerateRefreshTokenAsync(result.User.Id);
        SetRefreshCookie(rawToken);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new ProblemDetails { Title = "No refresh token provided." });
        }

        var result = await _authService.RefreshTokenAsync(refreshToken);

        // Generate new refresh token (rotation already handled in AuthService,
        // but we also need to set the cookie with the latest raw token)
        var (newRawToken, _) = await _refreshTokenService.GenerateRefreshTokenAsync(result.User.Id);
        SetRefreshCookie(newRawToken);

        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken);
        }

        Response.Cookies.Delete("refreshToken");
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await _authService.ForgotPasswordAsync(request.Email);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        // The reset flow needs email — in production the link includes it
        // For now, we decode the token (ASP.NET Identity tokens include purpose, not user id directly)
        return Task.FromResult<IActionResult>(NoContent());
    }

    [HttpGet("verify-email")]
    public IActionResult VerifyEmail([FromQuery] string token, [FromQuery] string email)
    {
        // In production: validate token and confirm email
        return NoContent();
    }

    [Authorize]
    [HttpPost("email/send-code")]
    public async Task<IActionResult> SendVerificationCode()
    {
        var userId = GetUserId();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        try
        {
            var user = await _authService.GetCurrentUserAsync(userId);
            var devCode = await _emailVerificationService.IssueAndSendAsync(userId, user.Email, user.FirstName, ip, ua);
            return Ok(new { expiresInSeconds = 600, devCode });
        }
        catch (RateLimitException ex)
        {
            Response.Headers["Retry-After"] = ex.RetryAfterSeconds?.ToString() ?? "60";
            return StatusCode(429, new ProblemDetails { Title = "Too many requests. Please wait before requesting a new code." });
        }
    }

    [Authorize]
    [HttpPost("email/verify-code")]
    public async Task<IActionResult> VerifyEmailCode([FromBody] VerifyEmailCodeRequest request)
    {
        var userId = GetUserId();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _emailVerificationService.VerifyCodeAsync(userId, request.Code, ip);
        if (result.Success)
            return NoContent();

        return BadRequest(new ProblemDetails
        {
            Title = result.FailureReason switch
            {
                EmailVerifyFailureReason.WrongCode => $"Incorrect code.{(result.AttemptsRemaining.HasValue ? $" {result.AttemptsRemaining} attempts remaining." : "")}",
                EmailVerifyFailureReason.Expired => "Code has expired. Please request a new one.",
                EmailVerifyFailureReason.Consumed => "Code has already been used.",
                EmailVerifyFailureReason.RateLimited => "Too many attempts. Please wait and try again.",
                EmailVerifyFailureReason.NoLiveCode => "No active verification code. Please request a new one.",
                _ => "Verification failed."
            }
        });
    }

    [Authorize]
    [HttpGet("email/status")]
    public async Task<ActionResult<EmailVerifyStatusDto>> GetEmailVerificationStatus()
    {
        var userId = GetUserId();
        var status = await _emailVerificationService.GetStatusAsync(userId);
        return Ok(status);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = GetUserId();
        var user = await _authService.GetCurrentUserAsync(userId);
        return Ok(user);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }

    private void SetRefreshCookie(string token)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(14),
            Path = "/api/v1/auth"
        });
    }
}
