using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Verification;

public class KycService : IKycService
{
    private readonly AppDbContext _db;

    public KycService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<KycVerificationDto> SubmitAsync(SubmitKycRequest request, Guid userId)
    {
        // Reject if there's already a pending or approved KYC
        var existing = await _db.KycVerifications
            .Where(k => k.UserId == userId && (k.Status == KycStatus.Pending || k.Status == KycStatus.InReview))
            .AnyAsync();

        if (existing)
            throw new InvalidOperationException("You already have a pending verification request.");

        var kyc = new KycVerification
        {
            UserId = userId,
            DocumentType = request.DocumentType,
            DocumentFrontUrl = request.DocumentFrontUrl,
            DocumentBackUrl = request.DocumentBackUrl,
            SelfieUrl = request.SelfieUrl,
            DocumentNumber = request.DocumentNumber,
            DocumentExpiry = request.DocumentExpiry,
            Status = KycStatus.Pending,
        };

        _db.KycVerifications.Add(kyc);
        await _db.SaveChangesAsync();

        return await MapToDto(kyc.Id);
    }

    public async Task<KycVerificationDto?> GetLatestForUserAsync(Guid userId)
    {
        var kyc = await _db.KycVerifications
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .FirstOrDefaultAsync();

        if (kyc == null) return null;
        return await MapToDto(kyc.Id);
    }

    public async Task<PagedResult<KycVerificationDto>> GetPendingAsync(int page, int pageSize)
    {
        var query = _db.KycVerifications
            .Where(k => k.Status == KycStatus.Pending || k.Status == KycStatus.InReview)
            .OrderBy(k => k.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(k => new KycVerificationDto
            {
                Id = k.Id,
                UserId = k.UserId,
                UserName = k.User.FirstName + " " + k.User.LastName,
                UserEmail = k.User.Email!,
                Status = k.Status,
                DocumentType = k.DocumentType,
                DocumentFrontUrl = k.DocumentFrontUrl,
                DocumentBackUrl = k.DocumentBackUrl,
                SelfieUrl = k.SelfieUrl,
                DocumentNumber = k.DocumentNumber,
                DocumentExpiry = k.DocumentExpiry,
                RejectionReason = k.RejectionReason,
                ReviewedAt = k.ReviewedAt,
                Notes = k.Notes,
                CreatedAt = k.CreatedAt,
            })
            .ToListAsync();

        return new PagedResult<KycVerificationDto>(items, total, page, pageSize);
    }

    public async Task<KycVerificationDto> ReviewAsync(Guid kycId, ReviewKycRequest request, Guid reviewerId)
    {
        var kyc = await _db.KycVerifications
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.Id == kycId)
            ?? throw new KeyNotFoundException("KYC verification not found.");

        kyc.Status = request.Approved ? KycStatus.Approved : KycStatus.Rejected;
        kyc.RejectionReason = request.Approved ? null : request.RejectionReason;
        kyc.Notes = request.Notes;
        kyc.ReviewedById = reviewerId;
        kyc.ReviewedAt = DateTimeOffset.UtcNow;

        if (request.Approved)
        {
            kyc.User.IsIdentityVerified = true;
        }

        await _db.SaveChangesAsync();
        return await MapToDto(kyc.Id);
    }

    private async Task<KycVerificationDto> MapToDto(Guid kycId)
    {
        return await _db.KycVerifications
            .Where(k => k.Id == kycId)
            .Select(k => new KycVerificationDto
            {
                Id = k.Id,
                UserId = k.UserId,
                UserName = k.User.FirstName + " " + k.User.LastName,
                UserEmail = k.User.Email!,
                Status = k.Status,
                DocumentType = k.DocumentType,
                DocumentFrontUrl = k.DocumentFrontUrl,
                DocumentBackUrl = k.DocumentBackUrl,
                SelfieUrl = k.SelfieUrl,
                DocumentNumber = k.DocumentNumber,
                DocumentExpiry = k.DocumentExpiry,
                RejectionReason = k.RejectionReason,
                ReviewedAt = k.ReviewedAt,
                Notes = k.Notes,
                CreatedAt = k.CreatedAt,
            })
            .FirstAsync();
    }
}
