using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Messaging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class MessagesController : ControllerBase
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    [HttpGet("conversations")]
    public async Task<ActionResult<List<ConversationDto>>> GetConversations([FromQuery] bool archived = false)
    {
        var userId = GetUserId();
        var conversations = await _messageService.GetConversationsAsync(userId, archived);
        return Ok(conversations);
    }

    [HttpPost("conversations/{id:guid}/archive")]
    public async Task<IActionResult> ArchiveConversation(Guid id, [FromQuery] bool archive = true)
    {
        await _messageService.ArchiveConversationAsync(GetUserId(), id, archive);
        return NoContent();
    }

    [HttpDelete("conversations/{id:guid}")]
    public async Task<IActionResult> DeleteConversation(Guid id)
    {
        await _messageService.DeleteConversationAsync(GetUserId(), id);
        return NoContent();
    }

    [HttpGet("conversations/{bookingId:guid}/messages")]
    public async Task<ActionResult<List<MessageDto>>> GetMessages(
        Guid bookingId, [FromQuery] DateTimeOffset? before)
    {
        var userId = GetUserId();
        var messages = await _messageService.GetMessagesAsync(bookingId, userId, before);
        return Ok(messages);
    }

    [HttpPost("conversations/{bookingId:guid}/messages")]
    public async Task<ActionResult<MessageDto>> SendMessage(
        Guid bookingId, [FromBody] SendMessageRequest request)
    {
        var userId = GetUserId();
        var message = await _messageService.SendMessageAsync(bookingId, userId, request.Body, request.ReplyToMessageId);
        return Ok(message);
    }

    [HttpPost("conversations/{bookingId:guid}/messages/image")]
    public async Task<ActionResult<MessageDto>> SendImageMessage(Guid bookingId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file provided.");
        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return BadRequest("File must be an image.");
        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("Image must be under 10 MB.");

        var userId = GetUserId();
        var message = await _messageService.SendImageMessageAsync(bookingId, userId, file);
        return Ok(message);
    }

    [HttpPost("conversations/{bookingId:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid bookingId)
    {
        var userId = GetUserId();
        await _messageService.MarkConversationReadByBookingAsync(bookingId, userId);
        return NoContent();
    }

    [HttpGet("conversations/unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _messageService.GetTotalUnreadCountAsync(userId);
        return Ok(count);
    }

    [HttpPatch("messages/{messageId:guid}")]
    public async Task<ActionResult<MessageDto>> EditMessage(
        Guid messageId, [FromBody] EditMessageRequest request)
    {
        var msg = await _messageService.EditMessageAsync(messageId, GetUserId(), request.Body);
        return Ok(msg);
    }

    [HttpDelete("messages/{messageId:guid}")]
    public async Task<IActionResult> DeleteMessage(Guid messageId)
    {
        await _messageService.DeleteMessageAsync(messageId, GetUserId());
        return NoContent();
    }

    /// <summary>Gets or creates a direct support conversation with the admin.</summary>
    [HttpGet("support/conversation")]
    public async Task<ActionResult<ConversationDto>> GetSupportConversation()
    {
        var userId = GetUserId();
        var conv = await _messageService.GetOrCreateSupportConversationAsync(userId);
        return Ok(conv);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
