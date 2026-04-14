using CarSharing.Api.Models.Dtos;
using CarSharing.Api.Models.Entities;

namespace CarSharing.Api.Services.Bookings;

public class PricingService : IPricingService
{
    private const decimal ServiceFeeRate = 0.15m;
    private const decimal TaxRate = 0.08m;

    public QuoteResponse CalculateQuote(Car car, DateTimeOffset startUtc, DateTimeOffset endUtc)
    {
        var totalHours = (endUtc - startUtc).TotalDays;
        var days = (int)Math.Ceiling(totalHours);
        if (days < 1) days = 1;

        var baseSubtotal = car.DailyPriceUsd * days;
        decimal subtotal;
        decimal? discountAmount = null;
        string? discountType = null;

        if (days >= 30 && car.MonthlyDiscountPercent > 0)
        {
            subtotal = Math.Round(baseSubtotal * (1m - car.MonthlyDiscountPercent / 100m), 2);
            discountAmount = baseSubtotal - subtotal;
            discountType = "monthly";
        }
        else if (days >= 7 && car.WeeklyDiscountPercent > 0)
        {
            subtotal = Math.Round(baseSubtotal * (1m - car.WeeklyDiscountPercent / 100m), 2);
            discountAmount = baseSubtotal - subtotal;
            discountType = "weekly";
        }
        else
        {
            subtotal = baseSubtotal;
        }

        var serviceFee = Math.Round(subtotal * ServiceFeeRate, 2);
        var taxableBase = subtotal + car.CleaningFeeUsd;
        var taxes = Math.Round(taxableBase * TaxRate, 2);
        var totalCharged = subtotal + car.CleaningFeeUsd + serviceFee + taxes;
        var hostPayout = subtotal + car.CleaningFeeUsd - Math.Round(subtotal * ServiceFeeRate, 2);

        return new QuoteResponse(
            Days: days,
            DailyRateUsd: car.DailyPriceUsd,
            SubtotalUsd: subtotal,
            DiscountAmount: discountAmount,
            DiscountType: discountType,
            CleaningFeeUsd: car.CleaningFeeUsd,
            ServiceFeeUsd: serviceFee,
            TaxesUsd: taxes,
            SecurityDepositHoldUsd: car.SecurityDepositUsd,
            TotalChargedUsd: totalCharged,
            HostPayoutUsd: hostPayout
        );
    }
}
