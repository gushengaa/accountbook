using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbacksController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;
    
    public FeedbacksController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }
    
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
    
    /// <summary>
    /// 创建反馈
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FeedbackDto>> CreateFeedback([FromBody] CreateFeedbackRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("请输入反馈标题");
        }
        
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("请输入反馈内容");
        }
        
        var userId = GetUserId();
        var feedback = await _feedbackService.CreateFeedbackAsync(userId, request);
        return Ok(feedback);
    }
    
    /// <summary>
    /// 获取用户的反馈列表
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FeedbackDto>>> GetUserFeedbacks()
    {
        var userId = GetUserId();
        var feedbacks = await _feedbackService.GetUserFeedbacksAsync(userId);
        return Ok(feedbacks);
    }
    
    /// <summary>
    /// 获取反馈详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FeedbackDto>> GetFeedback(int id)
    {
        var userId = GetUserId();
        var feedback = await _feedbackService.GetFeedbackByIdAsync(id, userId);
        
        if (feedback == null)
        {
            return NotFound("反馈不存在");
        }
        
        return Ok(feedback);
    }
    
    /// <summary>
    /// 检查当前用户是否是管理员
    /// </summary>
    [HttpGet("admin/check")]
    public async Task<ActionResult<bool>> CheckIsAdmin()
    {
        var userId = GetUserId();
        var isAdmin = await _feedbackService.IsAdminAsync(userId);
        return Ok(isAdmin);
    }
    
    /// <summary>
    /// 管理员获取所有反馈列表
    /// </summary>
    [HttpGet("admin/list")]
    public async Task<ActionResult<List<FeedbackDto>>> GetAllFeedbacks(int? status = null)
    {
       var userId = GetUserId();
        var isAdmin = await _feedbackService.IsAdminAsync(userId);
        
        if (!isAdmin)
        {
            return Forbid();
        }
        
        var feedbacks = await _feedbackService.GetAllFeedbacksAsync(status);
        return Ok(feedbacks);
    }
    
    /// <summary>
    /// 管理员获取反馈详情
    /// </summary>
    [HttpGet("admin/{id}")]
    public async Task<ActionResult<FeedbackDto>> GetFeedbackForAdmin(int id)
    {
        var userId = GetUserId();
        var isAdmin = await _feedbackService.IsAdminAsync(userId);
        
        if (!isAdmin)
        {
            return Forbid();
        }
        
        var feedback = await _feedbackService.GetFeedbackByIdForAdminAsync(id);
        
        if (feedback == null)
        {
            return NotFound("反馈不存在");
        }
        
        return Ok(feedback);
    }
    
    /// <summary>
    /// 管理员处理反馈
    /// </summary>
    [HttpPut("admin/{id}/process")]
    public async Task<ActionResult<FeedbackDto>> ProcessFeedback(int id, [FromBody] ProcessFeedbackRequest request)
    {
        var userId = GetUserId();
        var isAdmin = await _feedbackService.IsAdminAsync(userId);
        
        if (!isAdmin)
        {
            return Forbid();
        }
        
        var feedback = await _feedbackService.ProcessFeedbackAsync(id, request);
        
        if (feedback == null)
        {
            return NotFound("反馈不存在");
        }
        
        return Ok(feedback);
    }
}
