using AccountBook.Core.Interfaces;
using AccountBook.Core.Services;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

/// <summary>
/// 用户服务实现
/// </summary>
public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly WeChatService _weChatService;
    private readonly JwtService _jwtService;

    public UserService(
        ApplicationDbContext context,
        WeChatService weChatService,
        JwtService jwtService)
    {
        _context = context;
        _weChatService = weChatService;
        _jwtService = jwtService;
    }

    public async Task<LoginResponse> WeChatLoginAsync(WeChatLoginRequest request)
    {
        // 1. 通过 code 获取 openid
        var sessionResult = await _weChatService.Code2SessionAsync(request.Code);
        if (sessionResult?.Openid == null)
        {
            throw new Exception("微信登录失败：无法获取OpenId");
        }

        // 2. 查找或创建用户
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.OpenId == sessionResult.Openid);

        if (user == null)
        {
            // 创建新用户
            user = new User
            {
                OpenId = sessionResult.Openid,
                UnionId = sessionResult.Unionid,
                NickName = request.UserInfo?.NickName,
                AvatarUrl = request.UserInfo?.AvatarUrl,
                PhoneNumber = request.UserInfo?.PhoneNumber,
                IsAuthorized = true, // 微信登录的用户是已授权的
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // 为新用户创建默认账本
            var defaultAccountBook = new AccountBook.Shared.Models.AccountBook
            {
                Name = "我的账本",
                UserId = user.Id,
                IsDefault = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.AccountBooks.Add(defaultAccountBook);
            await _context.SaveChangesAsync();
        }
        else
        {
            // 更新用户信息（如果提供了）
            if (request.UserInfo != null)
            {
                if (!string.IsNullOrEmpty(request.UserInfo.NickName))
                    user.NickName = request.UserInfo.NickName;
                if (!string.IsNullOrEmpty(request.UserInfo.AvatarUrl))
                    user.AvatarUrl = request.UserInfo.AvatarUrl;
                if (!string.IsNullOrEmpty(request.UserInfo.PhoneNumber))
                    user.PhoneNumber = request.UserInfo.PhoneNumber;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            
            // 微信登录时，标记为已授权
            if (!user.IsAuthorized)
            {
                user.IsAuthorized = true;
                await _context.SaveChangesAsync();
            }
        }

        // 3. 生成 JWT Token
        var token = _jwtService.GenerateToken(user.Id, user.OpenId);

        // 4. 返回结果
        return new LoginResponse
        {
            Token = token,
            UserInfo = new UserInfo
            {
                Id = user.Id,
                NickName = user.NickName,
                AvatarUrl = user.AvatarUrl,
                PhoneNumber = user.PhoneNumber
            }
        };
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    public async Task<User?> GetUserByOpenIdAsync(string openId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.OpenId == openId);
    }

    public async Task<User> UpdateUserInfoAsync(int userId, WeChatUserInfo? userInfo)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new Exception("用户不存在");
        }

        if (userInfo != null)
        {
            if (!string.IsNullOrEmpty(userInfo.NickName))
                user.NickName = userInfo.NickName;
            if (!string.IsNullOrEmpty(userInfo.AvatarUrl))
                user.AvatarUrl = userInfo.AvatarUrl;
            if (!string.IsNullOrEmpty(userInfo.PhoneNumber))
                user.PhoneNumber = userInfo.PhoneNumber;
            user.UpdatedAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<LoginResponse> CreateGuestUserAsync()
    {
        // 生成一个唯一的OpenId（使用GUID）
        var guestOpenId = $"guest_{Guid.NewGuid()}";
        
        // 创建体验用户
        var user = new User
        {
            OpenId = guestOpenId,
            NickName = "体验用户",
            IsAuthorized = false, // 体验用户未授权
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 生成 JWT Token
        var token = _jwtService.GenerateToken(user.Id, user.OpenId);

        // 返回结果
        return new LoginResponse
        {
            Token = token,
            UserInfo = new UserInfo
            {
                Id = user.Id,
                NickName = user.NickName,
                AvatarUrl = user.AvatarUrl,
                PhoneNumber = user.PhoneNumber
            }
        };
    }
}

