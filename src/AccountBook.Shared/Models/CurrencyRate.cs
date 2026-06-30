namespace AccountBook.Shared.Models;

/// <summary>
/// 用户币种汇率设置
/// </summary>
public class CurrencyRate
{
    public int Id { get; set; }
    
    /// <summary>
    /// 用户ID
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 币种
    /// </summary>
    public Currency Currency { get; set; }
    
    /// <summary>
    /// 汇率（相对于人民币，1单位该币种 = Rate 人民币）
    /// </summary>
    public decimal Rate { get; set; }
    
    /// <summary>
    /// 是否启用该币种
    /// </summary>
    public bool IsEnabled { get; set; } = true;
    
    /// <summary>
    /// 排序
    /// </summary>
    public int SortOrder { get; set; }
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public User User { get; set; } = null!;
}
