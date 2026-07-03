namespace AccountBook.Shared.DTOs;

/// <summary>
/// 个人预算概览（个人账本 + 我创建的一起记支出）
/// </summary>
public class PersonalBudgetOverviewDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int? PersonalAccountBookId { get; set; }
    public decimal? Budget { get; set; }
    /// <summary>当前个人账本本月支出（元）</summary>
    public decimal PersonalBookExpense { get; set; }
    /// <summary>我创建的一起记本月支出（元）</summary>
    public decimal SharedPersonalExpense { get; set; }
    /// <summary>计入个人预算的本月总支出（元）</summary>
    public decimal TotalPersonalExpense { get; set; }
    public decimal? BudgetRemaining { get; set; }
    public decimal PersonalBookIncome { get; set; }
    public decimal SharedPersonalIncome { get; set; }
    public decimal TotalPersonalIncome { get; set; }
}
