namespace CarSharing.Api.Services.Payments;

public interface IPaymentService
{
    Task<string> CreateSetupIntentAsync(Guid userId);
    Task<string> AuthorizeAsync(Guid userId, decimal amount);
    Task CaptureAsync(string paymentIntentId, decimal amount);
    Task RefundAsync(string paymentIntentId, decimal amount);
    Task<string> CreatePayoutAsync(Guid hostId, decimal amount);
    Task<string> AttachPayoutMethodAsync(Guid userId, string type, string tokenizedDetails);
}
