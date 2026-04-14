using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Services.Notifications;

public interface INotificationService
{
    Task<NotificationDto> CreateAsync(Guid userId, NotificationType type, string title, string body, string? linkUrl = null);
    Task<PagedResult<NotificationDto>> GetByUserAsync(Guid userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
}
