using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 币种汇率服务接口
/// </summary>
public interface ICurrencyRateService
{
    /// <summary>
    /// 获取用户的所有币种汇率设置
    /// </summary>
    Task<List<CurrencyRateDto>> GetUserCurrencyRatesAsync(int userId);
    
    /// <summary>
    /// 获取用户启用的币种汇率
    /// </summary>
    Task<List<CurrencyRateDto>> GetEnabledCurrencyRatesAsync(int userId);
    
    /// <summary>
    /// 更新单个币种汇率
    /// </summary>
    Task<CurrencyRateDto> UpdateCurrencyRateAsync(int userId, UpdateCurrencyRateRequest request);
    
    /// <summary>
    /// 批量更新币种汇率
    /// </summary>
    Task<List<CurrencyRateDto>> BatchUpdateCurrencyRatesAsync(int userId, BatchUpdateCurrencyRatesRequest request);
    
    /// <summary>
    /// 初始化用户默认币种汇率
    /// </summary>
    Task InitializeDefaultRatesAsync(int userId);
}
