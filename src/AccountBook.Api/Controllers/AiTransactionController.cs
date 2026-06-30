using AccountBook.Core.Interfaces;
using AccountBook.Core.Services;
using AccountBook.Shared.DTOs;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AccountBook.Api.Jobs;

namespace AccountBook.Api.Controllers;

/// <summary>
/// AI交易识别控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiTransactionController : ControllerBase
{
    private readonly IAiTransactionService _aiTransactionService;
    private readonly AiRecognitionTaskStore _taskStore;

    public AiTransactionController(
        IAiTransactionService aiTransactionService,
        AiRecognitionTaskStore taskStore)
    {
        _aiTransactionService = aiTransactionService;
        _taskStore = taskStore;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    [HttpPost("recognize")]
    public async Task<ActionResult<AiTransactionResponse>> RecognizeTransaction([FromBody] AiTransactionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _aiTransactionService.RecognizeTransactionAsync(userId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("recognize-voice")]
    public async Task<ActionResult<VoiceRecognitionResponse>> RecognizeVoice([FromBody] VoiceRecognitionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var result = await _aiTransactionService.RecognizeVoiceAsync(userId, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 异步提交语音识别任务（Hangfire 后台处理）
    /// </summary>
    [HttpPost("recognize-voice/async")]
    public async Task<ActionResult<object>> SubmitVoiceRecognitionAsync([FromBody] VoiceRecognitionRequest request)
    {
        var userId = GetUserId();
        var taskId = Guid.NewGuid().ToString("N");
        await _taskStore.CreateAsync(taskId);
        BackgroundJob.Enqueue<AiRecognitionBackgroundJobs>(
            job => job.ProcessVoiceRecognitionAsync(taskId, userId, request));
        return Accepted(new { taskId });
    }

    /// <summary>
    /// 查询异步识别任务状态
    /// </summary>
    [HttpGet("tasks/{taskId}")]
    public async Task<ActionResult<AiRecognitionTaskDto>> GetTaskStatus(string taskId)
    {
        var task = await _taskStore.GetAsync(taskId);
        if (task == null)
            return NotFound(new { message = "任务不存在或已过期" });
        return Ok(task);
    }
}
