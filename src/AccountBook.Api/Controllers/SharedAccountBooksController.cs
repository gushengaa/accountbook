using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 集体账本控制器（使用统一的 AccountBookService）
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SharedAccountBooksController : ControllerBase
{
    private readonly IAccountBookService _accountBookService;

    public SharedAccountBooksController(IAccountBookService accountBookService)
    {
        _accountBookService = accountBookService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 获取用户的所有集体账本
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AccountBookDto>>> GetSharedAccountBooks()
    {
        var userId = GetUserId();
        var sharedAccountBooks = await _accountBookService.GetSharedAccountBooksByUserIdAsync(userId);
        return Ok(sharedAccountBooks);
    }

    /// <summary>
    /// 根据ID获取集体账本详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AccountBookDto>> GetSharedAccountBook(int id)
    {
        var userId = GetUserId();
        var sharedAccountBook = await _accountBookService.GetAccountBookByIdAsync(id, userId);
        if (sharedAccountBook == null || sharedAccountBook.Type != 1)
            return NotFound();
        return Ok(sharedAccountBook);
    }

    /// <summary>
    /// 更新集体账本
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AccountBookDto>> UpdateSharedAccountBook(int id, [FromBody] UpdateAccountBookRequest request)
    {
        try
        {
            var userId = GetUserId();
            var sharedAccountBook = await _accountBookService.UpdateAccountBookAsync(id, userId, request);
            if (sharedAccountBook == null || sharedAccountBook.Type != 1)
                return NotFound();
            return Ok(sharedAccountBook);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 删除集体账本
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSharedAccountBook(int id)
    {
        var userId = GetUserId();
        var result = await _accountBookService.DeleteAccountBookAsync(id, userId);
        if (!result)
            return NotFound();
        return NoContent();
    }

    /// <summary>
    /// 加入集体账本（通过分享码）
    /// </summary>
    [HttpPost("join")]
    public async Task<ActionResult<AccountBookDto>> JoinSharedAccountBook([FromBody] JoinSharedAccountBookRequest request)
    {
        try
        {
            var userId = GetUserId();
            var sharedAccountBook = await _accountBookService.JoinSharedAccountBookAsync(userId, request);
            return Ok(sharedAccountBook);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 移除成员
    /// </summary>
    [HttpDelete("{id}/members/{memberUserId}")]
    public async Task<IActionResult> RemoveMember(int id, int memberUserId)
    {
        try
        {
            var userId = GetUserId();
            var result = await _accountBookService.RemoveMemberAsync(id, memberUserId, userId);
            if (!result)
                return NotFound();
            return Ok(new { message = "移除成功" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 获取集体账本统计信息
    /// </summary>
    [HttpGet("{id}/statistics")]
    public async Task<ActionResult<SharedAccountBookStatisticsDto>> GetStatistics(int id)
    {
        try
        {
            var userId = GetUserId();
            var statistics = await _accountBookService.GetSharedAccountBookStatisticsAsync(id, userId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 生成集体账本报告
    /// </summary>
    [HttpGet("{id}/report")]
    public async Task<ActionResult<SharedAccountBookReportDto>> GenerateReport(int id)
    {
        try
        {
            var userId = GetUserId();
            var report = await _accountBookService.GenerateSharedAccountBookReportAsync(id, userId);
            return Ok(report);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

