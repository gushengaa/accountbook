using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 账本分类管理（用户自定义、排序、移除）
/// </summary>
[ApiController]
[Route("api/account-books/{accountBookId:int}/categories")]
[Authorize]
public class AccountBookCategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public AccountBookCategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 是否可管理账本分类
    /// </summary>
    [HttpGet("can-manage")]
    public async Task<ActionResult<object>> CanManage(int accountBookId)
    {
        var userId = GetUserId();
        var can = await _categoryService.CanManageBookCategoriesAsync(userId, accountBookId);
        return Ok(new { canManage = can });
    }

    /// <summary>
    /// 获取账本内可管理的分类列表
    /// </summary>
    [HttpGet("manage")]
    public async Task<ActionResult<List<BookCategoryManageItemDto>>> GetManageList(int accountBookId, [FromQuery] int type)
    {
        var userId = GetUserId();
        try
        {
            var list = await _categoryService.GetBookCategoriesManageAsync(userId, accountBookId, type);
            return Ok(list);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 创建用户自定义分类并关联当前账本
    /// </summary>
    [HttpPost("custom")]
    public async Task<ActionResult<CategoryDto>> CreateCustom(int accountBookId, [FromBody] CreateBookCustomCategoryRequest request)
    {
        var userId = GetUserId();
        try
        {
            var created = await _categoryService.CreateBookCustomCategoryAsync(userId, accountBookId, request);
            return Ok(created);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 从账本移除分类
    /// </summary>
    [HttpDelete("{categoryId:int}")]
    public async Task<IActionResult> RemoveFromBook(int accountBookId, int categoryId)
    {
        var userId = GetUserId();
        try
        {
            await _categoryService.RemoveCategoryFromBookAsync(userId, accountBookId, categoryId);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 账本内分类排序
    /// </summary>
    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder(int accountBookId, [FromBody] ReorderBookCategoriesRequest request)
    {
        var userId = GetUserId();
        try
        {
            await _categoryService.ReorderBookCategoriesAsync(userId, accountBookId, request);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
