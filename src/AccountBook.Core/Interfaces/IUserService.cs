using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 用户服务接口
/// </summary>
public interface IUserService
{
    /// <summary>
    /// 微信登录
    /// </summary>
    Task<LoginResponse> WeChatLoginAsync(WeChatLoginRequest request);
    
    /// <summary>
    /// 根据ID获取用户
    /// </summary>
    Task<User?> GetUserByIdAsync(int userId);
    
    /// <summary>
    /// 根据OpenId获取用户
    /// </summary>
    Task<User?> GetUserByOpenIdAsync(string openId);
    
    /// <summary>
    /// 更新用户信息
    /// </summary>
    Task<User> UpdateUserInfoAsync(int userId, WeChatUserInfo? userInfo);
    
    /// <summary>
    /// 创建体验用户
    /// </summary>
    Task<LoginResponse> CreateGuestUserAsync();
}



