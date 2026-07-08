namespace AccountBook.Shared.Models;

/// <summary>
/// 消费渠道配置（对应 Transactions.SpendingChannel 整型值）
/// </summary>
public class SpendingChannelType
{
    public int Id { get; set; }

    public int Value { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Icon { get; set; }

    public string? Color { get; set; }

    public int SortOrder { get; set; }

    public bool IsVisible { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
