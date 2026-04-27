namespace CarSharing.Api.Models.Entities;

public class Receipt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;

    /// <summary>e.g. "CS-2026-000142"</summary>
    public string ReceiptNumber { get; set; } = string.Empty;

    /// <summary>Cloudinary URL for the PDF (signed 1h expiry on retrieval).</summary>
    public string? PdfUrl { get; set; }

    public DateTimeOffset? EmailedAt { get; set; }
    public decimal TotalUzs { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
}
