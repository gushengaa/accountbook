namespace AccountBook.Shared.Models;

/// <summary>
/// 账本用途类型
/// </summary>
public enum AccountBookCategory
{
    /// <summary>日常消费</summary>
    Daily = 0,
    /// <summary>旅行</summary>
    Travel = 1,
    /// <summary>装修</summary>
    Renovation = 2,
    /// <summary>结婚</summary>
    Wedding = 3,
    /// <summary>育儿</summary>
    Parenting = 4,
    /// <summary>生意</summary>
    Business = 5,
    /// <summary>家庭</summary>
    Family = 6,
    /// <summary>活动</summary>
    Activity = 7,
    /// <summary>其他</summary>
    Other = 99
}

/// <summary>
/// 账本实体（统一个人账本和集体账本）
/// </summary>
public class AccountBook
{
    public int Id { get; set; }
    
    /// <summary>
    /// 账本名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 账本描述
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// 账本类型：0-个人账本，1-集体账本
    /// </summary>
    public int Type { get; set; } = 0;
    
    /// <summary>
    /// 账本用途类型
    /// </summary>
    public AccountBookCategory Category { get; set; } = AccountBookCategory.Daily;
    
    /// <summary>
    /// 用户ID（个人账本的所有者，集体账本的创建者）
    /// </summary>
    public int UserId { get; set; }
    
    /// <summary>
    /// 是否为默认账本（仅个人账本有效）
    /// </summary>
    public bool IsDefault { get; set; } = false;
    
    /// <summary>
    /// 分享码（仅集体账本有效，用于邀请好友）
    /// </summary>
    public string? ShareCode { get; set; }
    
    /// <summary>
    /// 预算金额（仅集体账本有效，分为单位）
    /// </summary>
    public long? Budget { get; set; }
    
    /// <summary>
    /// 开始日期（仅集体账本有效）
    /// </summary>
    public DateTime? StartDate { get; set; }
    
    /// <summary>
    /// 结束日期（仅集体账本有效）
    /// </summary>
    public DateTime? EndDate { get; set; }
    
    /// <summary>
    /// 状态（仅集体账本有效）：0-进行中，1-已结束
    /// </summary>
    public int Status { get; set; } = 0;
    
    /// <summary>
    /// 默认币种（记账时默认选中的币种，对应 Currency 枚举值，null 表示使用用户全局默认）
    /// </summary>
    public int? DefaultCurrency { get; set; }
    
    /// <summary>
    /// 账本启用的币种ID列表，逗号分隔，如 "0,1,5,8"。为空或 null 表示使用用户全局启用的币种
    /// </summary>
    public string? EnabledCurrencyIds { get; set; }
    
    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    /// <summary>
    /// 更新时间
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // 导航属性
    public User User { get; set; } = null!;
    public ICollection<AccountBookMember> Members { get; set; } = new List<AccountBookMember>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    /// <summary>
    /// 账本关联的交易类别（记账时仅展示这些类别）
    /// </summary>
    public ICollection<AccountBookCategoryLink> CategoryLinks { get; set; } = new List<AccountBookCategoryLink>();
}

