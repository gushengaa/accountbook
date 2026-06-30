using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 账本控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountBooksController : ControllerBase
{
    private readonly IAccountBookService _accountBookService;

    public AccountBooksController(IAccountBookService accountBookService)
    {
        _accountBookService = accountBookService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 获取用户的所有账本
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AccountBookDto>>> GetAccountBooks()
    {
        var userId = GetUserId();
        var accountBooks = await _accountBookService.GetAccountBooksByUserIdAsync(userId);
        return Ok(accountBooks);
    }

    /// <summary>
    /// 根据ID获取账本
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AccountBookDto>> GetAccountBook(int id)
    {
        var userId = GetUserId();
        var accountBook = await _accountBookService.GetAccountBookByIdAsync(id, userId);
        if (accountBook == null)
            return NotFound();
        return Ok(accountBook);
    }

    /// <summary>
    /// 创建账本
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<AccountBookDto>> CreateAccountBook([FromBody] CreateAccountBookRequest request)
    {
        var userId = GetUserId();
        var accountBook = await _accountBookService.CreateAccountBookAsync(userId, request);
        return CreatedAtAction(nameof(GetAccountBook), new { id = accountBook.Id }, accountBook);
    }

    /// <summary>
    /// 更新账本
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<AccountBookDto>> UpdateAccountBook(int id, [FromBody] UpdateAccountBookRequest request)
    {
        var userId = GetUserId();
        var accountBook = await _accountBookService.UpdateAccountBookAsync(id, userId, request);
        if (accountBook == null)
            return NotFound();
        return Ok(accountBook);
    }

    /// <summary>
    /// 删除账本
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccountBook(int id)
    {
        var userId = GetUserId();
        try
        {
            var result = await _accountBookService.DeleteAccountBookAsync(id, userId);
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
    /// 设置默认账本
    /// </summary>
    [HttpPost("{id}/set-default")]
    public async Task<IActionResult> SetDefaultAccountBook(int id)
    {
        var userId = GetUserId();
        var result = await _accountBookService.SetDefaultAccountBookAsync(id, userId);
        if (!result)
            return NotFound();
        return Ok(new { message = "设置成功" });
    }
}



