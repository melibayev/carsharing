using System;
using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace CarSharing.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHostPhase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AuthorizationLetterUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CanDeliverToAirports",
                table: "Cars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CompanyRegCertUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryLocationsJson",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GpsTrackerInstalled",
                table: "Cars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "GpsTrackerPhotoUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "InsuranceExpiry",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InsurancePolicyUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OcrExtractedVin",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OwnershipRelation",
                table: "Cars",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PrivacyRadiusMeters",
                table: "Cars",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresManualReview",
                table: "Cars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SelfCheckInAvailable",
                table: "Cars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SelfCheckInMethod",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechPassportBackUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechPassportFrontUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "TechnicalInspectionExpiry",
                table: "Cars",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnicalInspectionUrl",
                table: "Cars",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VehicleTier",
                table: "Cars",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "VinMismatchFlagged",
                table: "Cars",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FraudRiskScore",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "HostAgreementSignedAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HostAgreementVersion",
                table: "AspNetUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "HostOnboardingReminderSentAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HostOnboardingStatus",
                table: "AspNetUsers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "HostPayoutMethodId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBanned",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnFraudWatchlist",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // These tables were supposed to be created by AddOnboardingFields but were missing from the DB
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
                    ""Id"" uuid NOT NULL,
                    ""Action"" character varying(100) NOT NULL,
                    ""EntityType"" character varying(100) NOT NULL,
                    ""EntityId"" uuid,
                    ""ActorId"" uuid,
                    ""ActorEmail"" character varying(256),
                    ""OldValues"" text,
                    ""NewValues"" text,
                    ""IpAddress"" character varying(50),
                    ""UserAgent"" character varying(500),
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_AuditLogs"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_AuditLogs_AspNetUsers_ActorId"" FOREIGN KEY (""ActorId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE SET NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_ActorId"" ON ""AuditLogs"" (""ActorId"");
                CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_CreatedAt"" ON ""AuditLogs"" (""CreatedAt"");
                CREATE INDEX IF NOT EXISTS ""IX_AuditLogs_EntityType_EntityId"" ON ""AuditLogs"" (""EntityType"", ""EntityId"");

                CREATE TABLE IF NOT EXISTS ""Disputes"" (
                    ""Id"" uuid NOT NULL,
                    ""BookingId"" uuid NOT NULL,
                    ""FiledById"" uuid NOT NULL,
                    ""Status"" integer NOT NULL,
                    ""Category"" integer NOT NULL,
                    ""Description"" character varying(2000) NOT NULL,
                    ""EvidenceUrls"" text,
                    ""Resolution"" character varying(2000),
                    ""RefundAmount"" numeric(18,2),
                    ""ResolvedById"" uuid,
                    ""ResolvedAt"" timestamp with time zone,
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_Disputes"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_Disputes_AspNetUsers_FiledById"" FOREIGN KEY (""FiledById"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE RESTRICT,
                    CONSTRAINT ""FK_Disputes_AspNetUsers_ResolvedById"" FOREIGN KEY (""ResolvedById"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE SET NULL,
                    CONSTRAINT ""FK_Disputes_Bookings_BookingId"" FOREIGN KEY (""BookingId"") REFERENCES ""Bookings"" (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_Disputes_BookingId"" ON ""Disputes"" (""BookingId"");
                CREATE INDEX IF NOT EXISTS ""IX_Disputes_FiledById"" ON ""Disputes"" (""FiledById"");
                CREATE INDEX IF NOT EXISTS ""IX_Disputes_ResolvedById"" ON ""Disputes"" (""ResolvedById"");
                CREATE INDEX IF NOT EXISTS ""IX_Disputes_Status"" ON ""Disputes"" (""Status"");

                CREATE TABLE IF NOT EXISTS ""KycVerifications"" (
                    ""Id"" uuid NOT NULL,
                    ""UserId"" uuid NOT NULL,
                    ""Status"" integer NOT NULL,
                    ""DocumentType"" integer NOT NULL,
                    ""DocumentFrontUrl"" character varying(500) NOT NULL,
                    ""DocumentBackUrl"" character varying(500),
                    ""SelfieUrl"" character varying(500),
                    ""DocumentNumber"" character varying(100),
                    ""DocumentExpiry"" timestamp with time zone,
                    ""RejectionReason"" character varying(1000),
                    ""ReviewedById"" uuid,
                    ""ReviewedAt"" timestamp with time zone,
                    ""Notes"" character varying(2000),
                    ""CreatedAt"" timestamp with time zone NOT NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL,
                    CONSTRAINT ""PK_KycVerifications"" PRIMARY KEY (""Id""),
                    CONSTRAINT ""FK_KycVerifications_AspNetUsers_ReviewedById"" FOREIGN KEY (""ReviewedById"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE SET NULL,
                    CONSTRAINT ""FK_KycVerifications_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS ""IX_KycVerifications_ReviewedById"" ON ""KycVerifications"" (""ReviewedById"");
                CREATE INDEX IF NOT EXISTS ""IX_KycVerifications_UserId_Status"" ON ""KycVerifications"" (""UserId"", ""Status"");
            ");

            migrationBuilder.CreateTable(
                name: "CarDrafts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentStep = table.Column<int>(type: "integer", nullable: false),
                    PlateNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Vin = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: true),
                    Make = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Model = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Year = table.Column<int>(type: "integer", nullable: true),
                    Trim = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OdometerKm = table.Column<int>(type: "integer", nullable: true),
                    Transmission = table.Column<int>(type: "integer", nullable: true),
                    FuelType = table.Column<int>(type: "integer", nullable: true),
                    Seats = table.Column<int>(type: "integer", nullable: true),
                    Doors = table.Column<int>(type: "integer", nullable: true),
                    BodyType = table.Column<int>(type: "integer", nullable: true),
                    VehicleTier = table.Column<int>(type: "integer", nullable: true),
                    OwnershipRelation = table.Column<int>(type: "integer", nullable: true),
                    TechPassportFrontUrl = table.Column<string>(type: "text", nullable: true),
                    TechPassportBackUrl = table.Column<string>(type: "text", nullable: true),
                    AuthorizationLetterUrl = table.Column<string>(type: "text", nullable: true),
                    CompanyRegCertUrl = table.Column<string>(type: "text", nullable: true),
                    InsurancePolicyUrl = table.Column<string>(type: "text", nullable: true),
                    InsuranceExpiry = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    TechnicalInspectionUrl = table.Column<string>(type: "text", nullable: true),
                    TechnicalInspectionExpiry = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    GpsTrackerInstalled = table.Column<bool>(type: "boolean", nullable: false),
                    GpsTrackerPhotoUrl = table.Column<string>(type: "text", nullable: true),
                    OcrExtractedVin = table.Column<string>(type: "text", nullable: true),
                    VinMismatchFlagged = table.Column<bool>(type: "boolean", nullable: false),
                    PhotosJson = table.Column<string>(type: "text", nullable: true),
                    AddressLine = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    City = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Lat = table.Column<decimal>(type: "numeric", nullable: true),
                    Lng = table.Column<decimal>(type: "numeric", nullable: true),
                    Location = table.Column<Point>(type: "geometry", nullable: true),
                    PrivacyRadiusMeters = table.Column<int>(type: "integer", nullable: false),
                    CanDeliverToAirports = table.Column<bool>(type: "boolean", nullable: false),
                    DeliveryLocationsJson = table.Column<string>(type: "text", nullable: true),
                    SelfCheckInAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    SelfCheckInMethod = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AdvanceNoticeHours = table.Column<int>(type: "integer", nullable: false),
                    MinTripDays = table.Column<int>(type: "integer", nullable: false),
                    MaxTripDays = table.Column<int>(type: "integer", nullable: false),
                    BlockedDatesJson = table.Column<string>(type: "text", nullable: true),
                    DailyPriceUzs = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    WeeklyDiscountPercent = table.Column<int>(type: "integer", nullable: false),
                    MonthlyDiscountPercent = table.Column<int>(type: "integer", nullable: false),
                    CleaningFeeUzs = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    SecurityDepositUzs = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    DailyKmLimit = table.Column<int>(type: "integer", nullable: false),
                    ExtraKmFeeUzs = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Rules = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CustomRules = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsInstantBook = table.Column<bool>(type: "boolean", nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarDrafts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CarDrafts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PayoutMethods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Brand = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Last4 = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: false),
                    HolderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BankName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProviderReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    AddedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayoutMethods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayoutMethods_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CarDraftDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CarDraftId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PublicId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OriginalFileName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CarDraftDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CarDraftDocuments_CarDrafts_CarDraftId",
                        column: x => x.CarDraftId,
                        principalTable: "CarDrafts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_HostPayoutMethodId",
                table: "AspNetUsers",
                column: "HostPayoutMethodId");

            migrationBuilder.CreateIndex(
                name: "IX_CarDraftDocuments_CarDraftId",
                table: "CarDraftDocuments",
                column: "CarDraftId");

            migrationBuilder.CreateIndex(
                name: "IX_CarDrafts_UserId",
                table: "CarDrafts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayoutMethods_UserId",
                table: "PayoutMethods",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_PayoutMethods_HostPayoutMethodId",
                table: "AspNetUsers",
                column: "HostPayoutMethodId",
                principalTable: "PayoutMethods",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_PayoutMethods_HostPayoutMethodId",
                table: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "CarDraftDocuments");

            migrationBuilder.DropTable(
                name: "PayoutMethods");

            migrationBuilder.DropTable(
                name: "CarDrafts");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_HostPayoutMethodId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AuthorizationLetterUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "CanDeliverToAirports",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "CompanyRegCertUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "DeliveryLocationsJson",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "GpsTrackerInstalled",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "GpsTrackerPhotoUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "InsuranceExpiry",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "InsurancePolicyUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "OcrExtractedVin",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "OwnershipRelation",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "PrivacyRadiusMeters",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "RequiresManualReview",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "SelfCheckInAvailable",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "SelfCheckInMethod",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechPassportBackUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechPassportFrontUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechnicalInspectionExpiry",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "TechnicalInspectionUrl",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "VehicleTier",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "VinMismatchFlagged",
                table: "Cars");

            migrationBuilder.DropColumn(
                name: "FraudRiskScore",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HostAgreementSignedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HostAgreementVersion",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HostOnboardingReminderSentAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HostOnboardingStatus",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "HostPayoutMethodId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsBanned",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsOnFraudWatchlist",
                table: "AspNetUsers");
        }
    }
}
