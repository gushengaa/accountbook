using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

[ApiController]
[Route("api/book-purpose-categories")]
[Authorize]
public class BookPurposeCategoriesController : ControllerBase
{
    private readonly IBookPurposeCategoryService _service;
    private readonly IFeedbackService _feedbackService;

    public BookPurposeCategoriesController(
        IBookPurposeCategoryService service,
        IFeedbackService feedbackService)
    {
        _service = service;
        _feedbackService = feedbackService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 获取账本用途选项
    /// </summary>
    [HttpGet("purposes")]
    public async Task<ActionResult<List<BookPurposeOptionDto>>> GetPurposes()
    {
        return Ok(await _service.GetPurposeOptionsAsync());
    }

    /// <summary>
    /// 按账本用途获取预置关联分类 ID（创建账本时使用）
    /// </summary>
    [HttpGet("by-purpose/{purpose:int}")]
    public async Task<ActionResult<BookPurposeCategoryIdsDto>> GetByPurpose(int purpose)
    {
        try
        {
            return Ok(await _service.GetCategoryIdsByPurposeAsync(purpose));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 管理员：获取某用途已关联的分类详情
    /// </summary>
    [HttpGet("admin/{purpose:int}")]
    public async Task<ActionResult<BookPurposeCategoryConfigDto>> GetAdminConfig(int purpose)
    {
        if (!await _feedbackService.IsAdminAsync(GetUserId()))
            return Forbid();
        try
        {
            return Ok(await _service.GetAdminConfigAsync(purpose));
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 管理员：保存账本用途与二级分类的关联
    /// </summary>
    [HttpPut("admin/{purpose:int}")]
    public async Task<ActionResult<BookPurposeCategoryConfigDto>> SaveAdminConfig(int purpose, [FromBody] SaveBookPurposeCategoriesRequest request)
    {
        if (!await _feedbackService.IsAdminAsync(GetUserId()))
            return Forbid();
        try
        {
            var result = await _service.SavePurposeCategoriesAsync(purpose, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
