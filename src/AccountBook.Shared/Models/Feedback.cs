namespace AccountBook.Shared.Models;

/// <summary>
/// 反馈类型
/// </summary>
public enum FeedbackType
{
    /// <summary>功能建议</summary>
    FeatureRequest = 0,
    /// <summary>问题反馈</summary>
    BugReport = 1,
    /// <summary>投诉</summary>
    Complaint = 2,
    /// <summary>其他</summary>
    Other = 99
}

/// <summary>
/// 反馈状态
/// </summary>
public enum FeedbackStatus
{
    /// <summary>待处理</summary>
    Pending = 0,
    /// <summary>处理中</summary>
    Processing = 1,
    /// <summary>已完成</summary>
    Completed = 2,
    /// <summary>已关闭</summary>
    Closed = 3
}

/// <summary>
/// 用户反馈实体
/// </summary>
public class Feedback
{
    public int Id { get; set; }
    
    /// <summary>
    /// 用户ID
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 反馈类型
    /// </summary>
    public FeedbackType Type { get; set; } = FeedbackType.FeatureRequest;
    
    /// <summary>
    /// 反馈标题
    /// </summary>
    public string Title { get; set; } = string.Empty;
    
    /// <summary>
    /// 反馈内容
    /// </summary>
    public string Content { get; set; } = string.Empty;
    
    /// <summary>
    /// 联系方式（可选）
    /// </summary>
    public string? Contact { get; set; }
    
    /// <summary>
    /// 图片URL列表（JSON格式）
    /// </summary>
    public string? Images { get; set; }
    
    /// <summary>
    /// 反馈状态
    /// </summary>
    public FeedbackStatus Status { get; set; } = FeedbackStatus.Pending;
    
    /// <summary>
    /// 管理员回复
    /// </summary>
    public string? AdminReply { get; set; }
    
    /// <summary>
    /// 回复时间
    /// </summary>
    public DateTime? ReplyAt { get; set; }
    
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
