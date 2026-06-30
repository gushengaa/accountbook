namespace AccountBook.Shared.Models;

/// <summary>
/// 账本成员实体
/// </summary>
public class AccountBookMember
{
    public int Id { get; set; }
    
    /// <summary>
    /// 集体账本ID
    /// </summary>
    public int AccountBookId { get; set; }
    
    /// <summary>
    /// 用户ID
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 角色：0-成员，1-管理员
    /// </summary>
    public int Role { get; set; } = 0;
    
    /// <summary>
    /// 加入时间
    /// </summary>
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public AccountBook AccountBook { get; set; } = null!;
    public User User { get; set; } = null!;
}

