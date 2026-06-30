namespace AccountBook.Shared.Models;

/// <summary>
/// 账本用途与交易分类（二级）关联：创建账本时按用途预置关联分类
/// </summary>
public class BookPurposeCategoryLink
{
    public int Id { get; set; }

    /// <summary>
    /// 账本用途（AccountBookCategory 枚举值）
    /// </summary>
    public int Purpose { get; set; }

    /// <summary>
    /// 交易分类 ID（须为二级分类）
    /// </summary>
    public int CategoryId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category Category { get; set; } = null!;
}
