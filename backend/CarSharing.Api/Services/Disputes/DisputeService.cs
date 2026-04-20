using System.Text.Json;
using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Disputes;

public class DisputeService : IDisputeService
{
    private readonly AppDbContext _db;

    public DisputeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DisputeDto> CreateAsync(CreateDisputeRequest request, Guid userId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Car)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId)
            ?? throw new KeyNotFoundException("Booking not found.");

        if (booking.GuestId != userId && booking.Car.OwnerId != userId)
            throw new UnauthorizedAccessException("You are not a party to this booking.");

        var dispute = new Dispute
        {
            BookingId = request.BookingId,
            FiledById = userId,
            Category = request.Category,
            Description = request.Description,
            EvidenceUrls = request.EvidenceUrls != null ? JsonSerializer.Serialize(request.EvidenceUrls) : null,
            Status = DisputeStatus.Open,
        };

        _db.Disputes.Add(dispute);

        // Update booking status to Disputed
        booking.Status = BookingStatus.Disputed;
        await _db.SaveChangesAsync();

        return await MapToDto(dispute.Id);
    }

    public async Task<DisputeDto> GetByIdAsync(Guid disputeId)
    {
        return await MapToDto(disputeId);
    }

    public async Task<PagedResult<DisputeDto>> GetAllAsync(string? status, int page, int pageSize)
    {
        var query = _db.Disputes.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<DisputeStatus>(status, true, out var parsed))
            query = query.Where(d => d.Status == parsed);

        query = query.OrderByDescending(d => d.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DisputeDto
            {
                Id = d.Id,
                BookingId = d.BookingId,
                BookingTitle = d.Booking.Car.Make + " " + d.Booking.Car.Model,
                FiledById = d.FiledById,
                FiledByName = d.FiledBy.FirstName + " " + d.FiledBy.LastName,
                Status = d.Status,
                Category = d.Category,
                Description = d.Description,
                EvidenceUrls = d.EvidenceUrls != null
                    ? JsonSerializer.Deserialize<List<string>>(d.EvidenceUrls) ?? new()
                    : new(),
                Resolution = d.Resolution,
                RefundAmount = d.RefundAmount,
                ResolvedAt = d.ResolvedAt,
                CreatedAt = d.CreatedAt,
            })
            .ToListAsync();

        return new PagedResult<DisputeDto>(items, total, page, pageSize);
    }

    public async Task<DisputeDto> ResolveAsync(Guid disputeId, ResolveDisputeRequest request, Guid adminId)
    {
        var dispute = await _db.Disputes
            .FirstOrDefaultAsync(d => d.Id == disputeId)
            ?? throw new KeyNotFoundException("Dispute not found.");

        dispute.Status = DisputeStatus.Resolved;
        dispute.Resolution = request.Resolution;
        dispute.RefundAmount = request.RefundAmount;
        dispute.ResolvedById = adminId;
        dispute.ResolvedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return await MapToDto(dispute.Id);
    }

    public async Task<DisputeDto> EscalateAsync(Guid disputeId, Guid adminId)
    {
        var dispute = await _db.Disputes
            .FirstOrDefaultAsync(d => d.Id == disputeId)
            ?? throw new KeyNotFoundException("Dispute not found.");

        dispute.Status = DisputeStatus.Escalated;
        await _db.SaveChangesAsync();
        return await MapToDto(dispute.Id);
    }

    private async Task<DisputeDto> MapToDto(Guid disputeId)
    {
        return await _db.Disputes
            .Where(d => d.Id == disputeId)
            .Select(d => new DisputeDto
            {
                Id = d.Id,
                BookingId = d.BookingId,
                BookingTitle = d.Booking.Car.Make + " " + d.Booking.Car.Model,
                FiledById = d.FiledById,
                FiledByName = d.FiledBy.FirstName + " " + d.FiledBy.LastName,
                Status = d.Status,
                Category = d.Category,
                Description = d.Description,
                EvidenceUrls = d.EvidenceUrls != null
                    ? JsonSerializer.Deserialize<List<string>>(d.EvidenceUrls) ?? new()
                    : new(),
                Resolution = d.Resolution,
                RefundAmount = d.RefundAmount,
                ResolvedAt = d.ResolvedAt,
                CreatedAt = d.CreatedAt,
            })
            .FirstAsync();
    }
}
