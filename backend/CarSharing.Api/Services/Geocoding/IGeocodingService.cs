using NetTopologySuite.Geometries;

namespace CarSharing.Api.Services.Geocoding;

public interface IGeocodingService
{
    Task<Point?> GeocodeAsync(string? addressLine, string city, string? region, string? country, string? postalCode);
}
