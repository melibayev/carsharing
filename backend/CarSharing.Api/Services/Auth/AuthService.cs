using AutoMapper;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Services.Email;
using Microsoft.AspNetCore.Identity;

namespace CarSharing.Api.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly IEmailService _emailService;
    private readonly IMapper _mapper;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService,
        IEmailService emailService,
        IMapper mapper,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _emailService = emailService;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            DateOfBirth = request.DateOfBirth
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Registration failed: {errors}");
        }

        await _userManager.AddToRoleAsync(user, "User");

        var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        await _emailService.SendVerificationEmailAsync(user.Email, user.FirstName, emailToken);

        _logger.LogInformation("User {Email} registered successfully", user.Email);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtService.GenerateAccessToken(user, roles);
        var userDto = _mapper.Map<UserDto>(user);

        return new AuthResponse(accessToken, userDto);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        var validPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!validPassword)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtService.GenerateAccessToken(user, roles);
        var userDto = _mapper.Map<UserDto>(user);

        _logger.LogInformation("User {Email} logged in", user.Email);

        return new AuthResponse(accessToken, userDto);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenService.ValidateRefreshTokenAsync(refreshToken)
            ?? throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var user = storedToken.User;
        var roles = await _userManager.GetRolesAsync(user);

        // Rotate: revoke old, create new
        var (newRawToken, newEntity) = await _refreshTokenService.GenerateRefreshTokenAsync(user.Id);
        await _refreshTokenService.RevokeRefreshTokenAsync(storedToken.TokenHash, newEntity.TokenHash);

        var accessToken = _jwtService.GenerateAccessToken(user, roles);
        var userDto = _mapper.Map<UserDto>(user);

        return new AuthResponse(accessToken, userDto);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var hash = _refreshTokenService.HashToken(refreshToken);
        await _refreshTokenService.RevokeRefreshTokenAsync(hash);
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return; // Don't reveal user existence

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        await _emailService.SendPasswordResetEmailAsync(user.Email!, user.FirstName, token);

        _logger.LogInformation("Password reset requested for {Email}", email);
    }

    public Task ResetPasswordAsync(string token, string newPassword)
    {
        // Token contains the user id, extract from it
        // We'll need the email to be passed alongside - adjusting approach
        // Actually, the token is Base64 and contains user info via ASP.NET Identity
        // For simplicity, we look up all users (in production, the reset link includes user id)
        throw new NotImplementedException("ResetPassword requires userId in the reset flow. See controller.");
    }

    public Task<bool> VerifyEmailAsync(string token)
    {
        // Token verification requires userId - handled at controller level
        throw new NotImplementedException("VerifyEmail requires userId. See controller.");
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new KeyNotFoundException("User not found.");

        return _mapper.Map<UserDto>(user);
    }
}
