using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260421100000_AddEmailVerificationCode")]
/// <inheritdoc />
public partial class AddEmailVerificationCode : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add EmailVerified value (numeric value 1) to the ProfileCompletionStatus enum
        // Existing values shift: Step2Done was 1 → now 2, etc.
        // We use a raw SQL column rename trick: add the new column, copy, drop old.
        // Actually, since EF stores enums as ints, inserting a new value between
        // existing values would shift all existing data. To avoid this we insert
        // EmailVerified *after* Complete (value 5) initially and then back-fill.
        // A safer approach: add EmailVerified at END numerically (6), existing data unchanged.
        // The C# enum already declares EmailVerified=1 which pushes existing numeric values up by 1.
        // To preserve existing DB data, we: do NOT re-number existing rows; instead treat the field
        // as already-migrated by running an UPDATE that adds 1 to any OnboardingStatus >= 1.

        // Shift existing onboarding status values ≥ EmailVerified(1) up by 1
        migrationBuilder.Sql(
            @"UPDATE ""AspNetUsers""
              SET ""OnboardingStatus"" = ""OnboardingStatus"" + 1
              WHERE ""OnboardingStatus"" >= 1;");

        // Backfill: users at Step2Done(now=2) or later already confirmed their email
        migrationBuilder.Sql(
            @"UPDATE ""AspNetUsers""
              SET ""EmailConfirmed"" = TRUE
              WHERE ""OnboardingStatus"" >= 2;");

        // Create EmailVerificationCodes table
        migrationBuilder.CreateTable(
            name: "EmailVerificationCodes",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ConsumedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                AttemptCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailVerificationCodes", x => x.Id);
                table.ForeignKey(
                    name: "FK_EmailVerificationCodes_AspNetUsers_UserId",
                    column: x => x.UserId,
                    principalTable: "AspNetUsers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EmailVerificationCodes_UserId_ConsumedAt",
            table: "EmailVerificationCodes",
            columns: new[] { "UserId", "ConsumedAt" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "EmailVerificationCodes");

        // Shift enum values back down
        migrationBuilder.Sql(
            @"UPDATE ""AspNetUsers""
              SET ""OnboardingStatus"" = ""OnboardingStatus"" - 1
              WHERE ""OnboardingStatus"" >= 2;");
    }
}
