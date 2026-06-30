using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CurrencyRatesController : ControllerBase
{
    private readonly ICurrencyRateService _currencyRateService;
    
    public CurrencyRatesController(ICurrencyRateService currencyRateService)
    {
        _currencyRateService = currencyRateService;
    }
    
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }
    
    /// <summary>
    /// 获取用户所有币种汇率设置
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CurrencyRateDto>>> GetCurrencyRates()
    {
        var userId = GetUserId();
        var rates = await _currencyRateService.GetUserCurrencyRatesAsync(userId);
        return Ok(rates);
    }
    
    /// <summary>
    /// 获取用户启用的币种汇率
    /// </summary>
    [HttpGet("enabled")]
    public async Task<ActionResult<List<CurrencyRateDto>>> GetEnabledCurrencyRates()
    {
        var userId = GetUserId();
        var rates = await _currencyRateService.GetEnabledCurrencyRatesAsync(userId);
        return Ok(rates);
    }
    
    /// <summary>
    /// 更新单个币种汇率
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<CurrencyRateDto>> UpdateCurrencyRate([FromBody] UpdateCurrencyRateRequest request)
    {
        var userId = GetUserId();
        var rate = await _currencyRateService.UpdateCurrencyRateAsync(userId, request);
        return Ok(rate);
    }
    
    /// <summary>
    /// 批量更新币种汇率
    /// </summary>
    [HttpPut("batch")]
    public async Task<ActionResult<List<CurrencyRateDto>>> BatchUpdateCurrencyRates([FromBody] BatchUpdateCurrencyRatesRequest request)
    {
        var userId = GetUserId();
        var rates = await _currencyRateService.BatchUpdateCurrencyRatesAsync(userId, request);
        return Ok(rates);
    }
}
