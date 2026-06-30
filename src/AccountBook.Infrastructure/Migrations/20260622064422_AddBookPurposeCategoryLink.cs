using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookPurposeCategoryLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookPurposeCategoryLinks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Purpose = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookPurposeCategoryLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookPurposeCategoryLinks_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookPurposeCategoryLinks_CategoryId",
                table: "BookPurposeCategoryLinks",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_BookPurposeCategoryLinks_Purpose_CategoryId",
                table: "BookPurposeCategoryLinks",
                columns: new[] { "Purpose", "CategoryId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookPurposeCategoryLinks");
        }
    }
}
