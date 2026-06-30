namespace AccountBook.Shared.Models;

/// <summary>
/// 用户实体
/// </summary>
public class User
{
    public int Id { get; set; }
    
    /// <summary>
    /// 微信 OpenId
    /// </summary>
    public string OpenId { get; set; } = string.Empty;
    
    /// <summary>
    /// 微信 UnionId（可选）
    /// </summary>
    public string? UnionId { get; set; }
    
    /// <summary>
    /// 昵称
    /// </summary>
    public string? NickName { get; set; }
    
    /// <summary>
    /// 头像URL
    /// </summary>
    public string? AvatarUrl { get; set; }
    
    /// <summary>
    /// 手机号
    /// </summary>
    public string? PhoneNumber { get; set; }
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// 是否已授权微信登录
    /// </summary>
    public bool IsAuthorized { get; set; }
    
    /// <summary>
    /// 是否是管理员
    /// </summary>
    public bool IsAdmin { get; set; } = false;
    
    // 导航属性
    public ICollection<AccountBook> AccountBooks { get; set; } = new List<AccountBook>();
}

