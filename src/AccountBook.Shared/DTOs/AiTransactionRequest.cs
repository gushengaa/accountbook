namespace AccountBook.Shared.DTOs;

/// <summary>
/// AI识别交易记录请求
/// </summary>
public class AiTransactionRequest
{
    public string Text { get; set; } = string.Empty;
    public int AccountBookId { get; set; }
    public int? TransactionType { get; set; } // 可选，如果不提供则由AI判断
}

/// <summary>
/// AI识别交易记录响应
/// </summary>
public class AiTransactionResponse
{
    public int CategoryId { get; set; }
    public decimal Amount { get; set; }
    public int Type { get; set; } // 0-支出，1-收入
    public string? Remark { get; set; }
    public DateTime? TransactionDate { get; set; }
    public string? CategoryName { get; set; }
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }
}









