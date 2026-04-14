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
    public async Task<ActionResult<List<ConversationDto>>> GetConversations()
    {
        var userId = GetUserId();
        var conversations = await _messageService.GetConversationsAsync(userId);
        return Ok(conversations);
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
        var message = await _messageService.SendMessageAsync(bookingId, userId, request.Body);
        return Ok(message);
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new UnauthorizedAccessException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
