namespace AccountBook.Shared.DTOs;

/// <summary>
/// 反馈DTO
/// </summary>
public class FeedbackDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatar { get; set; }
    public int Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public List<string>? Images { get; set; }
    public int Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public string? AdminReply { get; set; }
    public DateTime? ReplyAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 创建反馈请求
/// </summary>
public class CreateFeedbackRequest
{
    public int Type { get; set; } = 0;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public List<string>? Images { get; set; }
}

/// <summary>
/// 管理员处理反馈请求
/// </summary>
public class ProcessFeedbackRequest
{
    public int Status { get; set; }
    public string? AdminReply { get; set; }
}
