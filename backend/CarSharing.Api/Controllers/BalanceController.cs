using System.Security.Claims;
using CarSharing.Api.Models.Dtos;using CarSharing.Api.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/balance")]
[Authorize]
public class BalanceController : ControllerBase
{
    private readonly IBalanceService _balance;

    public BalanceController(IBalanceService balance)
    {
        _balance = balance;
    }

    [HttpGet]
    public async Task<ActionResult<AccountBalanceDto>> GetBalance(CancellationToken ct)
    {
        var dto = await _balance.GetBalanceAsync(GetUserId(), ct);
        return Ok(dto);
    }

    [HttpGet("ledger")]
    public async Task<ActionResult<PagedResult<LedgerEntryDto>>> GetLedger(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _balance.GetLedgerAsync(GetUserId(), page, pageSize, ct);
        return Ok(result);
    }

    [HttpPost("topup/intent")]
    public async Task<ActionResult<TopUpIntentResponse>> CreateTopUpIntent(
        [FromBody] TopUpIntentRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();
        var result = await _balance.CreateTopUpIntentAsync(GetUserId(), request, ip, ua, ct);
        return Ok(result);
    }

    [HttpPost("topup/confirm")]
    public async Task<ActionResult<AccountBalanceDto>> ConfirmTopUp(
        [FromBody] ConfirmTopUpRequest request, CancellationToken ct)
    {
        await _balance.ConfirmTopUpAsync(GetUserId(), request, ct);
        var dto = await _balance.GetBalanceAsync(GetUserId(), ct);
        return Ok(dto);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
