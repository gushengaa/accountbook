using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_AccountBookId",
                table: "Transactions");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_AccountBookId_TransactionDate",
                table: "Transactions",
                columns: new[] { "AccountBookId", "TransactionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId_Type",
                table: "Categories",
                columns: new[] { "UserId", "Type" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_AccountBookId_TransactionDate",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Categories_UserId_Type",
                table: "Categories");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_AccountBookId",
                table: "Transactions",
                column: "AccountBookId");
        }
    }
}
