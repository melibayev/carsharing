using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;

namespace CarSharing.Api.Services.Bookings;

public interface IPricingService
{
    QuoteResponse CalculateQuote(Car car, DateTimeOffset startUtc, DateTimeOffset endUtc);
}
