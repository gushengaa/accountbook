using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 先添加可空的 UserId 列
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Transactions",
                type: "integer",
                nullable: true);

            // 更新现有记录的 UserId（从 AccountBook 的 UserId 获取）
            migrationBuilder.Sql(@"
                UPDATE ""Transactions""
                SET ""UserId"" = ""AccountBooks"".""UserId""
                FROM ""AccountBooks""
                WHERE ""Transactions"".""AccountBookId"" = ""AccountBooks"".""Id""
                  AND ""Transactions"".""UserId"" IS NULL;
            ");

            // 将 UserId 设为非空
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Transactions",
                type: "integer",
                nullable: false,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Users_UserId",
                table: "Transactions",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Users_UserId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_UserId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Transactions");
        }
    }
}
