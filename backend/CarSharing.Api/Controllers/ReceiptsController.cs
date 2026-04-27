using System.Security.Claims;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CarSharing.Api.Controllers;

[ApiController]
[Route("api/v1/receipts")]
[Authorize]
public class ReceiptsController : ControllerBase
{
    private readonly IReceiptService _receipts;

    public ReceiptsController(IReceiptService receipts)
    {
        _receipts = receipts;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReceiptDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _receipts.GetReceiptAsync(id, GetUserId(), ct: ct);
        return Ok(dto);
    }

    [HttpPost("{id:guid}/email")]
    public async Task<IActionResult> Email(Guid id, CancellationToken ct)
    {
        await _receipts.EmailReceiptAsync(id, GetUserId(), ct);
        return Ok(new { message = "Receipt emailed." });
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
