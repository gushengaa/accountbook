namespace AccountBook.Shared.Models;

/// <summary>
/// 交易分摊：关联交易流水与用户，用于集体账本中记录该笔交易由哪些成员分摊
/// </summary>
public class TransactionAllocation
{
    public int Id { get; set; }

    /// <summary>
    /// 交易ID
    /// </summary>
    public int TransactionId { get; set; }

    /// <summary>
    /// 分摊用户ID
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// 分摊金额（分为单位）。为空时表示均摊
    /// </summary>
    public long? Amount { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // 导航属性
    public Transaction Transaction { get; set; } = null!;
    public User User { get; set; } = null!;
}
