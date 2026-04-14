using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Bookings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/bookings")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpPost("quote")]
    public async Task<ActionResult<QuoteResponse>> GetQuote([FromBody] QuoteRequest request)
    {
        var quote = await _bookingService.GetQuoteAsync(request);
        return Ok(quote);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create([FromBody] CreateBookingRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, booking);
    }

    [Authorize]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingDto>> GetById(Guid id)
    {
        var userId = GetUserId();
        var booking = await _bookingService.GetByIdAsync(id, userId);
        return Ok(booking);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<PagedResult<BookingDto>>> GetMyBookings(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var result = await _bookingService.GetMyBookingsAsync(userId, role, status, page, pageSize);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<BookingDto>> Approve(Guid id)
    {
        var userId = GetUserId();
        var booking = await _bookingService.ApproveAsync(id, userId);
        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<BookingDto>> Reject(Guid id, [FromBody] RejectBookingRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.RejectAsync(id, userId, request.Reason);
        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<BookingDto>> Cancel(Guid id, [FromBody] CancelBookingRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.CancelAsync(id, userId, request.Reason);
        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/check-in")]
    public async Task<ActionResult<BookingDto>> CheckIn(Guid id, [FromBody] CheckInRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.CheckInAsync(id, userId, request);
        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/check-out")]
    public async Task<ActionResult<BookingDto>> CheckOut(Guid id, [FromBody] CheckOutRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.CheckOutAsync(id, userId, request);
        return Ok(booking);
    }

    [Authorize]
    [HttpPost("{id:guid}/dispute")]
    public async Task<ActionResult<BookingDto>> Dispute(Guid id, [FromBody] DisputeBookingRequest request)
    {
        var userId = GetUserId();
        var booking = await _bookingService.DisputeAsync(id, userId, request.Reason);
        return Ok(booking);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
