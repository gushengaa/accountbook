namespace AccountBook.Shared.DTOs;

/// <summary>
/// 用户全账本统计概览（个人+集体合并）
/// </summary>
public class UserStatisticsOverviewDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal TotalIncome { get; set; }
    public List<CategoryStatisticsDto> ExpenseCategoryStatistics { get; set; } = new();
    public List<CategoryStatisticsDto> IncomeCategoryStatistics { get; set; } = new();
    public List<DailyStatisticsDto> DailyStatistics { get; set; } = new();
    public List<MonthlyComparisonDto> MonthlyComparison { get; set; } = new();
}

public class DailyStatisticsDto
{
    public int Day { get; set; }
    public string Date { get; set; } = string.Empty;
    public decimal ExpenseAmount { get; set; }
    public decimal IncomeAmount { get; set; }
}

public class MonthlyComparisonDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal ExpenseAmount { get; set; }
    public decimal IncomeAmount { get; set; }
}
