using System.Security.Claims;
using AutoMapper;
using CarSharing.Api.Data;
using CarSharing.Api.Hubs;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using CarSharing.Api.Services.Audit;
using CarSharing.Api.Services.Disputes;
using CarSharing.Api.Services.Verification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IHubContext<AdminHub> _adminHub;
    private readonly IKycService _kycService;
    private readonly IAuditService _auditService;
    private readonly IDisputeService _disputeService;

    public AdminController(AppDbContext db, UserManager<ApplicationUser> userManager,
        IMapper mapper, IHubContext<AdminHub> adminHub,
        IKycService kycService, IAuditService auditService, IDisputeService disputeService)
    {
        _db = db;
        _userManager = userManager;
        _mapper = mapper;
        _adminHub = adminHub;
        _kycService = kycService;
        _auditService = auditService;
        _disputeService = disputeService;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<AdminMetricsDto>> GetMetrics()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalCars = await _db.Cars.Where(c => c.Status != CarStatus.Removed).CountAsync();
        var totalBookings = await _db.Bookings.CountAsync();
        var pendingApprovals = await _db.Cars.CountAsync(c => c.Status == CarStatus.PendingApproval);
        var activeDisputes = await _db.Bookings.CountAsync(b => b.Status == BookingStatus.Disputed);

        var totalRevenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Completed)
            .SumAsync(b => b.ServiceFeeUsd);

        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var monthlyRevenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Completed && b.CompletedAt >= monthStart)
            .SumAsync(b => b.ServiceFeeUsd);

        var recentActivity = await _db.Bookings
            .Include(b => b.Car)
            .Include(b => b.Guest)
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .Select(b => new RecentActivityDto(
                "Booking",
                $"{b.Guest.FirstName} booked {b.Car.Year} {b.Car.Make} {b.Car.Model}",
                b.CreatedAt))
            .ToListAsync();

        return Ok(new AdminMetricsDto(
            totalUsers, totalCars, totalBookings,
            pendingApprovals, activeDisputes,
            totalRevenue, monthlyRevenue,
            recentActivity));
    }

    [HttpGet("cars/pending")]
    public async Task<ActionResult<List<CarDetailDto>>> GetPendingCars()
    {
        var cars = await _db.Cars
            .Include(c => c.Owner)
            .Include(c => c.Photos)
            .Where(c => c.Status == CarStatus.PendingApproval)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(_mapper.Map<List<CarDetailDto>>(cars));
    }

    [HttpPost("cars/{id:guid}/approve")]
    public async Task<IActionResult> ApproveCar(Guid id)
    {
        var car = await _db.Cars.FindAsync(id);
        if (car == null) return NotFound();

        car.Status = CarStatus.Listed;
        await _db.SaveChangesAsync();

        await _adminHub.Clients.Group("admins").SendAsync("ListingApproved", new { carId = id });
        return Ok();
    }

    [HttpPost("cars/{id:guid}/reject")]
    public async Task<IActionResult> RejectCar(Guid id, [FromBody] RejectCarRequest request)
    {
        var car = await _db.Cars.FindAsync(id);
        if (car == null) return NotFound();

        car.Status = CarStatus.Removed;
        car.RejectionReason = request.Reason?.Trim();
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserDto>>> GetUsers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.Users.OrderByDescending(u => u.CreatedAt);
        var totalCount = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = users.Select(u => new AdminUserDto(
            u.Id, u.Email ?? "", u.FirstName, u.LastName,
            u.IsIdentityVerified, u.HostTripCount, u.GuestTripCount,
            u.CreatedAt, u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow,
            u.PhoneNumber
        )).ToList();

        return Ok(new PagedResult<AdminUserDto>(items, totalCount, page, pageSize));
    }

    [HttpPost("users/{id:guid}/ban")]
    public async Task<IActionResult> BanUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        return Ok();
    }

    [HttpPost("users/{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        await _userManager.SetLockoutEndDateAsync(user, null);
        return Ok();
    }

    [HttpPost("users/{id:guid}/verify")]
    public async Task<IActionResult> VerifyUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null) return NotFound();

        user.IsIdentityVerified = true;
        await _userManager.UpdateAsync(user);
        return Ok();
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<PagedResult<AdminBookingDto>>> GetBookings(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.Bookings
            .Include(b => b.Car).ThenInclude(c => c.Photos)
            .Include(b => b.Car).ThenInclude(c => c.Owner)
            .Include(b => b.Guest)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BookingStatus>(status, out var bookingStatus))
            query = query.Where(b => b.Status == bookingStatus);

        query = query.OrderByDescending(b => b.CreatedAt);

        var totalCount = await query.CountAsync();
        var bookings = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = bookings.Select(b => new AdminBookingDto(
            b.Id,
            $"{b.Car.Year} {b.Car.Make} {b.Car.Model}",
            b.Car.Photos.OrderBy(p => p.SortOrder).FirstOrDefault(p => p.IsCover)?.Url
                ?? b.Car.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url,
            $"{b.Guest.FirstName} {b.Guest.LastName}",
            b.Guest.Email ?? "",
            b.Guest.PhoneNumber,
            $"{b.Car.Owner.FirstName} {b.Car.Owner.LastName}",
            b.Car.Owner.Email ?? "",
            b.Status,
            b.TotalChargedUsd,
            b.StartUtc,
            b.EndUtc,
            b.CreatedAt,
            b.GuestMessage,
            b.ConfirmedAt
        )).ToList();

        return Ok(new PagedResult<AdminBookingDto>(items, totalCount, page, pageSize));
    }

    [HttpPost("bookings/{id:guid}/approve")]
    public async Task<IActionResult> ApproveBooking(Guid id)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null) return NotFound();
        if (booking.Status != BookingStatus.PendingApproval)
            return BadRequest(new { message = "Booking is not pending approval" });

        booking.Status = BookingStatus.Confirmed;
        booking.ConfirmedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = booking.Id, status = booking.Status.ToString() });
    }

    [HttpPost("bookings/{id:guid}/reject")]
    public async Task<IActionResult> RejectBooking(Guid id, [FromBody] RejectBookingRequest request)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id);
        if (booking == null) return NotFound();
        if (booking.Status != BookingStatus.PendingApproval)
            return BadRequest(new { message = "Booking is not pending approval" });

        booking.Status = BookingStatus.Rejected;
        booking.HostResponseMessage = request.Reason;
        booking.CancelledAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("cars")]
    public async Task<ActionResult<PagedResult<AdminCarDto>>> GetCars(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _db.Cars
            .Include(c => c.Owner)
            .Include(c => c.Photos)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CarStatus>(status, out var carStatus))
            query = query.Where(c => c.Status == carStatus);
        else
            query = query.Where(c => c.Status != CarStatus.Removed);

        query = query.OrderByDescending(c => c.CreatedAt);

        var totalCount = await query.CountAsync();
        var cars = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = cars.Select(c => new AdminCarDto(
            c.Id, c.Make, c.Model, c.Year, c.City,
            c.DailyPriceUsd, c.Status, $"{c.Owner.FirstName} {c.Owner.LastName}",
            c.Owner.Email ?? "", c.AverageRating, c.TripCount, c.CreatedAt,
            c.Photos.OrderBy(p => p.SortOrder).FirstOrDefault(p => p.IsCover)?.Url
                ?? c.Photos.OrderBy(p => p.SortOrder).FirstOrDefault()?.Url,
            c.VinMismatchFlagged
        )).ToList();

        return Ok(new PagedResult<AdminCarDto>(items, totalCount, page, pageSize));
    }

    [HttpGet("cars/{id:guid}")]
    public async Task<ActionResult<AdminCarDetailDto>> GetCarDetail(Guid id)
    {
        var car = await _db.Cars
            .Include(c => c.Owner)
            .Include(c => c.Photos)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (car == null) return NotFound();

        return Ok(new AdminCarDetailDto
        {
            Id = car.Id,
            Make = car.Make,
            Model = car.Model,
            Year = car.Year,
            Vin = car.Vin,
            Color = car.Color,
            LicensePlate = car.LicensePlate,
            OwnerName = $"{car.Owner.FirstName} {car.Owner.LastName}",
            OwnerEmail = car.Owner.Email ?? "",
            OwnerPhone = car.Owner.PhoneNumber,
            TechPassportFrontUrl = car.TechPassportFrontUrl,
            TechPassportBackUrl = car.TechPassportBackUrl,
            InsurancePolicyUrl = car.InsurancePolicyUrl,
            InsuranceExpiry = car.InsuranceExpiry,
            TechnicalInspectionUrl = car.TechnicalInspectionUrl,
            TechnicalInspectionExpiry = car.TechnicalInspectionExpiry,
            AuthorizationLetterUrl = car.AuthorizationLetterUrl,
            GpsTrackerPhotoUrl = car.GpsTrackerPhotoUrl,
            VinMismatchFlagged = car.VinMismatchFlagged,
            OwnershipRelation = car.OwnershipRelation.ToString(),
            PhotoUrls = car.Photos.OrderBy(p => p.SortOrder).Select(p => p.Url).ToList(),
            CreatedAt = car.CreatedAt,
        });
    }

    [HttpGet("disputes")]
    public async Task<ActionResult<PagedResult<DisputeDto>>> GetDisputes(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _disputeService.GetAllAsync(status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("disputes/{id:guid}")]
    public async Task<ActionResult<DisputeDto>> GetDispute(Guid id)
    {
        var dispute = await _disputeService.GetByIdAsync(id);
        return Ok(dispute);
    }

    [HttpPost("disputes/{id:guid}/resolve")]
    public async Task<ActionResult<DisputeDto>> ResolveDispute(Guid id, [FromBody] ResolveDisputeRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _disputeService.ResolveAsync(id, request, adminId);
        await _auditService.LogAsync("ResolveDispute", "Dispute", id, adminId, User.FindFirstValue(ClaimTypes.Email));
        return Ok(result);
    }

    [HttpPost("disputes/{id:guid}/escalate")]
    public async Task<ActionResult<DisputeDto>> EscalateDispute(Guid id)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _disputeService.EscalateAsync(id, adminId);
        return Ok(result);
    }

    // === KYC Verification ===
    [HttpGet("verifications")]
    public async Task<ActionResult<PagedResult<KycVerificationDto>>> GetVerifications(
        [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _kycService.GetPendingAsync(page, pageSize, status);
        return Ok(result);
    }

    [HttpPost("verifications/{id:guid}/review")]
    public async Task<ActionResult<KycVerificationDto>> ReviewVerification(
        Guid id, [FromBody] ReviewKycRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _kycService.ReviewAsync(id, request, adminId);
        await _auditService.LogAsync(
            request.Approved ? "ApproveKyc" : "RejectKyc",
            "KycVerification", id, adminId, User.FindFirstValue(ClaimTypes.Email));
        return Ok(result);
    }

    // === Audit Logs ===
    [HttpGet("audit-logs")]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? entityType, [FromQuery] Guid? entityId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var result = await _auditService.GetLogsAsync(entityType, entityId, page, pageSize);
        return Ok(result);
    }

    // === Finance ===
    [HttpGet("finance")]
    public async Task<ActionResult<AdminFinanceDto>> GetFinance()
    {
        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

        var totalRevenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Completed)
            .SumAsync(b => b.ServiceFeeUsd);

        var monthlyRevenue = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Completed && b.CompletedAt >= monthStart)
            .SumAsync(b => b.ServiceFeeUsd);

        var pendingPayouts = await _db.PayoutRecords
            .Where(p => p.Status == PayoutStatus.Pending)
            .SumAsync(p => p.AmountUsd);

        var totalPayouts = await _db.PayoutRecords
            .Where(p => p.Status == PayoutStatus.Completed)
            .SumAsync(p => p.AmountUsd);

        var completedBookings = await _db.Bookings
            .CountAsync(b => b.Status == BookingStatus.Completed);

        var avgBookingValue = completedBookings > 0
            ? await _db.Bookings.Where(b => b.Status == BookingStatus.Completed).AverageAsync(b => b.TotalChargedUsd)
            : 0;

        // Last 12 months breakdown
        var twelveMonthsAgo = now.AddMonths(-12);
        var monthlyBreakdown = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Completed && b.CompletedAt >= twelveMonthsAgo)
            .GroupBy(b => new { b.CompletedAt!.Value.Year, b.CompletedAt!.Value.Month })
            .Select(g => new MonthlyRevenueDto(
                g.Key.Year, g.Key.Month,
                g.Sum(b => b.ServiceFeeUsd),
                g.Sum(b => b.HostPayoutUsd),
                g.Count()))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .ToListAsync();

        return Ok(new AdminFinanceDto(
            totalRevenue, monthlyRevenue, pendingPayouts,
            totalPayouts, completedBookings, avgBookingValue,
            monthlyBreakdown));
    }
}
