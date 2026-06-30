namespace AccountBook.Shared.Models;

/// <summary>
/// 交易图片实体
/// </summary>
public class TransactionImage
{
    public int Id { get; set; }
    
    /// <summary>
    /// 交易记录ID
    /// </summary>
    public int TransactionId { get; set; }
    
    /// <summary>
    /// 图片URL
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;
    
    /// <summary>
    /// 图片排序
    /// </summary>
    public int SortOrder { get; set; } = 0;
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public Transaction Transaction { get; set; } = null!;
}










