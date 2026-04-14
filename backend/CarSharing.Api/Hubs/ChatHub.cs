using System.Security.Claims;
using CarSharing.Api.Services.Messaging;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace CarSharing.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IMessageService _messageService;

    public ChatHub(IMessageService messageService)
    {
        _messageService = messageService;
    }

    public async Task JoinConversation(Guid bookingId)
    {
        var groupName = $"booking_{bookingId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveConversation(Guid bookingId)
    {
        var groupName = $"booking_{bookingId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task SendMessage(Guid bookingId, string body)
    {
        var userId = GetUserId();
        var message = await _messageService.SendMessageAsync(bookingId, userId, body);

        var groupName = $"booking_{bookingId}";
        await Clients.Group(groupName).SendAsync("MessageReceived", message);
    }

    public async Task MarkAsRead(Guid conversationId)
    {
        var userId = GetUserId();
        await _messageService.MarkAsReadAsync(conversationId, userId);
    }

    private Guid GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new HubException("User not authenticated.");
        return Guid.Parse(claim);
    }
}
