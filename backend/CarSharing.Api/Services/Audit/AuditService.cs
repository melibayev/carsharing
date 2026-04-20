using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Audit;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(string action, string entityType, Guid? entityId, Guid? actorId,
        string? actorEmail = null, string? oldValues = null, string? newValues = null,
        string? ipAddress = null, string? userAgent = null)
    {
        var log = new AuditLog
        {
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            ActorId = actorId,
            ActorEmail = actorEmail,
            OldValues = oldValues,
            NewValues = newValues,
            IpAddress = ipAddress,
            UserAgent = userAgent,
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();
    }

    public async Task<PagedResult<AuditLogDto>> GetLogsAsync(string? entityType, Guid? entityId, int page, int pageSize)
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(a => a.EntityType == entityType);

        if (entityId.HasValue)
            query = query.Where(a => a.EntityId == entityId.Value);

        query = query.OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                Action = a.Action,
                EntityType = a.EntityType,
                EntityId = a.EntityId,
                ActorEmail = a.ActorEmail ?? (a.Actor != null ? a.Actor.Email : null),
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                CreatedAt = a.CreatedAt,
            })
            .ToListAsync();

        return new PagedResult<AuditLogDto>(items, total, page, pageSize);
    }
}
