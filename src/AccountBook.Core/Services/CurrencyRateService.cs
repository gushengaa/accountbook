using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

/// <summary>
/// 币种汇率服务实现
/// </summary>
public class CurrencyRateService : ICurrencyRateService
{
    private readonly ApplicationDbContext _context;
    
    // 币种信息映射
    private static readonly Dictionary<Currency, (string Code, string Name, string Symbol, decimal DefaultRate)> CurrencyInfo = new()
    {
        { Currency.CNY, ("CNY", "人民币", "¥", 1.00m) },
        { Currency.USD, ("USD", "美元", "$", 7.20m) },
        { Currency.EUR, ("EUR", "欧元", "€", 7.80m) },
        { Currency.GBP, ("GBP", "英镑", "£", 9.10m) },
        { Currency.JPY, ("JPY", "日元", "¥", 0.048m) },
        { Currency.HKD, ("HKD", "港币", "HK$", 0.92m) },
        { Currency.MOP, ("MOP", "澳门元", "MOP$", 0.90m) },
        { Currency.TWD, ("TWD", "新台币", "NT$", 0.22m) },
        { Currency.KRW, ("KRW", "韩元", "₩", 0.0052m) },
        { Currency.AUD, ("AUD", "澳元", "A$", 4.70m) },
        { Currency.CAD, ("CAD", "加元", "C$", 5.20m) },
        { Currency.SGD, ("SGD", "新加坡元", "S$", 5.35m) },
        { Currency.THB, ("THB", "泰铢", "฿", 0.20m) },
        { Currency.MYR, ("MYR", "马来西亚林吉特", "RM", 1.55m) },
        { Currency.Other, ("OTH", "其他", "", 1.00m) }
    };
    
    public CurrencyRateService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<CurrencyRateDto>> GetUserCurrencyRatesAsync(int userId)
    {
        // 获取用户已有的汇率设置
        var userRates = await _context.CurrencyRates
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.SortOrder)
            .ToListAsync();
        
        // 如果用户没有设置，初始化默认值
        if (!userRates.Any())
        {
            await InitializeDefaultRatesAsync(userId);
            userRates = await _context.CurrencyRates
                .Where(r => r.UserId == userId)
                .OrderBy(r => r.SortOrder)
                .ToListAsync();
        }
        
        return userRates.Select(MapToDto).ToList();
    }
    
    public async Task<List<CurrencyRateDto>> GetEnabledCurrencyRatesAsync(int userId)
    {
        var rates = await GetUserCurrencyRatesAsync(userId);
        return rates.Where(r => r.IsEnabled).ToList();
    }
    
    public async Task<CurrencyRateDto> UpdateCurrencyRateAsync(int userId, UpdateCurrencyRateRequest request)
    {
        var currency = (Currency)request.Currency;
        var rate = await _context.CurrencyRates
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Currency == currency);
        
        if (rate == null)
        {
            // 创建新的汇率设置
            rate = new CurrencyRate
            {
                UserId = userId,
                Currency = currency,
                Rate = request.Rate,
                IsEnabled = request.IsEnabled,
                SortOrder = request.SortOrder,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.CurrencyRates.Add(rate);
        }
        else
        {
            rate.Rate = request.Rate;
            rate.IsEnabled = request.IsEnabled;
            rate.SortOrder = request.SortOrder;
            rate.UpdatedAt = DateTime.UtcNow;
        }
        
        await _context.SaveChangesAsync();
        return MapToDto(rate);
    }
    
    public async Task<List<CurrencyRateDto>> BatchUpdateCurrencyRatesAsync(int userId, BatchUpdateCurrencyRatesRequest request)
    {
        var results = new List<CurrencyRateDto>();
        
        foreach (var rateRequest in request.Rates)
        {
            var result = await UpdateCurrencyRateAsync(userId, rateRequest);
            results.Add(result);
        }
        
        return results;
    }
    
    public async Task InitializeDefaultRatesAsync(int userId)
    {
        var sortOrder = 0;
        var defaultRates = new List<CurrencyRate>();
        
        foreach (var kvp in CurrencyInfo)
        {
            // 跳过"其他"类型
            if (kvp.Key == Currency.Other) continue;
            
            defaultRates.Add(new CurrencyRate
            {
                UserId = userId,
                Currency = kvp.Key,
                Rate = kvp.Value.Item4,
                IsEnabled = kvp.Key == Currency.CNY, // 默认只启用人民币
                SortOrder = sortOrder++,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }
        
        _context.CurrencyRates.AddRange(defaultRates);
        await _context.SaveChangesAsync();
    }
    
    private static CurrencyRateDto MapToDto(CurrencyRate rate)
    {
        var info = CurrencyInfo.TryGetValue(rate.Currency, out var currencyInfo) 
            ? currencyInfo 
            : ("UNK", "未知", "", 1.00m);
        
        return new CurrencyRateDto
        {
            Id = rate.Id,
            Currency = (int)rate.Currency,
            CurrencyCode = info.Item1,
            CurrencyName = info.Item2,
            CurrencySymbol = info.Item3,
            Rate = rate.Rate,
            IsEnabled = rate.IsEnabled,
            SortOrder = rate.SortOrder
        };
    }
}
