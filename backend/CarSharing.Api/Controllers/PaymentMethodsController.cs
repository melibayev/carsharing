using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/payment-methods")]
[Authorize]
public class PaymentMethodsController : ControllerBase
{
    private readonly IPaymentMethodService _paymentMethods;

    public PaymentMethodsController(IPaymentMethodService paymentMethods)
    {
        _paymentMethods = paymentMethods;
    }

    [HttpGet]
    public async Task<ActionResult<List<UserPaymentMethodDto>>> GetAll(CancellationToken ct)
    {
        var result = await _paymentMethods.GetMethodsAsync(GetUserId(), ct);
        return Ok(result);
    }

    [HttpPost("intent")]
    public async Task<ActionResult<AddCardIntentResponse>> CreateIntent(
        [FromBody] AddCardIntentRequest request, CancellationToken ct)
    {
        var phone = User.FindFirstValue(ClaimTypes.MobilePhone);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        var result = await _paymentMethods.CreateAddCardIntentAsync(GetUserId(), request, phone, ip, ua, ct);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<ActionResult<UserPaymentMethodDto>> Confirm(
        [FromBody] ConfirmCardRequest request, CancellationToken ct)
    {
        var result = await _paymentMethods.ConfirmAddCardAsync(GetUserId(), request, ct);
        return Ok(result);
    }

    [HttpPost("resend-sms")]
    public async Task<IActionResult> ResendSms(
        [FromBody] ResendCardSmsRequest request, CancellationToken ct)
    {
        var phone = User.FindFirstValue(ClaimTypes.MobilePhone);
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        await _paymentMethods.ResendSmsAsync(GetUserId(), request, phone, ip, ua, ct);
        return Ok(new { message = "SMS sent." });
    }

    [HttpPost("{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id, CancellationToken ct)
    {
        await _paymentMethods.SetDefaultAsync(GetUserId(), id, ct);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _paymentMethods.DeleteAsync(GetUserId(), id, ct);
        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
