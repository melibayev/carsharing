using CarSharing.Api.Models.Entities;

namespace CarSharing.Api.Services.Auth;

public interface IRefreshTokenService
{
    Task<(string token, RefreshToken entity)> GenerateRefreshTokenAsync(Guid userId);
    Task<RefreshToken?> ValidateRefreshTokenAsync(string token);
    Task RevokeRefreshTokenAsync(string tokenHash, string? replacedByHash = null);
    Task RevokeAllUserTokensAsync(Guid userId);
    string HashToken(string token);
}
