namespace AccountBook.Shared.DTOs;

/// <summary>
/// 单个时间段的收支汇总
/// </summary>
public class PeriodAmountSummaryDto
{
    /// <summary>
    /// 支出金额（元）
    /// </summary>
    public decimal ExpenseAmount { get; set; }

    /// <summary>
    /// 收入金额（元）
    /// </summary>
    public decimal IncomeAmount { get; set; }

    /// <summary>
    /// 交易笔数
    /// </summary>
    public int TransactionCount { get; set; }
}

/// <summary>
/// 昨日 / 今日 / 本周交易金额统计
/// </summary>
public class TransactionPeriodSummaryDto
{
    public PeriodAmountSummaryDto Yesterday { get; set; } = new();
    public PeriodAmountSummaryDto Today { get; set; } = new();
    public PeriodAmountSummaryDto ThisWeek { get; set; } = new();
}
