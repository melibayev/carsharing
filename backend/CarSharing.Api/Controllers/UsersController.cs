using System.Security.Claims;
using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Notifications;
using CarSharing.Api.Services.Uploads;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly INotificationService _notificationService;
    private readonly IPhotoStorage _photoStorage;
    private readonly IMapper _mapper;
    private readonly AppDbContext _db;

    public UsersController(
        UserManager<ApplicationUser> userManager,
        INotificationService notificationService,
        IPhotoStorage photoStorage,
        IMapper mapper,
        AppDbContext db)
    {
        _userManager = userManager;
        _notificationService = notificationService;
        _photoStorage = photoStorage;
        _mapper = mapper;
        _db = db;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserPublicDto>> GetPublicProfile(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();
        return Ok(_mapper.Map<UserPublicDto>(user));
    }

    [Authorize]
    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.Bio != null) user.Bio = request.Bio;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;

        await _userManager.UpdateAsync(user);
        return Ok(_mapper.Map<UserDto>(user));
    }

    [Authorize]
    [HttpPost("me/photo")]
    public async Task<ActionResult<UserDto>> UploadPhoto(IFormFile file)
    {
        var userId = GetUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, "profiles");
        user.ProfilePhotoUrl = result.Url;

        await _userManager.UpdateAsync(user);
        return Ok(_mapper.Map<UserDto>(user));
    }

    [Authorize]
    [HttpPost("me/license")]
    public async Task<IActionResult> UploadLicense(IFormFile file)
    {
        var userId = GetUserId();
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return NotFound();

        using var stream = file.OpenReadStream();
        var result = await _photoStorage.UploadAsync(stream, file.FileName, "licenses");
        user.DriverLicensePhotoUrl = result.Url;

        await _userManager.UpdateAsync(user);
        return Ok(new { message = "License uploaded. Pending verification." });
    }

    [Authorize]
    [HttpGet("me/earnings")]
    public async Task<ActionResult<EarningsDto>> GetEarnings()
    {
        var userId = GetUserId();

        var completedBookings = await _db.Bookings
            .Include(b => b.Car)
            .Where(b => b.Car.OwnerId == userId && b.Status == BookingStatus.Completed)
            .ToListAsync();

        var totalEarnings = completedBookings.Sum(b => b.HostPayoutUsd);
        var now = DateTimeOffset.UtcNow;
        var monthlyBookings = completedBookings
            .Where(b => b.CompletedAt?.Year == now.Year && b.CompletedAt?.Month == now.Month);
        var monthlyEarnings = monthlyBookings.Sum(b => b.HostPayoutUsd);

        var pendingPayouts = await _db.Bookings
            .Where(b => b.Car.OwnerId == userId && b.Status == BookingStatus.Completed
                && !_db.PayoutRecords.Any(p => p.BookingId == b.Id))
            .SumAsync(b => b.HostPayoutUsd);

        var monthlyBreakdown = completedBookings
            .Where(b => b.CompletedAt.HasValue)
            .GroupBy(b => new { b.CompletedAt!.Value.Year, b.CompletedAt!.Value.Month })
            .Select(g => new MonthlyEarningDto(g.Key.Year, g.Key.Month, g.Sum(b => b.HostPayoutUsd), g.Count()))
            .OrderByDescending(m => m.Year).ThenByDescending(m => m.Month)
            .ToList();

        var byCarBreakdown = completedBookings
            .GroupBy(b => new { b.CarId, Title = $"{b.Car.Year} {b.Car.Make} {b.Car.Model}" })
            .Select(g => new CarEarningDto(g.Key.CarId, g.Key.Title, g.Sum(b => b.HostPayoutUsd), g.Count()))
            .OrderByDescending(c => c.TotalEarnings)
            .ToList();

        return Ok(new EarningsDto(totalEarnings, monthlyEarnings, pendingPayouts,
            completedBookings.Count, monthlyBreakdown, byCarBreakdown));
    }

    [Authorize]
    [HttpGet("me/notifications")]
    public async Task<ActionResult<PagedResult<NotificationDto>>> GetNotifications(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserId();
        var result = await _notificationService.GetByUserAsync(userId, page, pageSize);
        return Ok(result);
    }

    [Authorize]
    [HttpPost("me/notifications/{id:guid}/read")]
    public async Task<IActionResult> MarkNotificationRead(Guid id)
    {
        var userId = GetUserId();
        await _notificationService.MarkAsReadAsync(id, userId);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me/notifications/unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(count);
    }

    [Authorize]
    [HttpGet("me/favorites")]
    public async Task<ActionResult<List<CarListDto>>> GetFavorites()
    {
        var userId = GetUserId();
        var favorites = await _db.FavoriteCars
            .Include(f => f.Car).ThenInclude(c => c.Photos)
            .Where(f => f.UserId == userId)
            .Select(f => f.Car)
            .ToListAsync();

        return Ok(_mapper.Map<List<CarListDto>>(favorites));
    }

    [Authorize]
    [HttpPost("me/favorites/{carId:guid}")]
    public async Task<IActionResult> AddFavorite(Guid carId)
    {
        var userId = GetUserId();
        var exists = await _db.FavoriteCars.AnyAsync(f => f.UserId == userId && f.CarId == carId);
        if (exists) return Ok();

        _db.FavoriteCars.Add(new FavoriteCar { UserId = userId, CarId = carId });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpDelete("me/favorites/{carId:guid}")]
    public async Task<IActionResult> RemoveFavorite(Guid carId)
    {
        var userId = GetUserId();
        var fav = await _db.FavoriteCars.FirstOrDefaultAsync(f => f.UserId == userId && f.CarId == carId);
        if (fav != null)
        {
            _db.FavoriteCars.Remove(fav);
            await _db.SaveChangesAsync();
        }
        return NoContent();
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
