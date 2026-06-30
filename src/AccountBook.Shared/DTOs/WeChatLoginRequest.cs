namespace AccountBook.Shared.DTOs;

/// <summary>
/// 微信登录请求
/// </summary>
public class WeChatLoginRequest
{
    /// <summary>
    /// 微信小程序登录凭证 code
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// 用户信息（可选）
    /// </summary>
    public WeChatUserInfo? UserInfo { get; set; }
}

/// <summary>
/// 微信用户信息
/// </summary>
public class WeChatUserInfo
{
    public string? NickName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
}



