using CarSharing.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

/// <summary>
/// Adds the payment system tables: AccountBalance, LedgerEntry, UserPaymentMethod,
/// Payment, PaymentSmsChallenge, Receipt, TopUpIntent.
/// Also adds CheckoutLockExpiresAt to Bookings.
/// </summary>
[DbContext(typeof(AppDbContext))]
[Migration("20260428000000_AddPaymentSystem")]
public partial class AddPaymentSystem : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // AccountBalances
        migrationBuilder.CreateTable(
            name: "AccountBalances",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                AvailableUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                LockedUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                Version = table.Column<long>(type: "bigint", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AccountBalances", x => x.Id);
                table.ForeignKey(
                    name: "FK_AccountBalances_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AccountBalances_UserId",
            table: "AccountBalances",
            column: "UserId",
            unique: true);

        // UserPaymentMethods
        migrationBuilder.CreateTable(
            name: "UserPaymentMethods",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Type = table.Column<int>(type: "integer", nullable: false),
                Brand = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                Last4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                ExpMonth = table.Column<int>(type: "integer", nullable: false),
                ExpYear = table.Column<int>(type: "integer", nullable: false),
                CardholderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                ProviderToken = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                PhoneVerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                DeletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserPaymentMethods", x => x.Id);
                table.ForeignKey(
                    name: "FK_UserPaymentMethods_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_UserPaymentMethods_UserId_DeletedAt",
            table: "UserPaymentMethods",
            columns: new[] { "UserId", "DeletedAt" });

        // Payments
        migrationBuilder.CreateTable(
            name: "Payments",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Method = table.Column<int>(type: "integer", nullable: false),
                PaymentMethodId = table.Column<Guid>(type: "uuid", nullable: true),
                AmountUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                Status = table.Column<int>(type: "integer", nullable: false),
                ProviderRef = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                AuthorizedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CapturedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                RefundedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                RefundedAmountUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                IdempotencyKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Payments", x => x.Id);
                table.ForeignKey(
                    name: "FK_Payments_Bookings_BookingId",
                    column: x => x.BookingId,
                    principalTable: "Bookings",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Payments_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Payments_UserPaymentMethods_PaymentMethodId",
                    column: x => x.PaymentMethodId,
                    principalTable: "UserPaymentMethods",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Payments_BookingId",
            table: "Payments",
            column: "BookingId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Payments_IdempotencyKey",
            table: "Payments",
            column: "IdempotencyKey",
            unique: true,
            filter: "\"IdempotencyKey\" IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_Payments_Status",
            table: "Payments",
            column: "Status");

        // LedgerEntries
        migrationBuilder.CreateTable(
            name: "LedgerEntries",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Direction = table.Column<int>(type: "integer", nullable: false),
                Type = table.Column<int>(type: "integer", nullable: false),
                AmountUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                BalanceAfterUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                RelatedBookingId = table.Column<Guid>(type: "uuid", nullable: true),
                RelatedPaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                AccountBalanceId = table.Column<Guid>(type: "uuid", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LedgerEntries", x => x.Id);
                table.ForeignKey(
                    name: "FK_LedgerEntries_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_LedgerEntries_Bookings_RelatedBookingId",
                    column: x => x.RelatedBookingId,
                    principalTable: "Bookings",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_LedgerEntries_AspNetUsers_CreatedByUserId",
                    column: x => x.CreatedByUserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_LedgerEntries_AccountBalances_AccountBalanceId",
                    column: x => x.AccountBalanceId,
                    principalTable: "AccountBalances",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_LedgerEntries_UserId_CreatedAt",
            table: "LedgerEntries",
            columns: new[] { "UserId", "CreatedAt" });

        migrationBuilder.CreateIndex(
            name: "IX_LedgerEntries_RelatedBookingId",
            table: "LedgerEntries",
            column: "RelatedBookingId");

        // PaymentSmsChallenges
        migrationBuilder.CreateTable(
            name: "PaymentSmsChallenges",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                PurposeKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ConsumedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                AttemptCount = table.Column<int>(type: "integer", nullable: false),
                IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PaymentSmsChallenges", x => x.Id);
                table.ForeignKey(
                    name: "FK_PaymentSmsChallenges_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PaymentSmsChallenges_UserId_PurposeKey_ConsumedAt",
            table: "PaymentSmsChallenges",
            columns: new[] { "UserId", "PurposeKey", "ConsumedAt" });

        // Receipts
        migrationBuilder.CreateTable(
            name: "Receipts",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                BookingId = table.Column<Guid>(type: "uuid", nullable: false),
                PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                ReceiptNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                PdfUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                EmailedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                TotalUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                GeneratedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Receipts", x => x.Id);
                table.ForeignKey(
                    name: "FK_Receipts_Bookings_BookingId",
                    column: x => x.BookingId,
                    principalTable: "Bookings",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_Receipts_Payments_PaymentId",
                    column: x => x.PaymentId,
                    principalTable: "Payments",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Receipts_BookingId",
            table: "Receipts",
            column: "BookingId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Receipts_ReceiptNumber",
            table: "Receipts",
            column: "ReceiptNumber",
            unique: true);

        // TopUpIntents
        migrationBuilder.CreateTable(
            name: "TopUpIntents",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                PaymentMethodId = table.Column<Guid>(type: "uuid", nullable: true),
                AmountUzs = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                IsConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TopUpIntents", x => x.Id);
                table.ForeignKey(
                    name: "FK_TopUpIntents_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TopUpIntents_UserPaymentMethods_PaymentMethodId",
                    column: x => x.PaymentMethodId,
                    principalTable: "UserPaymentMethods",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_TopUpIntents_UserId_CreatedAt",
            table: "TopUpIntents",
            columns: new[] { "UserId", "CreatedAt" });

        // Add CheckoutLockExpiresAt to Bookings
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "CheckoutLockExpiresAt",
            table: "Bookings",
            type: "timestamp with time zone",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Receipts");
        migrationBuilder.DropTable(name: "LedgerEntries");
        migrationBuilder.DropTable(name: "TopUpIntents");
        migrationBuilder.DropTable(name: "PaymentSmsChallenges");
        migrationBuilder.DropTable(name: "Payments");
        migrationBuilder.DropTable(name: "AccountBalances");
        migrationBuilder.DropTable(name: "UserPaymentMethods");

        migrationBuilder.DropColumn(
            name: "CheckoutLockExpiresAt",
            table: "Bookings");
    }
}
