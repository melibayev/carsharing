using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Models.Enums;

namespace CarSharing.Api.Services.Payments;

public interface IBalanceService
{
    Task<AccountBalanceDto> GetBalanceAsync(Guid userId, CancellationToken ct = default);
    Task<PagedResult<LedgerEntryDto>> GetLedgerAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);

    Task<TopUpIntentResponse> CreateTopUpIntentAsync(Guid userId, TopUpIntentRequest request, string? phoneE164, string? ipAddress, string? userAgent, CancellationToken ct = default);
    Task ConfirmTopUpAsync(Guid userId, ConfirmTopUpRequest request, CancellationToken ct = default);

    /// <summary>Lock funds for a booking. Throws if insufficient.</summary>
    Task LockFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, CancellationToken ct = default);

    /// <summary>Release previously locked funds (on cancellation/rejection).</summary>
    Task ReleaseFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, CancellationToken ct = default);

    /// <summary>Capture locked funds into platform escrow.</summary>
    Task CaptureFundsAsync(Guid userId, decimal amountUzs, Guid bookingId, Guid paymentId, CancellationToken ct = default);

    /// <summary>Credit a refund back to the user's balance.</summary>
    Task CreditRefundAsync(Guid userId, decimal amountUzs, Guid bookingId, Guid paymentId, CancellationToken ct = default);

    /// <summary>Admin: adjust balance with audit trail.</summary>
    Task AdminAdjustAsync(Guid userId, decimal amountUzs, string direction, string reason, Guid adminId, CancellationToken ct = default);

    /// <summary>Ensure balance row exists for user. Returns the balance.</summary>
    Task<AccountBalance> GetOrCreateAsync(Guid userId, CancellationToken ct = default);
}
