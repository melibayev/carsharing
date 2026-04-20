using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Models.Entities;

public class AuditLog : AuditableEntity
{
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }

    public Guid? ActorId { get; set; }
    public ApplicationUser? Actor { get; set; }
    public string? ActorEmail { get; set; }

    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
