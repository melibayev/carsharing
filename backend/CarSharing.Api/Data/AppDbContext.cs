using CarSharing.Api.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CarSharing.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Car> Cars => Set<Car>();
    public DbSet<CarPhoto> CarPhotos => Set<CarPhoto>();
    public DbSet<Feature> Features => Set<Feature>();
    public DbSet<CarFeature> CarFeatures => Set<CarFeature>();
    public DbSet<Availability> Availabilities => Set<Availability>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PayoutRecord> PayoutRecords => Set<PayoutRecord>();
    public DbSet<FavoriteCar> FavoriteCars => Set<FavoriteCar>();
    public DbSet<KycVerification> KycVerifications => Set<KycVerification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<PayoutMethod> PayoutMethods => Set<PayoutMethod>();
    public DbSet<CarDraft> CarDrafts => Set<CarDraft>();
    public DbSet<CarDraftDocument> CarDraftDocuments => Set<CarDraftDocument>();
    public DbSet<EmailVerificationCode> EmailVerificationCodes => Set<EmailVerificationCode>();
    public DbSet<AccountBalance> AccountBalances => Set<AccountBalance>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<UserPaymentMethod> UserPaymentMethods => Set<UserPaymentMethod>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentSmsChallenge> PaymentSmsChallenges => Set<PaymentSmsChallenge>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<TopUpIntent> TopUpIntents => Set<TopUpIntent>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasPostgresExtension("postgis");

        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is AuditableEntity auditable)
            {
                auditable.UpdatedAt = DateTimeOffset.UtcNow;
            }
            else if (entry.Entity is ApplicationUser user)
            {
                user.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }
    }
}
