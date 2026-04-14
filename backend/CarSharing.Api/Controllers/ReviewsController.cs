using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Reviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ReviewDto>> Create([FromBody] CreateReviewRequest request)
    {
        var userId = GetUserId();
        var review = await _reviewService.CreateAsync(request, userId);
        return CreatedAtAction(null, review);
    }

    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> Get([FromQuery] Guid? carId, [FromQuery] Guid? userId)
    {
        if (carId.HasValue)
            return Ok(await _reviewService.GetByCarAsync(carId.Value));
        if (userId.HasValue)
            return Ok(await _reviewService.GetByUserAsync(userId.Value));
        return BadRequest(new ProblemDetails { Title = "Specify carId or userId." });
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
