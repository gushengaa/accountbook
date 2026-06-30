using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsAuthorizedToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAuthorized",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAuthorized",
                table: "Users");
        }
    }
}
