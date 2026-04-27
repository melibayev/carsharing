using CarSharing.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarSharing.Api.Data.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.Bio).HasMaxLength(500);
        builder.Property(u => u.ProfilePhotoUrl).HasMaxLength(500);
        builder.Property(u => u.DriverLicenseNumber).HasMaxLength(500);
        builder.Property(u => u.DriverLicensePhotoUrl).HasMaxLength(500);
        builder.Property(u => u.StripeCustomerId).HasMaxLength(200);
        builder.Property(u => u.StripeConnectAccountId).HasMaxLength(200);
        builder.Property(u => u.AverageRatingAsHost).HasColumnType("decimal(3,2)");
        builder.Property(u => u.AverageRatingAsGuest).HasColumnType("decimal(3,2)");
        builder.Property(u => u.HostAgreementVersion).HasMaxLength(50);

        builder.HasOne(u => u.HostPayoutMethod)
            .WithMany()
            .HasForeignKey(u => u.HostPayoutMethodId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class CarConfiguration : IEntityTypeConfiguration<Car>
{
    public void Configure(EntityTypeBuilder<Car> builder)
    {
        builder.Property(c => c.Make).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Model).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Trim).HasMaxLength(100);
        builder.Property(c => c.Vin).HasMaxLength(17);
        builder.HasIndex(c => c.Vin).IsUnique().HasFilter("\"Vin\" IS NOT NULL");
        builder.Property(c => c.LicensePlate).HasMaxLength(20);
        builder.Property(c => c.LicensePlateRegion).HasMaxLength(50);
        builder.Property(c => c.Color).HasMaxLength(50);
        builder.Property(c => c.DailyPriceUsd).HasColumnType("decimal(18,2)");
        builder.Property(c => c.CleaningFeeUsd).HasColumnType("decimal(18,2)");
        builder.Property(c => c.SecurityDepositUsd).HasColumnType("decimal(18,2)");
        builder.Property(c => c.ExtraKmFeeUsd).HasColumnType("decimal(18,2)");
        builder.Property(c => c.AddressLine).HasMaxLength(300);
        builder.Property(c => c.City).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Region).HasMaxLength(100);
        builder.Property(c => c.Country).HasMaxLength(100).IsRequired();
        builder.Property(c => c.PostalCode).HasMaxLength(20);
        // Let NTS plugin handle the column type automatically
        builder.Property(c => c.Location);
        builder.Property(c => c.Description).HasMaxLength(2000);
        builder.Property(c => c.Rules).HasMaxLength(1000);
        builder.Property(c => c.AverageRating).HasColumnType("decimal(3,2)");

        builder.HasIndex(c => c.Location).HasMethod("GIST");
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.City);

        builder.HasOne(c => c.Owner).WithMany(u => u.Cars).HasForeignKey(c => c.OwnerId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CarPhotoConfiguration : IEntityTypeConfiguration<CarPhoto>
{
    public void Configure(EntityTypeBuilder<CarPhoto> builder)
    {
        builder.Property(p => p.Url).HasMaxLength(500).IsRequired();
        builder.Property(p => p.PublicId).HasMaxLength(200);
        builder.HasOne(p => p.Car).WithMany(c => c.Photos).HasForeignKey(p => p.CarId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class FeatureConfiguration : IEntityTypeConfiguration<Feature>
{
    public void Configure(EntityTypeBuilder<Feature> builder)
    {
        builder.Property(f => f.Name).HasMaxLength(100).IsRequired();
        builder.Property(f => f.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(f => f.Slug).IsUnique();
    }
}

public class CarFeatureConfiguration : IEntityTypeConfiguration<CarFeature>
{
    public void Configure(EntityTypeBuilder<CarFeature> builder)
    {
        builder.HasKey(cf => new { cf.CarId, cf.FeatureId });
        builder.HasOne(cf => cf.Car).WithMany(c => c.CarFeatures).HasForeignKey(cf => cf.CarId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(cf => cf.Feature).WithMany(f => f.CarFeatures).HasForeignKey(cf => cf.FeatureId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class AvailabilityConfiguration : IEntityTypeConfiguration<Availability>
{
    public void Configure(EntityTypeBuilder<Availability> builder)
    {
        builder.HasOne(a => a.Car).WithMany(c => c.BlockedDates).HasForeignKey(a => a.CarId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.Booking).WithOne(b => b.AvailabilityBlock).HasForeignKey<Availability>(a => a.BookingId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(a => new { a.CarId, a.StartUtc, a.EndUtc });
    }
}

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.Property(b => b.DailyRateUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.SubtotalUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.CleaningFeeUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.ServiceFeeUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.TaxesUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.SecurityDepositHoldUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.TotalChargedUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.HostPayoutUsd).HasColumnType("decimal(18,2)");
        builder.Property(b => b.PickupLocation).HasMaxLength(500);
        builder.Property(b => b.ReturnLocation).HasMaxLength(500);
        builder.Property(b => b.GuestMessage).HasMaxLength(1000);
        builder.Property(b => b.HostResponseMessage).HasMaxLength(1000);
        builder.Property(b => b.CancellationReason).HasMaxLength(1000);
        builder.Property(b => b.PaymentIntentId).HasMaxLength(200);

        builder.HasOne(b => b.Car).WithMany(c => c.Bookings).HasForeignKey(b => b.CarId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(b => b.Guest).WithMany(u => u.GuestBookings).HasForeignKey(b => b.GuestId).OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.Status);
        builder.HasIndex(b => new { b.CarId, b.StartUtc, b.EndUtc });
    }
}

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.Property(r => r.Comment).HasMaxLength(1000).IsRequired();
        builder.HasOne(r => r.Booking).WithMany(b => b.Reviews).HasForeignKey(r => r.BookingId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(r => r.Author).WithMany(u => u.AuthoredReviews).HasForeignKey(r => r.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.Subject).WithMany(u => u.ReceivedReviews).HasForeignKey(r => r.SubjectId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.Car).WithMany(c => c.Reviews).HasForeignKey(r => r.CarId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(r => new { r.BookingId, r.AuthorRole }).IsUnique();
    }
}

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.HasOne(c => c.Booking).WithOne(b => b.Conversation)
            .HasForeignKey<Conversation>(c => c.BookingId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(c => c.BookingId).IsUnique(false);
        builder.HasOne(c => c.Participant1).WithMany()
            .HasForeignKey(c => c.Participant1Id).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(c => c.Participant2).WithMany()
            .HasForeignKey(c => c.Participant2Id).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(c => new { c.Participant1Id, c.Participant2Id });
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.Property(m => m.Body).HasMaxLength(2000);
        builder.Property(m => m.AttachmentUrl).HasMaxLength(500);
        builder.HasOne(m => m.Conversation).WithMany(c => c.Messages).HasForeignKey(m => m.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(m => m.Sender).WithMany(u => u.SentMessages).HasForeignKey(m => m.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Booking).WithMany().HasForeignKey(m => m.BookingId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(m => new { m.ConversationId, m.SentAt });
        builder.HasIndex(m => m.BookingId);
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
        builder.Property(n => n.Body).HasMaxLength(1000).IsRequired();
        builder.Property(n => n.LinkUrl).HasMaxLength(500);
        builder.HasOne(n => n.User).WithMany(u => u.Notifications).HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(n => new { n.UserId, n.IsRead });
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(t => t.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(t => t.ReplacedByTokenHash).HasMaxLength(128);
        builder.HasOne(t => t.User).WithMany(u => u.RefreshTokens).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(t => t.TokenHash);
    }
}

public class PayoutRecordConfiguration : IEntityTypeConfiguration<PayoutRecord>
{
    public void Configure(EntityTypeBuilder<PayoutRecord> builder)
    {
        builder.Property(p => p.AmountUsd).HasColumnType("decimal(18,2)");
        builder.HasOne(p => p.Host).WithMany(u => u.Payouts).HasForeignKey(p => p.HostId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(p => p.Booking).WithMany().HasForeignKey(p => p.BookingId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class FavoriteCarConfiguration : IEntityTypeConfiguration<FavoriteCar>
{
    public void Configure(EntityTypeBuilder<FavoriteCar> builder)
    {
        builder.HasIndex(f => new { f.UserId, f.CarId }).IsUnique();
        builder.HasOne(f => f.User).WithMany(u => u.FavoriteCars).HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(f => f.Car).WithMany(c => c.FavoritedBy).HasForeignKey(f => f.CarId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class KycVerificationConfiguration : IEntityTypeConfiguration<KycVerification>
{
    public void Configure(EntityTypeBuilder<KycVerification> builder)
    {
        builder.Property(k => k.DocumentFrontUrl).HasMaxLength(500).IsRequired();
        builder.Property(k => k.DocumentBackUrl).HasMaxLength(500);
        builder.Property(k => k.SelfieUrl).HasMaxLength(500);
        builder.Property(k => k.DocumentNumber).HasMaxLength(100);
        builder.Property(k => k.RejectionReason).HasMaxLength(1000);
        builder.Property(k => k.Notes).HasMaxLength(2000);

        builder.HasOne(k => k.User).WithMany(u => u.KycVerifications).HasForeignKey(k => k.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(k => k.ReviewedBy).WithMany().HasForeignKey(k => k.ReviewedById).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(k => new { k.UserId, k.Status });
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(a => a.Action).HasMaxLength(100).IsRequired();
        builder.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(a => a.ActorEmail).HasMaxLength(256);
        builder.Property(a => a.IpAddress).HasMaxLength(50);
        builder.Property(a => a.UserAgent).HasMaxLength(500);

        builder.HasOne(a => a.Actor).WithMany().HasForeignKey(a => a.ActorId).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.CreatedAt);
        builder.HasIndex(a => new { a.EntityType, a.EntityId });
    }
}

public class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> builder)
    {
        builder.Property(d => d.Description).HasMaxLength(2000).IsRequired();
        builder.Property(d => d.Resolution).HasMaxLength(2000);
        builder.Property(d => d.RefundAmount).HasColumnType("decimal(18,2)");

        builder.HasOne(d => d.Booking).WithMany(b => b.Disputes).HasForeignKey(d => d.BookingId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(d => d.FiledBy).WithMany(u => u.FiledDisputes).HasForeignKey(d => d.FiledById).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(d => d.ResolvedBy).WithMany().HasForeignKey(d => d.ResolvedById).OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(d => d.Status);
        builder.HasIndex(d => d.BookingId);
    }
}

public class PayoutMethodConfiguration : IEntityTypeConfiguration<PayoutMethod>
{
    public void Configure(EntityTypeBuilder<PayoutMethod> builder)
    {
        builder.Property(p => p.Brand).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Last4).HasMaxLength(4).IsRequired();
        builder.Property(p => p.HolderName).HasMaxLength(200).IsRequired();
        builder.Property(p => p.BankName).HasMaxLength(200);
        builder.Property(p => p.ProviderReference).HasMaxLength(500);

        builder.HasOne(p => p.User).WithMany(u => u.PayoutMethods).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(p => p.UserId);
    }
}

public class CarDraftConfiguration : IEntityTypeConfiguration<CarDraft>
{
    public void Configure(EntityTypeBuilder<CarDraft> builder)
    {
        builder.Property(d => d.PlateNumber).HasMaxLength(20);
        builder.Property(d => d.Vin).HasMaxLength(17);
        builder.Property(d => d.Make).HasMaxLength(100);
        builder.Property(d => d.Model).HasMaxLength(100);
        builder.Property(d => d.Trim).HasMaxLength(100);
        builder.Property(d => d.Color).HasMaxLength(50);
        builder.Property(d => d.AddressLine).HasMaxLength(300);
        builder.Property(d => d.City).HasMaxLength(200);
        builder.Property(d => d.Region).HasMaxLength(100);
        builder.Property(d => d.PostalCode).HasMaxLength(20);
        builder.Property(d => d.SelfCheckInMethod).HasMaxLength(200);
        builder.Property(d => d.DailyPriceUzs).HasColumnType("decimal(18,2)");
        builder.Property(d => d.CleaningFeeUzs).HasColumnType("decimal(18,2)");
        builder.Property(d => d.SecurityDepositUzs).HasColumnType("decimal(18,2)");
        builder.Property(d => d.ExtraKmFeeUzs).HasColumnType("decimal(18,2)");
        builder.Property(d => d.Description).HasMaxLength(2000);
        builder.Property(d => d.Rules).HasMaxLength(1000);
        builder.Property(d => d.CustomRules).HasMaxLength(500);

        builder.HasOne(d => d.User).WithMany(u => u.CarDrafts).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(d => d.UserId);
    }
}

public class CarDraftDocumentConfiguration : IEntityTypeConfiguration<CarDraftDocument>
{
    public void Configure(EntityTypeBuilder<CarDraftDocument> builder)
    {
        builder.Property(d => d.Category).HasMaxLength(50).IsRequired();
        builder.Property(d => d.Url).HasMaxLength(500).IsRequired();
        builder.Property(d => d.PublicId).HasMaxLength(200);
        builder.Property(d => d.OriginalFileName).HasMaxLength(300);

        builder.HasOne(d => d.CarDraft).WithMany().HasForeignKey(d => d.CarDraftId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(d => d.CarDraftId);
    }
}

public class EmailVerificationCodeConfiguration : IEntityTypeConfiguration<EmailVerificationCode>
{
    public void Configure(EntityTypeBuilder<EmailVerificationCode> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.CodeHash).HasMaxLength(64).IsRequired();
        builder.Property(e => e.IpAddress).HasMaxLength(45);
        builder.Property(e => e.UserAgent).HasMaxLength(500);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Fast lookup for live (unconsumed) code per user
        builder.HasIndex(e => new { e.UserId, e.ConsumedAt });
    }
}

// === Payment System Configurations ===

public class AccountBalanceConfiguration : IEntityTypeConfiguration<AccountBalance>
{
    public void Configure(EntityTypeBuilder<AccountBalance> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.AvailableUzs).HasColumnType("decimal(18,2)");
        builder.Property(b => b.LockedUzs).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Version).IsConcurrencyToken();

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.UserId).IsUnique();
    }
}

public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.AmountUzs).HasColumnType("decimal(18,2)");
        builder.Property(e => e.BalanceAfterUzs).HasColumnType("decimal(18,2)");
        builder.Property(e => e.Description).HasMaxLength(200).IsRequired();

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.RelatedBooking)
            .WithMany()
            .HasForeignKey(e => e.RelatedBookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.CreatedByUser)
            .WithMany()
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(e => e.AccountBalance)
            .WithMany(b => b.LedgerEntries)
            .HasForeignKey(e => e.AccountBalanceId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => new { e.UserId, e.CreatedAt });
        builder.HasIndex(e => e.RelatedBookingId);
    }
}

public class UserPaymentMethodConfiguration : IEntityTypeConfiguration<UserPaymentMethod>
{
    public void Configure(EntityTypeBuilder<UserPaymentMethod> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Brand).HasMaxLength(50).IsRequired();
        builder.Property(m => m.Last4).HasMaxLength(4).IsRequired();
        builder.Property(m => m.CardholderName).HasMaxLength(200).IsRequired();
        builder.Property(m => m.ProviderToken).HasMaxLength(500).IsRequired();

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => new { m.UserId, m.DeletedAt });
        builder.HasQueryFilter(m => m.DeletedAt == null);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.AmountUzs).HasColumnType("decimal(18,2)");
        builder.Property(p => p.RefundedAmountUzs).HasColumnType("decimal(18,2)");
        builder.Property(p => p.ProviderRef).HasMaxLength(200);
        builder.Property(p => p.FailureReason).HasMaxLength(500);
        builder.Property(p => p.IdempotencyKey).HasMaxLength(200);

        builder.HasOne(p => p.Booking)
            .WithOne(b => b.Payment)
            .HasForeignKey<Payment>(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.PaymentMethodRef)
            .WithMany(m => m.Payments)
            .HasForeignKey(p => p.PaymentMethodId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(p => p.BookingId).IsUnique();
        builder.HasIndex(p => p.IdempotencyKey).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");
        builder.HasIndex(p => p.Status);
    }
}

public class PaymentSmsChallengeConfiguration : IEntityTypeConfiguration<PaymentSmsChallenge>
{
    public void Configure(EntityTypeBuilder<PaymentSmsChallenge> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.PurposeKey).HasMaxLength(200).IsRequired();
        builder.Property(c => c.CodeHash).HasMaxLength(64).IsRequired();
        builder.Property(c => c.IpAddress).HasMaxLength(45);
        builder.Property(c => c.UserAgent).HasMaxLength(500);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.UserId, c.PurposeKey, c.ConsumedAt });
    }
}

public class ReceiptConfiguration : IEntityTypeConfiguration<Receipt>
{
    public void Configure(EntityTypeBuilder<Receipt> builder)
    {
        builder.HasKey(r => r.Id);
        builder.Property(r => r.ReceiptNumber).HasMaxLength(50).IsRequired();
        builder.Property(r => r.PdfUrl).HasMaxLength(500);
        builder.Property(r => r.TotalUzs).HasColumnType("decimal(18,2)");

        builder.HasOne(r => r.Booking)
            .WithOne(b => b.Receipt)
            .HasForeignKey<Receipt>(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.Payment)
            .WithOne(p => p.Receipt)
            .HasForeignKey<Receipt>(r => r.PaymentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => r.BookingId).IsUnique();
        builder.HasIndex(r => r.ReceiptNumber).IsUnique();
    }
}

public class TopUpIntentConfiguration : IEntityTypeConfiguration<TopUpIntent>
{
    public void Configure(EntityTypeBuilder<TopUpIntent> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.AmountUzs).HasColumnType("decimal(18,2)");

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.PaymentMethod)
            .WithMany()
            .HasForeignKey(t => t.PaymentMethodId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => new { t.UserId, t.CreatedAt });
    }
}

