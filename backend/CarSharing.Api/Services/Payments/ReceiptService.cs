using CarSharing.Api.Data;
using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;
using CarSharing.Api.Services.Email;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Services.Payments;

public interface IReceiptService
{
    Task<ReceiptDto> GenerateReceiptAsync(Guid paymentId, CancellationToken ct = default);
    Task<ReceiptDto> GetReceiptAsync(Guid receiptId, Guid userId, bool isAdmin = false, CancellationToken ct = default);
    Task EmailReceiptAsync(Guid receiptId, Guid userId, CancellationToken ct = default);
}

public class ReceiptService : IReceiptService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly ILogger<ReceiptService> _logger;

    public ReceiptService(AppDbContext db, IEmailService email, ILogger<ReceiptService> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public async Task<ReceiptDto> GenerateReceiptAsync(Guid paymentId, CancellationToken ct = default)
    {
        var existing = await _db.Receipts
            .FirstOrDefaultAsync(r => r.PaymentId == paymentId, ct);

        if (existing is not null)
            return await GetReceiptAsync(existing.Id, Guid.Empty, isAdmin: true, ct);

        var payment = await _db.Payments
            .Include(p => p.Booking).ThenInclude(b => b.Car)
            .Include(p => p.Booking).ThenInclude(b => b.Guest)
            .Include(p => p.PaymentMethodRef)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        if (payment is null)
            throw new InvalidOperationException($"Payment {paymentId} not found.");

        var receiptNumber = await GenerateReceiptNumberAsync(ct);

        var receipt = new Receipt
        {
            BookingId = payment.BookingId,
            PaymentId = paymentId,
            ReceiptNumber = receiptNumber,
            TotalUzs = payment.AmountUzs,
            GeneratedAt = DateTimeOffset.UtcNow
        };

        _db.Receipts.Add(receipt);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[Receipt] Generated {ReceiptNumber} for payment {PaymentId}", receiptNumber, paymentId);

        // Email the receipt
        try
        {
            await SendReceiptEmailAsync(receipt, payment, ct);
            receipt.EmailedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[Receipt] Failed to email receipt {ReceiptNumber}", receiptNumber);
        }

        return MapDto(receipt, payment);
    }

    public async Task<ReceiptDto> GetReceiptAsync(Guid receiptId, Guid userId, bool isAdmin = false, CancellationToken ct = default)
    {
        var receipt = await _db.Receipts
            .Include(r => r.Payment).ThenInclude(p => p.Booking).ThenInclude(b => b.Car)
            .Include(r => r.Payment).ThenInclude(p => p.Booking).ThenInclude(b => b.Guest)
            .Include(r => r.Payment).ThenInclude(p => p.PaymentMethodRef)
            .FirstOrDefaultAsync(r => r.Id == receiptId, ct);

        if (receipt is null)
            throw new InvalidOperationException("Receipt not found.");

        if (!isAdmin && receipt.Payment.UserId != userId)
            throw new UnauthorizedAccessException("Access denied.");

        return MapDto(receipt, receipt.Payment);
    }

    public async Task EmailReceiptAsync(Guid receiptId, Guid userId, CancellationToken ct = default)
    {
        var receipt = await _db.Receipts
            .Include(r => r.Payment).ThenInclude(p => p.Booking).ThenInclude(b => b.Car)
            .Include(r => r.Payment).ThenInclude(p => p.Booking).ThenInclude(b => b.Guest)
            .Include(r => r.Payment).ThenInclude(p => p.PaymentMethodRef)
            .FirstOrDefaultAsync(r => r.Id == receiptId, ct);

        if (receipt is null) throw new InvalidOperationException("Receipt not found.");
        if (receipt.Payment.UserId != userId) throw new UnauthorizedAccessException("Access denied.");

        await SendReceiptEmailAsync(receipt, receipt.Payment, ct);
        receipt.EmailedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task SendReceiptEmailAsync(Receipt receipt, Payment payment, CancellationToken ct)
    {
        var guest = payment.Booking.Guest;
        var car = payment.Booking.Car;
        var to = guest.Email ?? string.Empty;
        if (string.IsNullOrEmpty(to)) return;

        var subject = $"Your CarSharing receipt {receipt.ReceiptNumber}";
        var html = BuildReceiptHtml(receipt, payment);
        await _email.SendGenericEmailAsync(to, subject, html);
    }

    private static string BuildReceiptHtml(Receipt receipt, Payment payment)
    {
        var booking = payment.Booking;
        var car = booking.Car;
        var nights = booking.Days;
        var method = payment.Method.ToString();

        return $"""
            <h2>Receipt {receipt.ReceiptNumber}</h2>
            <p><strong>Date:</strong> {receipt.GeneratedAt:dd MMM yyyy}</p>
            <hr/>
            <p><strong>Car:</strong> {car.Year} {car.Make} {car.Model}</p>
            <p><strong>Trip:</strong> {booking.StartUtc:dd MMM yyyy} – {booking.EndUtc:dd MMM yyyy} ({nights} day{(nights == 1 ? "" : "s")})</p>
            <hr/>
            <table>
              <tr><td>Daily rate</td><td>{booking.DailyRateUsd:N0} UZS × {nights}</td><td>{booking.SubtotalUsd:N0} UZS</td></tr>
              <tr><td>Cleaning fee</td><td></td><td>{booking.CleaningFeeUsd:N0} UZS</td></tr>
              <tr><td>Service fee</td><td></td><td>{booking.ServiceFeeUsd:N0} UZS</td></tr>
              <tr><td>Taxes</td><td></td><td>{booking.TaxesUsd:N0} UZS</td></tr>
              <tr><td><strong>Total</strong></td><td></td><td><strong>{payment.AmountUzs:N0} UZS</strong></td></tr>
            </table>
            <hr/>
            <p><strong>Payment method:</strong> {method}</p>
            """;
    }

    private async Task<string> GenerateReceiptNumberAsync(CancellationToken ct)
    {
        var year = DateTimeOffset.UtcNow.Year;
        var count = await _db.Receipts.CountAsync(r => r.GeneratedAt.Year == year, ct);
        return $"CS-{year}-{count + 1:D6}";
    }

    private static ReceiptDto MapDto(Receipt r, Payment p) => new()
    {
        Id = r.Id,
        ReceiptNumber = r.ReceiptNumber,
        BookingId = r.BookingId,
        PaymentId = r.PaymentId,
        TotalUzs = r.TotalUzs,
        GeneratedAt = r.GeneratedAt,
        EmailedAt = r.EmailedAt,
        PdfUrl = r.PdfUrl,
        PaymentMethod = p.Method.ToString(),
        CardLast4 = p.PaymentMethodRef?.Last4,
        CardBrand = p.PaymentMethodRef?.Brand
    };
}
