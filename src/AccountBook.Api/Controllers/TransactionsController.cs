using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 交易记录控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    /// <summary>
    /// 获取账本的所有交易记录（支持个人账本和集体账本）
    /// </summary>
    [HttpGet("account-book/{accountBookId}")]
    public async Task<ActionResult<List<TransactionDto>>> GetTransactionsByAccountBook(int accountBookId)
    {
        try
        {
            var userId = GetUserId();
            var transactions = await _transactionService.GetTransactionsByAccountBookIdAsync(accountBookId, userId);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 根据日期范围获取交易记录
    /// </summary>
    [HttpGet("account-book/{accountBookId}/date-range")]
    public async Task<ActionResult<List<TransactionDto>>> GetTransactionsByDateRange(
        int accountBookId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        try
        {
            var userId = GetUserId();
            var transactions = await _transactionService.GetTransactionsByDateRangeAsync(
                accountBookId, userId, startDate, endDate);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 获取昨日、今日、本周交易金额统计
    /// </summary>
    [HttpGet("account-book/{accountBookId}/period-summary")]
    public async Task<ActionResult<TransactionPeriodSummaryDto>> GetPeriodSummary(int accountBookId)
    {
        try
        {
            var userId = GetUserId();
            var summary = await _transactionService.GetPeriodSummaryAsync(accountBookId, userId);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 获取用户全账本统计概览（个人+集体合并）
    /// </summary>
    [HttpGet("statistics/overview")]
    public async Task<ActionResult<UserStatisticsOverviewDto>> GetStatisticsOverview(
        [FromQuery] int year, [FromQuery] int month)
    {
        try
        {
            var userId = GetUserId();
            var overview = await _transactionService.GetUserStatisticsOverviewAsync(userId, year, month);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 个人预算概览（个人账本支出 + 我创建的一起记支出）
    /// </summary>
    [HttpGet("statistics/personal-budget")]
    public async Task<ActionResult<PersonalBudgetOverviewDto>> GetPersonalBudgetOverview(
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] int? personalAccountBookId = null)
    {
        try
        {
            var userId = GetUserId();
            var overview = await _transactionService.GetPersonalBudgetOverviewAsync(
                userId, year, month, personalAccountBookId);
            return Ok(overview);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 获取用户全账本某一级分类在指定年月的交易明细
    /// </summary>
    [HttpGet("statistics/category-transactions")]
    public async Task<ActionResult<List<TransactionDto>>> GetCategoryStatisticsTransactions(
        [FromQuery] int rootCategoryId,
        [FromQuery] int year,
        [FromQuery] int month,
        [FromQuery] int type)
    {
        try
        {
            var userId = GetUserId();
            var transactions = await _transactionService.GetUserTransactionsByRootCategoryAsync(
                userId, rootCategoryId, year, month, type);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 根据ID获取交易记录
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TransactionDto>> GetTransaction(int id)
    {
        var userId = GetUserId();
        var transaction = await _transactionService.GetTransactionByIdAsync(id, userId);
        if (transaction == null)
            return NotFound();
        return Ok(transaction);
    }

    /// <summary>
    /// 创建交易记录
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TransactionDto>> CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var transaction = await _transactionService.CreateTransactionAsync(userId, request);
            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 更新交易记录
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<TransactionDto>> UpdateTransaction(int id, [FromBody] UpdateTransactionRequest request)
    {
        try
        {
            var userId = GetUserId();
            var transaction = await _transactionService.UpdateTransactionAsync(id, userId, request);
            if (transaction == null)
                return NotFound();
            return Ok(transaction);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// 删除交易记录
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTransaction(int id)
    {
        var userId = GetUserId();
        var result = await _transactionService.DeleteTransactionAsync(id, userId);
        if (!result)
            return NotFound();
        return NoContent();
    }
}



