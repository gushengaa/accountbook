using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AccountBook.Core.Services;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 认证控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly OssService _ossService;
    public AuthController(IUserService userService, OssService ossService)
    {
        _userService = userService;
        _ossService = ossService;
    }

    /// <summary>
    /// 微信登录
    /// </summary>
    [HttpPost("wechat-login")]
    public async Task<ActionResult<LoginResponse>> WeChatLogin([FromBody] WeChatLoginRequest request)
    {
        try
        {
            var result = await _userService.WeChatLoginAsync(request);
            if (result.UserInfo != null)
            {
                result.UserInfo.AvatarUrl = _ossService.GetAvailableImageUrl(result.UserInfo.AvatarUrl);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 创建体验用户
    /// </summary>
    [HttpPost("guest-login")]
    public async Task<ActionResult<LoginResponse>> GuestLogin()
    {
        try
        {
            var result = await _userService.CreateGuestUserAsync();
            if (result.UserInfo != null)
            {
                result.UserInfo.AvatarUrl = _ossService.GetAvailableImageUrl(result.UserInfo.AvatarUrl);
            }
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 获取当前用户信息（头像返回带签名的可访问 URL）
    /// </summary>
    [HttpGet("user-info")]
    [Authorize]
    public async Task<ActionResult> GetUserInfo()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId) || userId == 0)
            {
                return Unauthorized(new { message = "未授权" });
            }

            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "用户不存在" });
            }

            return Ok(new
            {
                Id = user.Id,
                NickName = user.NickName,
                AvatarUrl = _ossService.GetAvailableImageUrl(user.AvatarUrl),
                PhoneNumber = user.PhoneNumber
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 更新用户信息
    /// </summary>
    [HttpPut("user-info")]
    [Authorize]
    public async Task<ActionResult> UpdateUserInfo([FromBody] UpdateUserInfoRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId) || userId == 0)
            {
                return Unauthorized(new { message = "未授权" });
            }

            var userInfo = new WeChatUserInfo
            {
                NickName = request.NickName,
                AvatarUrl = _ossService.NormalizeStoredImageUrl(request.AvatarUrl),
                PhoneNumber = request.PhoneNumber
            };

            if (!string.IsNullOrEmpty(request.AvatarUrl) && string.IsNullOrEmpty(userInfo.AvatarUrl))
            {
                return BadRequest(new { message = "头像地址无效，请重新上传" });
            }

            var user = await _userService.UpdateUserInfoAsync(userId, userInfo);

            return Ok(new
            {
                Id = user.Id,
                NickName = user.NickName,
                AvatarUrl = _ossService.GetAvailableImageUrl(user.AvatarUrl),
                PhoneNumber = user.PhoneNumber
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

/// <summary>
/// 更新用户信息请求
/// </summary>
public class UpdateUserInfoRequest
{
    public string? NickName { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
}



