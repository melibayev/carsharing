using System.Security.Cryptography;
using System.Text;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Auth;

public class RefreshTokenService : IRefreshTokenService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public RefreshTokenService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<(string token, RefreshToken entity)> GenerateRefreshTokenAsync(Guid userId)
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var hash = HashToken(rawToken);

        var refreshDays = int.TryParse(_config["JWT:RefreshDays"], out var days) ? days : 14;

        var entity = new RefreshToken
        {
            UserId = userId,
            TokenHash = hash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(refreshDays)
        };

        _db.RefreshTokens.Add(entity);
        await _db.SaveChangesAsync();

        return (rawToken, entity);
    }

    public async Task<RefreshToken?> ValidateRefreshTokenAsync(string token)
    {
        var hash = HashToken(token);
        var refreshToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == hash);

        if (refreshToken == null || !refreshToken.IsActive)
        {
            return null;
        }

        return refreshToken;
    }

    public async Task RevokeRefreshTokenAsync(string tokenHash, string? replacedByHash = null)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
        if (token != null)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
            token.ReplacedByTokenHash = replacedByHash;
            await _db.SaveChangesAsync();
        }
    }

    public async Task RevokeAllUserTokensAsync(Guid userId)
    {
        var tokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();
    }

    public string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }
}
