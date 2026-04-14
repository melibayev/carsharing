using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Bookings;

public interface IBookingService
{
    Task<QuoteResponse> GetQuoteAsync(QuoteRequest request);
    Task<BookingDto> CreateAsync(CreateBookingRequest request, Guid guestId);
    Task<BookingDto> GetByIdAsync(Guid bookingId, Guid callerId);
    Task<PagedResult<BookingDto>> GetMyBookingsAsync(Guid userId, string? role, string? status, int page, int pageSize);
    Task<BookingDto> ApproveAsync(Guid bookingId, Guid hostId);
    Task<BookingDto> RejectAsync(Guid bookingId, Guid hostId, string reason);
    Task<BookingDto> CancelAsync(Guid bookingId, Guid callerId, string reason);
    Task<BookingDto> CheckInAsync(Guid bookingId, Guid callerId, CheckInRequest request);
    Task<BookingDto> CheckOutAsync(Guid bookingId, Guid callerId, CheckOutRequest request);
    Task<BookingDto> DisputeAsync(Guid bookingId, Guid callerId, string reason);
}
