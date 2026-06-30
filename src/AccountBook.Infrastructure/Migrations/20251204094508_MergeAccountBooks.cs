using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MergeAccountBooks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountBookMembers_SharedAccountBooks_SharedAccountBookId",
                table: "AccountBookMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_AccountBooks_Users_UserId",
                table: "AccountBooks");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_SharedAccountBooks_SharedAccountBookId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "SharedAccountBooks");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_SharedAccountBookId",
                table: "Transactions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Transaction_AccountBookId_SharedAccountBookId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "SharedAccountBookId",
                table: "Transactions");

            migrationBuilder.RenameColumn(
                name: "SharedAccountBookId",
                table: "AccountBookMembers",
                newName: "AccountBookId");

            migrationBuilder.RenameIndex(
                name: "IX_AccountBookMembers_SharedAccountBookId_UserId",
                table: "AccountBookMembers",
                newName: "IX_AccountBookMembers_AccountBookId_UserId");

            migrationBuilder.AlterColumn<int>(
                name: "AccountBookId",
                table: "Transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<long>(
                name: "Budget",
                table: "AccountBooks",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "AccountBooks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ShareCode",
                table: "AccountBooks",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "AccountBooks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "AccountBooks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "AccountBooks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_AccountBooks_ShareCode",
                table: "AccountBooks",
                column: "ShareCode",
                unique: true,
                filter: "\"ShareCode\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_AccountBookMembers_AccountBooks_AccountBookId",
                table: "AccountBookMembers",
                column: "AccountBookId",
                principalTable: "AccountBooks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AccountBooks_Users_UserId",
                table: "AccountBooks",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AccountBookMembers_AccountBooks_AccountBookId",
                table: "AccountBookMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_AccountBooks_Users_UserId",
                table: "AccountBooks");

            migrationBuilder.DropIndex(
                name: "IX_AccountBooks_ShareCode",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "Budget",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "ShareCode",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "AccountBooks");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "AccountBooks");

            migrationBuilder.RenameColumn(
                name: "AccountBookId",
                table: "AccountBookMembers",
                newName: "SharedAccountBookId");

            migrationBuilder.RenameIndex(
                name: "IX_AccountBookMembers_AccountBookId_UserId",
                table: "AccountBookMembers",
                newName: "IX_AccountBookMembers_SharedAccountBookId_UserId");

            migrationBuilder.AlterColumn<int>(
                name: "AccountBookId",
                table: "Transactions",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "SharedAccountBookId",
                table: "Transactions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SharedAccountBooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatorId = table.Column<int>(type: "integer", nullable: false),
                    Budget = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ShareCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedAccountBooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SharedAccountBooks_Users_CreatorId",
                        column: x => x.CreatorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_SharedAccountBookId",
                table: "Transactions",
                column: "SharedAccountBookId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Transaction_AccountBookId_SharedAccountBookId",
                table: "Transactions",
                sql: "(\"AccountBookId\" IS NOT NULL AND \"SharedAccountBookId\" IS NULL) OR (\"AccountBookId\" IS NULL AND \"SharedAccountBookId\" IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_SharedAccountBooks_CreatorId",
                table: "SharedAccountBooks",
                column: "CreatorId");

            migrationBuilder.CreateIndex(
                name: "IX_SharedAccountBooks_ShareCode",
                table: "SharedAccountBooks",
                column: "ShareCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AccountBookMembers_SharedAccountBooks_SharedAccountBookId",
                table: "AccountBookMembers",
                column: "SharedAccountBookId",
                principalTable: "SharedAccountBooks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AccountBooks_Users_UserId",
                table: "AccountBooks",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_SharedAccountBooks_SharedAccountBookId",
                table: "Transactions",
                column: "SharedAccountBookId",
                principalTable: "SharedAccountBooks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
