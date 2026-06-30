using System.Text.Json;
using AccountBook.Shared.DTOs;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;

namespace AccountBook.Core.Services;

/// <summary>
/// 交易统计 Redis 缓存（Cache-Aside）
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

    public Task InvalidateAccountBookAsync(int accountBookId)
        => _cache.RemoveAsync($"stats:period:{accountBookId}");

    public async Task InvalidateUserOverviewAsync(int userId)
    {
        // 清除近 13 个月概览缓存（当前月 ± 12）
        var now = DateTime.UtcNow;
        var tasks = new List<Task>();
        for (var i = -12; i <= 1; i++)
        {
            var dt = now.AddMonths(i);
            tasks.Add(_cache.RemoveAsync($"stats:overview:{userId}:{dt.Year}:{dt.Month}"));
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
