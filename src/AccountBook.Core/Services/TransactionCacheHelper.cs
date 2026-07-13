using System.Text.Json;
using AccountBook.Shared.DTOs;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;

namespace AccountBook.Core.Services;

/// <summary>
/// 交易统计与首页 Redis 缓存（Cache-Aside）
/// </summary>
public class TransactionCacheHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IDistributedCache _cache;
    private readonly TimeSpan _statisticsTtl;

    public TransactionCacheHelper(IDistributedCache cache, IConfiguration configuration)
    {
        _cache = cache;
        var minutes = configuration.GetValue("Cache:StatisticsTtlMinutes", 10);
        _statisticsTtl = TimeSpan.FromMinutes(minutes);
    }

    public async Task<TransactionPeriodSummaryDto?> GetPeriodSummaryAsync(int accountBookId)
    {
        var json = await _cache.GetStringAsync($"stats:period:{accountBookId}");
        return Deserialize<TransactionPeriodSummaryDto>(json);
    }

    public Task SetPeriodSummaryAsync(int accountBookId, TransactionPeriodSummaryDto summary)
        => SetAsync($"stats:period:{accountBookId}", summary);

    public async Task<UserStatisticsOverviewDto?> GetUserOverviewAsync(int userId, int year, int month)
    {
        var json = await _cache.GetStringAsync($"stats:overview:{userId}:{year}:{month}");
        return Deserialize<UserStatisticsOverviewDto>(json);
    }

    public Task SetUserOverviewAsync(int userId, int year, int month, UserStatisticsOverviewDto overview)
        => SetAsync($"stats:overview:{userId}:{year}:{month}", overview);

    public async Task<PersonalBudgetOverviewDto?> GetPersonalBudgetAsync(int userId, int year, int month)
    {
        var json = await _cache.GetStringAsync($"stats:budget:{userId}:{year}:{month}");
        return Deserialize<PersonalBudgetOverviewDto>(json);
    }

    public Task SetPersonalBudgetAsync(int userId, int year, int month, PersonalBudgetOverviewDto overview)
        => SetAsync($"stats:budget:{userId}:{year}:{month}", overview);

    public async Task<List<TransactionDto>?> GetAccountBookTransactionsAsync(int accountBookId)
    {
        var json = await _cache.GetStringAsync($"home:transactions:{accountBookId}");
        return Deserialize<List<TransactionDto>>(json);
    }

    public Task SetAccountBookTransactionsAsync(int accountBookId, List<TransactionDto> transactions)
        => SetAsync($"home:transactions:{accountBookId}", transactions);

    public async Task<List<TransactionDto>?> GetDateRangeTransactionsAsync(
        int accountBookId, string startDateKey, string endDateKey)
    {
        var json = await _cache.GetStringAsync($"home:range:{accountBookId}:{startDateKey}:{endDateKey}");
        return Deserialize<List<TransactionDto>>(json);
    }

    public Task SetDateRangeTransactionsAsync(
        int accountBookId, string startDateKey, string endDateKey, List<TransactionDto> transactions)
        => SetAsync($"home:range:{accountBookId}:{startDateKey}:{endDateKey}", transactions);

    /// <summary>
    /// 账本数据变更时清除首页相关缓存
    /// </summary>
    public async Task InvalidateAccountBookAsync(
        int accountBookId,
        IEnumerable<(string Start, string End)>? extraDateRanges = null)
    {
        var tasks = new List<Task>
        {
            _cache.RemoveAsync($"stats:period:{accountBookId}"),
            _cache.RemoveAsync($"home:transactions:{accountBookId}")
        };

        if (extraDateRanges != null)
        {
            foreach (var (start, end) in extraDateRanges)
            {
                if (!string.IsNullOrEmpty(start) && !string.IsNullOrEmpty(end))
                {
                    tasks.Add(_cache.RemoveAsync($"home:range:{accountBookId}:{start}:{end}"));
                }
            }
        }

        await Task.WhenAll(tasks);
    }

    public async Task InvalidateUserOverviewAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var tasks = new List<Task>();
        for (var i = -12; i <= 1; i++)
        {
            var dt = now.AddMonths(i);
            tasks.Add(_cache.RemoveAsync($"stats:overview:{userId}:{dt.Year}:{dt.Month}"));
        }
        await Task.WhenAll(tasks);
    }

    public async Task InvalidatePersonalBudgetAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var tasks = new List<Task>();
        for (var i = -12; i <= 1; i++)
        {
            var dt = now.AddMonths(i);
            tasks.Add(_cache.RemoveAsync($"stats:budget:{userId}:{dt.Year}:{dt.Month}"));
        }
        await Task.WhenAll(tasks);
    }

    private Task SetAsync<T>(string key, T value)
    {
        var json = JsonSerializer.Serialize(value, JsonOptions);
        return _cache.SetStringAsync(key, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = _statisticsTtl
        });
    }

    private static T? Deserialize<T>(string? json)
        => string.IsNullOrEmpty(json) ? default : JsonSerializer.Deserialize<T>(json, JsonOptions);
}
