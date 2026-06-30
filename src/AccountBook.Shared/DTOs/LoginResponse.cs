namespace AccountBook.Shared.DTOs;

/// <summary>
/// 登录响应
/// </summary>
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public UserInfo UserInfo { get; set; } = null!;
}

/// <summary>
/// 用户信息
/// </summary>
public class UserInfo
{
    public int Id { get; set; }
    public string? NickName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
}



