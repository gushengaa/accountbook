using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 分类控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ApplicationDbContext _context;
    private readonly IFeedbackService _feedbackService;

    public CategoriesController(
        ICategoryService categoryService,
        ApplicationDbContext context,
        IFeedbackService feedbackService)
    {
        _categoryService = categoryService;
        _context = context;
        _feedbackService = feedbackService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 获取所有分类。可选 accountBookId：若账本有关联类别，仅返回关联类别（及父节点）。
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories([FromQuery] int? type, [FromQuery] int? accountBookId)
    {
        var userId = GetUserId();
        var categories = await _categoryService.GetCategoriesAsync(userId, type, accountBookId);
        return Ok(categories);
    }

    /// <summary>
    /// 管理员：获取系统默认分类（含已使用、展示状态）
    /// </summary>
    [HttpGet("admin")]
    public async Task<ActionResult<List<CategoryAdminDto>>> GetAdminCategories([FromQuery] int? type)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        var list = await _categoryService.GetAdminCategoriesAsync(type);
        return Ok(list);
    }

    /// <summary>
    /// 管理员：新增系统默认分类
    /// </summary>
    [HttpPost("admin")]
    public async Task<ActionResult<CategoryAdminDto>> AdminCreateCategory([FromBody] CreateCategoryRequest request)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var created = await _categoryService.AdminCreateCategoryAsync(request);
            return CreatedAtAction(nameof(GetCategory), new { id = created.Id }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 管理员：更新系统默认分类
    /// </summary>
    [HttpPut("admin/{id:int}")]
    public async Task<ActionResult<CategoryAdminDto>> AdminUpdateCategory(int id, [FromBody] CreateCategoryRequest request)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var category = await _categoryService.AdminUpdateCategoryAsync(id, request);
            if (category == null)
                return NotFound();
            return Ok(category);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 管理员：删除系统默认分类
    /// </summary>
    [HttpDelete("admin/{id:int}")]
    public async Task<IActionResult> AdminDeleteCategory(int id)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var ok = await _categoryService.AdminDeleteCategoryAsync(id);
            if (!ok)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 根据ID获取分类
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetCategory(int id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null)
            return NotFound();
        return Ok(category);
    }

    /// <summary>
    /// 创建分类
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var userId = GetUserId();
        var category = await _categoryService.CreateCategoryAsync(userId, request);
        return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
    }

    /// <summary>
    /// 更新分类
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> UpdateCategory(int id, [FromBody] CreateCategoryRequest request)
    {
        var userId = GetUserId();
        var category = await _categoryService.UpdateCategoryAsync(id, userId, request);
        if (category == null)
            return NotFound();
        return Ok(category);
    }

    /// <summary>
    /// 删除分类
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var userId = GetUserId();
        try
        {
            var result = await _categoryService.DeleteCategoryAsync(id, userId);
            if (!result)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    
    /// <summary>
    /// 重置系统默认分类（管理员功能）
    /// 注意：这会删除所有系统默认分类并重新创建，用户自定义分类不受影响
    /// </summary>
    [HttpPost("reset")]
    public IActionResult ResetCategories()
    {
        try
        {
            DbInitializer.ResetCategories(_context);
            return Ok(new { message = "分类已重置成功" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}



