using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

/// <inheritdoc />
public partial class AddCarRejectionReason : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "RejectionReason",
            table: "Cars",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "RejectionReason",
            table: "Cars");
    }
}
