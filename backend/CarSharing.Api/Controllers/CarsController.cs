using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Cars;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/cars")]
public class CarsController : ControllerBase
{
    private readonly ICarService _carService;
    private readonly ICarSearchService _searchService;

    public CarsController(ICarService carService, ICarSearchService searchService)
    {
        _carService = carService;
        _searchService = searchService;
    }

    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<CarListDto>>> Search([FromQuery] CarSearchRequest request)
    {
        var callerId = GetUserIdOrNull();
        var result = await _searchService.SearchAsync(request, callerId);
        return Ok(result);
    }

    [HttpGet("featured")]
    public async Task<ActionResult<List<CarListDto>>> Featured([FromQuery] int count = 8)
    {
        var result = await _searchService.GetFeaturedAsync(count);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CarDetailDto>> GetById(Guid id)
    {
        var callerId = GetUserIdOrNull();
        var car = await _carService.GetByIdAsync(id, callerId);
        return Ok(car);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<CarDetailDto>> Create([FromBody] CreateCarRequest request)
    {
        var userId = GetUserId();
        var car = await _carService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = car.Id }, car);
    }

    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CarDetailDto>> Update(Guid id, [FromBody] UpdateCarRequest request)
    {
        var userId = GetUserId();
        var car = await _carService.UpdateAsync(id, request, userId);
        return Ok(car);
    }

    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        await _carService.DeleteAsync(id, userId);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<CarDetailDto>> Publish(Guid id)
    {
        var userId = GetUserId();
        var car = await _carService.PublishAsync(id, userId);
        return Ok(car);
    }

    [Authorize]
    [HttpPost("{id:guid}/snooze")]
    public async Task<ActionResult<CarDetailDto>> Snooze(Guid id)
    {
        var userId = GetUserId();
        var car = await _carService.SnoozeAsync(id, userId);
        return Ok(car);
    }

    [Authorize]
    [HttpPost("{id:guid}/unsnooze")]
    public async Task<ActionResult<CarDetailDto>> Unsnooze(Guid id)
    {
        var userId = GetUserId();
        var car = await _carService.UnsnoozeAsync(id, userId);
        return Ok(car);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<List<CarListDto>>> GetMyCars()
    {
        var userId = GetUserId();
        var cars = await _carService.GetByOwnerAsync(userId);
        return Ok(cars);
    }

    [Authorize]
    [HttpPost("{id:guid}/photos")]
    public async Task<ActionResult<CarPhotoDto>> UploadPhoto(Guid id, IFormFile file)
    {
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new ProblemDetails { Title = "File too large. Maximum 10MB." });

        var userId = GetUserId();
        using var stream = file.OpenReadStream();
        var photo = await _carService.AddPhotoAsync(id, userId, stream, file.FileName, file.ContentType);
        return Ok(photo);
    }

    [Authorize]
    [HttpDelete("{id:guid}/photos/{photoId:guid}")]
    public async Task<IActionResult> DeletePhoto(Guid id, Guid photoId)
    {
        var userId = GetUserId();
        await _carService.DeletePhotoAsync(id, photoId, userId);
        return NoContent();
    }

    [Authorize]
    [HttpPost("{id:guid}/availability/block")]
    public async Task<ActionResult> BlockDates(Guid id, [FromBody] BlockDatesRequest request)
    {
        var userId = GetUserId();
        var blockId = await _carService.BlockDatesAsync(id, userId, request);
        return Ok(new { id = blockId });
    }

    [Authorize]
    [HttpDelete("{id:guid}/availability/{blockId:guid}")]
    public async Task<IActionResult> DeleteBlock(Guid id, Guid blockId)
    {
        var userId = GetUserId();
        await _carService.DeleteBlockAsync(id, blockId, userId);
        return NoContent();
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }

    private Guid? GetUserIdOrNull()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return claim != null ? Guid.Parse(claim) : null;
    }
}
