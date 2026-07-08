namespace AccountBook.Shared.Models;

/// <summary>
/// 交易记录实体（账单）
/// </summary>
public class Transaction
{
    public int Id { get; set; }
    
    /// <summary>
    /// 账本ID（统一使用，支持个人账本和集体账本）
    /// </summary>
    public int AccountBookId { get; set; }
    
    /// <summary>
    /// 创建者用户ID（记录是谁创建的交易）
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 分类ID
    /// </summary>
    public int CategoryId { get; set; }
    
    /// <summary>
    /// 金额（分为单位，避免浮点数精度问题）
    /// </summary>
    public long Amount { get; set; }
    
    /// <summary>
    /// 类型：0-支出，1-收入
    /// </summary>
    public int Type { get; set; }
    
    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }
    
    /// <summary>
    /// 支付方式
    /// </summary>
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Other;

    /// <summary>
    /// 消费渠道（淘宝、京东等，0 表示未指定）
    /// </summary>
    public int SpendingChannel { get; set; }
    
    /// <summary>
    /// 币种
    /// </summary>
    public Currency Currency { get; set; } = Currency.CNY;
    
    /// <summary>
    /// 交易时间
    /// </summary>
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public AccountBook AccountBook { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public User User { get; set; } = null!;
    /// <summary>
    /// 分摊对象（仅集体账本使用）
    /// </summary>
    public ICollection<TransactionAllocation> Allocations { get; set; } = new List<TransactionAllocation>();
}

