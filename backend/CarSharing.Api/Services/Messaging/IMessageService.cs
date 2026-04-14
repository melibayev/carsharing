using CarSharing.Api.Models.Dtos;

namespace CarSharing.Api.Services.Messaging;

public interface IMessageService
{
    Task<List<ConversationDto>> GetConversationsAsync(Guid userId);
    Task<List<MessageDto>> GetMessagesAsync(Guid bookingId, Guid userId, DateTimeOffset? before = null);
    Task<MessageDto> SendMessageAsync(Guid bookingId, Guid senderId, string body);
    Task MarkAsReadAsync(Guid conversationId, Guid userId);
}
