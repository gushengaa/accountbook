namespace AccountBook.Shared.Models;

/// <summary>
/// 分类实体
/// </summary>
public class Category
{
    public int Id { get; set; }
    
    /// <summary>
    /// 分类名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 分类图标
    /// </summary>
    public string? Icon { get; set; }
    
    /// <summary>
    /// 分类颜色
    /// </summary>
    public string? Color { get; set; }
    
    /// <summary>
    /// 类型：0-支出，1-收入
    /// </summary>
    public int Type { get; set; }
    
    /// <summary>
    /// 用户ID（0表示系统默认分类）
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 排序
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// 是否在记账等场景展示（仅系统默认分类 UserId=0 生效；用户自定义分类始终展示）
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// 父类id
    /// </summary>
    public int? ParentId { get; set; }

    /// <summary>
    /// 是否为用户「我的分类」一级分组（每个用户、每种收支类型各一个）
    /// </summary>
    public bool IsUserCustomRoot { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}

