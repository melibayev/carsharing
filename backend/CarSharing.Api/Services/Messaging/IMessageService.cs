using CarSharing.Api.Models.Dtos;
using Microsoft.AspNetCore.Http;

namespace CarSharing.Api.Services.Messaging;

public interface IMessageService
{
    Task<List<ConversationDto>> GetConversationsAsync(Guid userId, bool includeArchived = false);
    Task<List<MessageDto>> GetMessagesAsync(Guid id, Guid userId, DateTimeOffset? before = null);
    Task<MessageDto> SendMessageAsync(Guid id, Guid senderId, string body, Guid? replyToMessageId = null);
    Task MarkAsReadAsync(Guid conversationId, Guid userId);
    Task MarkConversationReadByBookingAsync(Guid id, Guid userId);
    Task<int> GetTotalUnreadCountAsync(Guid userId);
    Task<ConversationDto> GetOrCreateSupportConversationAsync(Guid userId);
    Task ArchiveConversationAsync(Guid userId, Guid conversationId, bool archive);
    Task DeleteConversationAsync(Guid userId, Guid conversationId);
    Task<MessageDto> EditMessageAsync(Guid messageId, Guid userId, string newBody);
    Task DeleteMessageAsync(Guid messageId, Guid userId);
    Task<MessageDto> SendImageMessageAsync(Guid conversationId, Guid senderId, IFormFile file);
}
