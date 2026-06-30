namespace AccountBook.Shared.Models;

/// <summary>
/// 账本与交易类别关联表：新建账本时选择的交易类别，记账时仅展示账本关联的类别
/// </summary>
public class AccountBookCategoryLink
{
    public int Id { get; set; }

    /// <summary>
    /// 账本ID
    /// </summary>
    public int AccountBookId { get; set; }

    /// <summary>
    /// 交易类别ID
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// 账本内排序（越小越靠前）
    /// </summary>
    public int SortOrder { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // 导航属性
    public AccountBook AccountBook { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
