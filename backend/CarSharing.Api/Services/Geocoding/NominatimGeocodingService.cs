using System.Net.Http.Json;
using System.Text.Json.Serialization;
using NetTopologySuite.Geometries;

namespace CarSharing.Api.Services.Geocoding;

public class NominatimGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NominatimGeocodingService> _logger;

    // Known city coordinates as fallback (to avoid hitting Nominatim rate limits during seeding)
    private static readonly Dictionary<string, (double Lat, double Lng)> KnownCities = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Los Angeles"] = (34.0522, -118.2437),
        ["San Francisco"] = (37.7749, -122.4194),
        ["New York"] = (40.7128, -74.0060),
        ["Miami"] = (25.7617, -80.1918),
        ["Austin"] = (30.2672, -97.7431),
        ["Seattle"] = (47.6062, -122.3321),
    };

    public NominatimGeocodingService(HttpClient httpClient, ILogger<NominatimGeocodingService> logger)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("CarSharing/1.0");
        _logger = logger;
    }

    public async Task<Point?> GeocodeAsync(string? addressLine, string city, string? region, string? country, string? postalCode)
    {
        // Try known cities first (avoids rate limiting during seed)
        if (KnownCities.TryGetValue(city, out var known))
        {
            var factory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(4326);
            // Add small random offset to spread pins around the city
            var random = new Random();
            var latOffset = (random.NextDouble() - 0.5) * 0.08;
            var lngOffset = (random.NextDouble() - 0.5) * 0.08;
            return factory.CreatePoint(new Coordinate(known.Lng + lngOffset, known.Lat + latOffset));
        }

        try
        {
            var queryParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(addressLine)) queryParts.Add(addressLine);
            queryParts.Add(city);
            if (!string.IsNullOrWhiteSpace(region)) queryParts.Add(region);
            if (!string.IsNullOrWhiteSpace(country)) queryParts.Add(country);

            var query = Uri.EscapeDataString(string.Join(", ", queryParts));
            var url = $"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1";

            var results = await _httpClient.GetFromJsonAsync<List<NominatimResult>>(url);
            if (results?.Count > 0)
            {
                var result = results[0];
                if (double.TryParse(result.Lat, out var lat) && double.TryParse(result.Lon, out var lng))
                {
                    var geoFactory = NetTopologySuite.NtsGeometryServices.Instance.CreateGeometryFactory(4326);
                    return geoFactory.CreatePoint(new Coordinate(lng, lat));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nominatim geocoding failed for {City}", city);
        }

        return null;
    }

    private class NominatimResult
    {
        [JsonPropertyName("lat")]
        public string Lat { get; set; } = string.Empty;

        [JsonPropertyName("lon")]
        public string Lon { get; set; } = string.Empty;
    }
}
