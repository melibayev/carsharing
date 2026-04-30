using System;
using CarSharing.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260429200000_AddMessageReply")]
/// <inheritdoc />
public partial class AddMessageReply : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "ReplyToMessageId",
            table: "Messages",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Messages_ReplyToMessageId",
            table: "Messages",
            column: "ReplyToMessageId");

        migrationBuilder.AddForeignKey(
            name: "FK_Messages_Messages_ReplyToMessageId",
            table: "Messages",
            column: "ReplyToMessageId",
            principalTable: "Messages",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Messages_Messages_ReplyToMessageId",
            table: "Messages");

        migrationBuilder.DropIndex(
            name: "IX_Messages_ReplyToMessageId",
            table: "Messages");

        migrationBuilder.DropColumn(
            name: "ReplyToMessageId",
            table: "Messages");
    }
}
