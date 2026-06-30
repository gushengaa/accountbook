namespace AccountBook.Shared.DTOs;

/// <summary>
/// 账本DTO（统一个人账本和集体账本）
/// </summary>
public class AccountBookDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Type { get; set; } // 0-个人账本，1-集体账本
    public int Category { get; set; } // 账本用途类型
    public string CategoryName { get; set; } = string.Empty; // 账本用途类型名称
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatar { get; set; }
    public bool IsDefault { get; set; }
    public string? ShareCode { get; set; }
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Status { get; set; }
    /// <summary>
    /// 默认币种（记账时默认选中的币种，对应 Currency 枚举值，null 表示使用用户全局默认）
    /// </summary>
    public int? DefaultCurrency { get; set; }
    /// <summary>
    /// 账本启用的币种ID列表，为空或 null 表示使用用户全局启用的币种
    /// </summary>
    public List<int>? EnabledCurrencyIds { get; set; }
    /// <summary>
    /// 账本关联的交易类别ID列表，为空或 null 表示记账时展示全部类别
    /// </summary>
    public List<int>? LinkedCategoryIds { get; set; }
    public int MemberCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<MemberDto>? Members { get; set; }
}

/// <summary>
/// 创建账本请求（个人账本 type=0，集体账本 type=1）
/// </summary>
public class CreateAccountBookRequest
{
    /// <summary>0-个人账本，1-集体账本</summary>
    public int Type { get; set; } = 0;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Category { get; set; } = 0; // 账本用途类型，默认日常消费
    /// <summary>是否默认账本（仅个人账本有效）</summary>
    public bool IsDefault { get; set; } = false;
    /// <summary>预算金额（仅集体账本有效）</summary>
    public decimal? Budget { get; set; }
    /// <summary>开始日期（仅集体账本有效）</summary>
    public DateTime? StartDate { get; set; }
    /// <summary>结束日期（仅集体账本有效）</summary>
    public DateTime? EndDate { get; set; }
    /// <summary>默认币种（Currency 枚举值）</summary>
    public int? DefaultCurrency { get; set; }
    /// <summary>账本启用的币种ID列表</summary>
    public List<int>? EnabledCurrencyIds { get; set; }
    /// <summary>账本关联的交易类别ID列表</summary>
    public List<int>? LinkedCategoryIds { get; set; }
}

/// <summary>
/// 更新账本请求
/// </summary>
public class UpdateAccountBookRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool? IsDefault { get; set; }
    public decimal? Budget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? Status { get; set; }
    public int? Category { get; set; } // 账本用途类型
    /// <summary>默认币种（Currency 枚举值）</summary>
    public int? DefaultCurrency { get; set; }
    /// <summary>账本启用的币种ID列表</summary>
    public List<int>? EnabledCurrencyIds { get; set; }
    /// <summary>账本关联的交易类别ID列表</summary>
    public List<int>? LinkedCategoryIds { get; set; }
}

/// <summary>
/// 加入集体账本请求
/// </summary>
public class JoinSharedAccountBookRequest
{
    public string ShareCode { get; set; } = string.Empty;
}

/// <summary>
/// 成员DTO
/// </summary>
public class MemberDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public int Role { get; set; }
    public DateTime JoinedAt { get; set; }
}

/// <summary>
/// 集体账本统计DTO
/// </summary>
public class SharedAccountBookStatisticsDto
{
    public decimal TotalExpense { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal Balance { get; set; }
    public decimal? Budget { get; set; }
    public decimal? BudgetRemaining { get; set; }
    public decimal AveragePerPerson { get; set; }
    public int MemberCount { get; set; }
    public List<CategoryStatisticsDto> CategoryStatistics { get; set; } = new();
}

/// <summary>
/// 分类统计DTO
/// </summary>
public class CategoryStatisticsDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }
    public decimal Amount { get; set; }
    public double Percentage { get; set; }
}

/// <summary>
/// 成员统计DTO
/// </summary>
public class MemberStatisticsDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal Balance { get; set; }
    /// <summary>分摊后支出（根据交易分摊表汇总）</summary>
    public decimal AllocatedExpense { get; set; }
    public int TransactionCount { get; set; }
}

/// <summary>
/// 集体账本报告DTO
/// </summary>
public class SharedAccountBookReportDto
{
    /// <summary>
    /// 账本基本信息
    /// </summary>
    public AccountBookDto AccountBook { get; set; } = null!;
    
    /// <summary>
    /// 全部交易记录
    /// </summary>
    public List<TransactionDto> AllTransactions { get; set; } = new();
    
    /// <summary>
    /// 支出分类汇总
    /// </summary>
    public List<CategoryStatisticsDto> ExpenseCategoryStatistics { get; set; } = new();
    
    /// <summary>
    /// 收入分类汇总
    /// </summary>
    public List<CategoryStatisticsDto> IncomeCategoryStatistics { get; set; } = new();
    
    /// <summary>
    /// 每个成员的支出和收入统计
    /// </summary>
    public List<MemberStatisticsDto> MemberStatistics { get; set; } = new();
    
    /// <summary>
    /// 总支出
    /// </summary>
    public decimal TotalExpense { get; set; }
    
    /// <summary>
    /// 总收入
    /// </summary>
    public decimal TotalIncome { get; set; }
    
    /// <summary>
    /// 结余
    /// </summary>
    public decimal Balance { get; set; }
    
    /// <summary>
    /// 人均支出
    /// </summary>
    public decimal AverageExpensePerPerson { get; set; }
    
    /// <summary>
    /// 人均收入
    /// </summary>
    public decimal AverageIncomePerPerson { get; set; }
    
    /// <summary>
    /// 报告生成时间
    /// </summary>
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}



