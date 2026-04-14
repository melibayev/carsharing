using CarSharing.Api.Models.Entities;

namespace CarSharing.Api.Services.Auth;

public interface IJwtService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    int GetAccessTokenMinutes();
}
