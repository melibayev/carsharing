namespace CarSharing.Api.Services.Payments;

// Replace with StripePaymentService when going live.
public class FakePaymentService : IPaymentService
{
    private readonly ILogger<FakePaymentService> _logger;

    public FakePaymentService(ILogger<FakePaymentService> logger)
    {
        _logger = logger;
    }

    public Task<string> CreateSetupIntentAsync(Guid userId)
    {
        var id = $"seti_fake_{Guid.NewGuid():N}";
        _logger.LogInformation("[FakePayment] SetupIntent created: {Id} for user {UserId}", id, userId);
        return Task.FromResult(id);
    }

    public Task<string> AuthorizeAsync(Guid userId, decimal amount)
    {
        var id = $"pi_fake_{Guid.NewGuid():N}";
        _logger.LogInformation("[FakePayment] Authorized {Amount:C} for user {UserId}: {Id}", amount, userId, id);
        return Task.FromResult(id);
    }

    public Task CaptureAsync(string paymentIntentId, decimal amount)
    {
        _logger.LogInformation("[FakePayment] Captured {Amount:C} on {PaymentIntentId}", amount, paymentIntentId);
        return Task.CompletedTask;
    }

    public Task RefundAsync(string paymentIntentId, decimal amount)
    {
        _logger.LogInformation("[FakePayment] Refunded {Amount:C} on {PaymentIntentId}", amount, paymentIntentId);
        return Task.CompletedTask;
    }

    public Task<string> CreatePayoutAsync(Guid hostId, decimal amount)
    {
        var id = $"po_fake_{Guid.NewGuid():N}";
        _logger.LogInformation("[FakePayment] Payout {Amount:C} to host {HostId}: {Id}", amount, hostId, id);
        return Task.FromResult(id);
    }
}
