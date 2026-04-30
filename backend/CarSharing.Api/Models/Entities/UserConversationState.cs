namespace CarSharing.Api.Models.Entities;

/// <summary>
/// Per-user state for a conversation (archived / soft-deleted).
/// Composite PK: (UserId, ConversationId) — each participant has their own independent state.
/// </summary>
public class UserConversationState
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public bool IsArchived { get; set; }

    /// <summary>Non-null means this user has "deleted" the conversation (hidden from their list).</summary>
    public DateTimeOffset? DeletedAt { get; set; }
}
