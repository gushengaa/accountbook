namespace AccountBook.Shared.DTOs;

/// <summary>
/// 币种汇率DTO
/// </summary>
public class CurrencyRateDto
{
    public int Id { get; set; }
    public int Currency { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public string CurrencyName { get; set; } = string.Empty;
    public string CurrencySymbol { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public bool IsEnabled { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// 更新币种汇率请求
/// </summary>
public class UpdateCurrencyRateRequest
{
    public int Currency { get; set; }
    public decimal Rate { get; set; }
    public bool IsEnabled { get; set; } = true;
    public int SortOrder { get; set; }
}

/// <summary>
/// 批量更新币种汇率请求
/// </summary>
public class BatchUpdateCurrencyRatesRequest
{
    public List<UpdateCurrencyRateRequest> Rates { get; set; } = new();
}
