using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Messaging;

public interface IMessageService
{
    Task<List<ConversationDto>> GetConversationsAsync(Guid userId);
    Task<List<MessageDto>> GetMessagesAsync(Guid id, Guid userId, DateTimeOffset? before = null);
    Task<MessageDto> SendMessageAsync(Guid id, Guid senderId, string body);
    Task MarkAsReadAsync(Guid conversationId, Guid userId);
    Task MarkConversationReadByBookingAsync(Guid id, Guid userId);
    Task<int> GetTotalUnreadCountAsync(Guid userId);
    Task<ConversationDto> GetOrCreateSupportConversationAsync(Guid userId);
}
