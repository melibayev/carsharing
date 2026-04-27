using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CarSharing.Api.Data.Migrations;

/// <summary>
/// Makes Conversation.BookingId nullable and adds Participant1Id/Participant2Id
/// for direct (support) conversations that are not tied to a booking.
/// </summary>
public partial class AddDirectConversations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 1. Drop the old unique index on BookingId (prevents nulls from working)
        migrationBuilder.DropIndex(
            name: "IX_Conversations_BookingId",
            table: "Conversations");

        // 2. Make BookingId nullable
        migrationBuilder.AlterColumn<Guid>(
            name: "BookingId",
            table: "Conversations",
            type: "uuid",
            nullable: true,
            oldClrType: typeof(Guid),
            oldType: "uuid");

        // 3. Re-create the index as non-unique (so multiple NULLs are allowed)
        migrationBuilder.CreateIndex(
            name: "IX_Conversations_BookingId",
            table: "Conversations",
            column: "BookingId");

        // 4. Add Participant1Id and Participant2Id
        migrationBuilder.AddColumn<Guid>(
            name: "Participant1Id",
            table: "Conversations",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "Participant2Id",
            table: "Conversations",
            type: "uuid",
            nullable: true);

        // 5. FK constraints
        migrationBuilder.AddForeignKey(
            name: "FK_Conversations_AspNetUsers_Participant1Id",
            table: "Conversations",
            column: "Participant1Id",
            principalTable: "AspNetUsers",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.AddForeignKey(
            name: "FK_Conversations_AspNetUsers_Participant2Id",
            table: "Conversations",
            column: "Participant2Id",
            principalTable: "AspNetUsers",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        // 6. Index on participant pair
        migrationBuilder.CreateIndex(
            name: "IX_Conversations_Participant1Id_Participant2Id",
            table: "Conversations",
            columns: new[] { "Participant1Id", "Participant2Id" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Conversations_AspNetUsers_Participant1Id",
            table: "Conversations");

        migrationBuilder.DropForeignKey(
            name: "FK_Conversations_AspNetUsers_Participant2Id",
            table: "Conversations");

        migrationBuilder.DropIndex(
            name: "IX_Conversations_Participant1Id_Participant2Id",
            table: "Conversations");

        migrationBuilder.DropColumn(name: "Participant1Id", table: "Conversations");
        migrationBuilder.DropColumn(name: "Participant2Id", table: "Conversations");

        migrationBuilder.DropIndex(
            name: "IX_Conversations_BookingId",
            table: "Conversations");

        migrationBuilder.AlterColumn<Guid>(
            name: "BookingId",
            table: "Conversations",
            type: "uuid",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uuid",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Conversations_BookingId",
            table: "Conversations",
            column: "BookingId",
            unique: true);
    }
}
