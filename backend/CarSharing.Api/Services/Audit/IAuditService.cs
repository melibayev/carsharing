using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Audit;

public interface IAuditService
{
    Task LogAsync(string action, string entityType, Guid? entityId, Guid? actorId,
        string? actorEmail = null, string? oldValues = null, string? newValues = null,
        string? ipAddress = null, string? userAgent = null);
    Task<PagedResult<AuditLogDto>> GetLogsAsync(string? entityType, Guid? entityId, int page, int pageSize);
}
