namespace AccountBook.Shared.Models;

/// <summary>
/// 支付方式枚举
/// </summary>
public enum PaymentMethod
{
    /// <summary>
    /// 现金
    /// </summary>
    Cash = 0,
    
    /// <summary>
    /// 支付宝
    /// </summary>
    Alipay = 1,
    
    /// <summary>
    /// 微信支付
    /// </summary>
    WeChat = 2,
    
    /// <summary>
    /// 云闪付
    /// </summary>
    UnionPay = 3,
    
    /// <summary>
    /// 信用卡
    /// </summary>
    CreditCard = 4,
    
    /// <summary>
    /// 储蓄卡/借记卡
    /// </summary>
    DebitCard = 5,
    
    /// <summary>
    /// 其他
    /// </summary>
    Other = 99
}
