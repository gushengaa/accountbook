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
            return Ok(result);
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
                AvatarUrl = request.AvatarUrl,
                PhoneNumber = request.PhoneNumber
            };

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



