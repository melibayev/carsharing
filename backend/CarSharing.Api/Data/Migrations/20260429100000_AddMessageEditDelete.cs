using CarSharing.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260429100000_AddMessageEditDelete")]
public partial class AddMessageEditDelete : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "EditedAt",
            table: "Messages",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "IsDeleted",
            table: "Messages",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "EditedAt", table: "Messages");
        migrationBuilder.DropColumn(name: "IsDeleted", table: "Messages");
    }
}
