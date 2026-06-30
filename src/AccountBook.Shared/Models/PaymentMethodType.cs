namespace AccountBook.Shared.Models;

/// <summary>
/// 支付方式配置（对应 Transactions.PaymentMethod 整型值）
/// </summary>
public class PaymentMethodType
{
    public int Id { get; set; }

    /// <summary>
    /// 写入交易的支付方式编码（与 PaymentMethod 枚举值一致）
    /// </summary>
    public int Value { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Icon { get; set; }

    public string? Color { get; set; }

    public int SortOrder { get; set; }

    public bool IsVisible { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
