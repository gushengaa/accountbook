using AccountBook.Shared.Models;

namespace AccountBook.Shared.DTOs;

/// <summary>
/// 交易记录DTO
/// </summary>
public class TransactionDto
{
    public int Id { get; set; }
    public int AccountBookId { get; set; }
    public string AccountBookName { get; set; } = string.Empty;
    public int AccountBookType { get; set; } // 0-个人账本，1-集体账本
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }
    public decimal Amount { get; set; }
    public int Type { get; set; }
    public string? Remark { get; set; }
    public int PaymentMethod { get; set; } // 支付方式
    public string PaymentMethodName { get; set; } = string.Empty; // 支付方式名称
    public int SpendingChannel { get; set; } // 消费渠道
    public string SpendingChannelName { get; set; } = string.Empty; // 消费渠道名称
    public int Currency { get; set; } // 币种
    public string CurrencyName { get; set; } = string.Empty; // 币种名称
    public string CurrencySymbol { get; set; } = string.Empty; // 币种符号
    public DateTime TransactionDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<TransactionImageDto> Images { get; set; } = new();
    
    // 创建者信息（仅集体账本需要）
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatar { get; set; }

    /// <summary>
    /// 分摊对象列表（仅集体账本支出时有值）
    /// </summary>
    public List<TransactionAllocationDto> Allocations { get; set; } = new();
}

/// <summary>
/// 交易分摊DTO
/// </summary>
public class TransactionAllocationDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    /// <summary>
    /// 分摊金额（元），为空表示均摊
    /// </summary>
    public decimal? Amount { get; set; }
}

/// <summary>
/// 创建交易记录请求
/// </summary>
public class CreateTransactionRequest
{
    public int AccountBookId { get; set; }
    public int CategoryId { get; set; }
    public decimal Amount { get; set; }
    public int Type { get; set; }
    public string? Remark { get; set; }
    public int PaymentMethod { get; set; } = 99; // 支付方式，默认其他（记一笔页不再选择）
    public int SpendingChannel { get; set; } = 0; // 消费渠道，默认未指定
    public int Currency { get; set; } = 0; // 币种，默认人民币
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    public List<string>? ImageUrls { get; set; }
    /// <summary>
    /// 分摊对象用户ID列表（仅集体账本支出时有效，为空表示不分摊或全员均摊）
    /// </summary>
    public List<int>? AllocationUserIds { get; set; }
}

/// <summary>
/// 更新交易记录请求
/// </summary>
public class UpdateTransactionRequest
{
    public int CategoryId { get; set; }
    public decimal Amount { get; set; }
    public string? Remark { get; set; }
    public int PaymentMethod { get; set; } // 支付方式
    public int SpendingChannel { get; set; } // 消费渠道
    public int Currency { get; set; } // 币种
    public DateTime TransactionDate { get; set; }
    public List<string>? ImageUrls { get; set; }
    /// <summary>
    /// 分摊对象用户ID列表（仅集体账本支出时有效）
    /// </summary>
    public List<int>? AllocationUserIds { get; set; }
}

/// <summary>
/// 交易图片DTO
/// </summary>
public class TransactionImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

