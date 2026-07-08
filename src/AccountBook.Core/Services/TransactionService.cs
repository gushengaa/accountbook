using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

/// <summary>
/// 交易记录服务实现
/// </summary>
public class TransactionService : ITransactionService
{
    private readonly ApplicationDbContext _context;
    private readonly ApplicationReadDbContext _readContext;
    private readonly TransactionCacheHelper _cacheHelper;
    private readonly OssService _ossService;
    private readonly IPaymentMethodTypeService _paymentMethodTypeService;
    private readonly ISpendingChannelTypeService _spendingChannelTypeService;
    private readonly ICategoryService _categoryService;
    
    // 币种信息映射 (名称, 符号)
    private static readonly Dictionary<Currency, (string Name, string Symbol)> CurrencyInfo = new()
    {
        { Currency.CNY, ("人民币", "¥") },
        { Currency.USD, ("美元", "$") },
        { Currency.EUR, ("欧元", "€") },
        { Currency.GBP, ("英镑", "£") },
        { Currency.JPY, ("日元", "¥") },
        { Currency.HKD, ("港币", "HK$") },
        { Currency.MOP, ("澳门元", "MOP$") },
        { Currency.TWD, ("新台币", "NT$") },
        { Currency.KRW, ("韩元", "₩") },
        { Currency.AUD, ("澳元", "A$") },
        { Currency.CAD, ("加元", "C$") },
        { Currency.SGD, ("新加坡元", "S$") },
        { Currency.THB, ("泰铢", "฿") },
        { Currency.MYR, ("马来西亚林吉特", "RM") },
        { Currency.Other, ("其他", "") }
    };
    
    /// <summary>
    /// 获取支付方式名称（兼容历史枚举）
    /// </summary>
    private static string GetFallbackPaymentMethodName(int value)
    {
        return Enum.IsDefined(typeof(PaymentMethod), value)
            ? ((PaymentMethod)value) switch
            {
                PaymentMethod.Cash => "现金",
                PaymentMethod.Alipay => "支付宝",
                PaymentMethod.WeChat => "微信",
                PaymentMethod.UnionPay => "云闪付",
                PaymentMethod.CreditCard => "信用卡",
                PaymentMethod.DebitCard => "储蓄卡",
                PaymentMethod.Other => "其他",
                _ => "未知"
            }
            : "未知";
    }

    private async Task<string> GetPaymentMethodNameAsync(int value)
    {
        var lookup = await _paymentMethodTypeService.GetNameLookupAsync();
        return lookup.TryGetValue(value, out var name) ? name : GetFallbackPaymentMethodName(value);
    }

    private async Task FillPaymentMethodNamesAsync(IEnumerable<TransactionDto> transactions)
    {
        var lookup = await _paymentMethodTypeService.GetNameLookupAsync();
        foreach (var t in transactions)
        {
            t.PaymentMethodName = lookup.TryGetValue(t.PaymentMethod, out var name)
                ? name
                : GetFallbackPaymentMethodName(t.PaymentMethod);
        }
    }

    private static string GetFallbackSpendingChannelName(int value) => value == 0 ? "未指定" : "未知";

    private async Task<string> GetSpendingChannelNameAsync(int value)
    {
        if (value == 0)
            return "未指定";
        var lookup = await _spendingChannelTypeService.GetNameLookupAsync();
        return lookup.TryGetValue(value, out var name) ? name : GetFallbackSpendingChannelName(value);
    }

    private async Task FillSpendingChannelNamesAsync(IEnumerable<TransactionDto> transactions)
    {
        var lookup = await _spendingChannelTypeService.GetNameLookupAsync();
        foreach (var t in transactions)
        {
            t.SpendingChannelName = t.SpendingChannel == 0
                ? "未指定"
                : lookup.TryGetValue(t.SpendingChannel, out var name)
                    ? name
                    : GetFallbackSpendingChannelName(t.SpendingChannel);
        }
    }
    
    /// <summary>
    /// 获取币种名称
    /// </summary>
    private static string GetCurrencyName(Currency currency)
    {
        return CurrencyInfo.TryGetValue(currency, out var info) ? info.Name : "未知";
    }
    
    /// <summary>
    /// 获取币种符号
    /// </summary>
    private static string GetCurrencySymbol(Currency currency)
    {
        return CurrencyInfo.TryGetValue(currency, out var info) ? info.Symbol : "";
    }
    
    public TransactionService(
        ApplicationDbContext context,
        ApplicationReadDbContext readContext,
        TransactionCacheHelper cacheHelper,
        OssService ossService,
        IPaymentMethodTypeService paymentMethodTypeService,
        ISpendingChannelTypeService spendingChannelTypeService,
        ICategoryService categoryService)
    {
        _context = context;
        _readContext = readContext;
        _cacheHelper = cacheHelper;
        _ossService = ossService;
        _paymentMethodTypeService = paymentMethodTypeService;
        _spendingChannelTypeService = spendingChannelTypeService;
        _categoryService = categoryService;
    }

    /// <summary>
    /// 为交易列表加载图片
    /// </summary>
    private async Task LoadImagesForTransactionsAsync(List<TransactionDto> transactions)
    {
        if (!transactions.Any())
            return;

        var transactionIds = transactions.Select(t => t.Id).ToList();

        // 查询所有相关图片
        var allImages = await _context.TransactionImages
            .Where(img => transactionIds.Contains(img.TransactionId))
            .OrderBy(img => img.TransactionId)
            .ThenBy(img => img.SortOrder)
            .ToListAsync();

        // 按 TransactionId 分组
        var imageDict = allImages
            .GroupBy(img => img.TransactionId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(img => new TransactionImageDto
                {
                    Id = img.Id,
                    ImageUrl = _ossService.GetAvailableImageUrl(img.ImageUrl),
                    SortOrder = img.SortOrder,
                    CreatedAt = img.CreatedAt
                }).OrderBy(img => img.SortOrder).ToList()
            );

        // 为每个交易分配图片
        foreach (var transaction in transactions)
        {
            if (imageDict.ContainsKey(transaction.Id))
            {
                transaction.Images = imageDict[transaction.Id];              
            }
            else
            {
                transaction.Images = new List<TransactionImageDto>();
            }
        }
    }

    /// <summary>
    /// 为交易列表加载分摊对象
    /// </summary>
    private async Task LoadAllocationsForTransactionsAsync(List<TransactionDto> transactions)
    {
        if (!transactions.Any())
            return;

        var transactionIds = transactions.Select(t => t.Id).ToList();
        var allocations = await _context.TransactionAllocations
            .Where(a => transactionIds.Contains(a.TransactionId))
            .Include(a => a.User)
            .OrderBy(a => a.TransactionId)
            .ThenBy(a => a.UserId)
            .ToListAsync();

        var allocationDict = allocations
            .GroupBy(a => a.TransactionId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(a => new TransactionAllocationDto
                {
                    UserId = a.UserId,
                    UserName = a.User.NickName ?? "未知",
                    UserAvatar = _ossService.GetAvailableImageUrl(a.User.AvatarUrl),
                    Amount = a.Amount.HasValue ? a.Amount.Value / 100.0m : (decimal?)null
                }).ToList()
            );

        foreach (var transaction in transactions)
        {
            transaction.Allocations = allocationDict.TryGetValue(transaction.Id, out var list) ? list : new List<TransactionAllocationDto>();
        }
    }

    public async Task<List<TransactionDto>> GetTransactionsByAccountBookIdAsync(int accountBookId, int userId)
    {
        // 验证账本权限（个人账本必须是所有者，集体账本必须是成员）
        var accountBook = await _context.AccountBooks
            .Include(ab => ab.Members)
            .FirstOrDefaultAsync(ab => ab.Id == accountBookId);

        if (accountBook == null)
            throw new Exception("账本不存在");

        if (accountBook.Type == 0 && accountBook.UserId != userId)
            throw new Exception("无权限访问该账本");

        if (accountBook.Type == 1 && !accountBook.Members.Any(m => m.UserId == userId))
            throw new Exception("无权限访问该一起账本");

        var result = await _context.Transactions
            .Where(t => t.AccountBookId == accountBookId)
            .Include(t => t.Category)
            .Include(t => t.AccountBook)
            .Include(t => t.User)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                AccountBookId = t.AccountBookId,
                AccountBookName = t.AccountBook != null ? t.AccountBook.Name : string.Empty,
                AccountBookType = t.AccountBook != null ? t.AccountBook.Type : 0,
                CategoryId = t.CategoryId,
                CategoryName = t.Category.Name,
                CategoryIcon = t.Category.Icon,
                CategoryColor = t.Category.Color,
                Amount = t.Amount / 100.0m, // 转换为元
                Type = t.Type,
                Remark = t.Remark,
                PaymentMethod = (int)t.PaymentMethod,
                PaymentMethodName = string.Empty,
                SpendingChannel = t.SpendingChannel,
                SpendingChannelName = string.Empty,
                Currency = (int)t.Currency,
                CurrencyName = GetCurrencyName(t.Currency),
                CurrencySymbol = GetCurrencySymbol(t.Currency),
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                UserId = t.User != null ? t.User.Id : (int?)null,
                UserName = t.User != null ? t.User.NickName : null,
                UserAvatar = t.User != null ? _ossService.GetAvailableImageUrl(t.User.AvatarUrl) : null
            })
            .ToListAsync();

        await FillPaymentMethodNamesAsync(result);
        await FillSpendingChannelNamesAsync(result);
        await LoadImagesForTransactionsAsync(result);
        await LoadAllocationsForTransactionsAsync(result);
        return result;
    }

    public async Task<List<TransactionDto>> GetTransactionsByDateRangeAsync(
        int accountBookId, int userId, DateTime startDate, DateTime endDate)
    {
        // 验证账本权限
        var accountBook = await _context.AccountBooks
            .Include(ab => ab.Members)
            .FirstOrDefaultAsync(ab => ab.Id == accountBookId);

        if (accountBook == null)
            throw new Exception("账本不存在");

        if (accountBook.Type == 0 && accountBook.UserId != userId)
            throw new Exception("无权限访问该账本");

        if (accountBook.Type == 1 && !accountBook.Members.Any(m => m.UserId == userId))
            throw new Exception("无权限访问该一起账本");

        var result = await _context.Transactions
            .Where(t => t.AccountBookId == accountBookId &&
                       t.TransactionDate >= startDate &&
                       t.TransactionDate <= endDate)
            .Include(t => t.Category)
            .Include(t => t.AccountBook)
            .Include(t => t.User)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                AccountBookId = t.AccountBookId,
                AccountBookName = t.AccountBook.Name,
                AccountBookType = t.AccountBook.Type,
                CategoryId = t.CategoryId,
                CategoryName = t.Category.Name,
                CategoryIcon = t.Category.Icon,
                CategoryColor = t.Category.Color,
                Amount = t.Amount / 100.0m,
                Type = t.Type,
                Remark = t.Remark,
                PaymentMethod = (int)t.PaymentMethod,
                PaymentMethodName = string.Empty,
                SpendingChannel = t.SpendingChannel,
                SpendingChannelName = string.Empty,
                Currency = (int)t.Currency,
                CurrencyName = GetCurrencyName(t.Currency),
                CurrencySymbol = GetCurrencySymbol(t.Currency),
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                UserId = t.User != null ? t.User.Id : (int?)null,
                UserName = t.User != null ? t.User.NickName : null,
                UserAvatar = t.User != null ? _ossService.GetAvailableImageUrl(t.User.AvatarUrl) : null
            })
            .ToListAsync();

        await FillPaymentMethodNamesAsync(result);
        await FillSpendingChannelNamesAsync(result);
        await LoadImagesForTransactionsAsync(result);
        await LoadAllocationsForTransactionsAsync(result);
        return result;
    }

    public async Task<TransactionPeriodSummaryDto> GetPeriodSummaryAsync(int accountBookId, int userId)
    {
        var accountBook = await _readContext.AccountBooks
            .AsNoTracking()
            .Include(ab => ab.Members)
            .FirstOrDefaultAsync(ab => ab.Id == accountBookId);

        if (accountBook == null)
            throw new Exception("账本不存在");

        if (accountBook.Type == 0 && accountBook.UserId != userId)
            throw new Exception("无权限访问该账本");

        if (accountBook.Type == 1 && !accountBook.Members.Any(m => m.UserId == userId))
            throw new Exception("无权限访问该一起账本");

        var cached = await _cacheHelper.GetPeriodSummaryAsync(accountBookId);
        if (cached != null)
            return cached;

        var chinaTz = GetChinaTimeZone();
        var nowChina = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, chinaTz);
        var todayStart = DateTime.SpecifyKind(nowChina.Date, DateTimeKind.Unspecified);
        var yesterdayStart = todayStart.AddDays(-1);
        var dayOfWeek = (int)nowChina.DayOfWeek;
        var daysFromMonday = dayOfWeek == 0 ? 6 : dayOfWeek - 1;
        var weekStart = todayStart.AddDays(-daysFromMonday);

        var rangeStartUtc = TimeZoneInfo.ConvertTimeToUtc(weekStart, chinaTz);
        var rangeEndUtc = TimeZoneInfo.ConvertTimeToUtc(todayStart.AddDays(1), chinaTz);

        var transactions = await _readContext.Transactions
            .AsNoTracking()
            .Where(t => t.AccountBookId == accountBookId &&
                        t.TransactionDate >= rangeStartUtc &&
                        t.TransactionDate < rangeEndUtc)
            .Select(t => new { t.TransactionDate, t.Amount, t.Type })
            .ToListAsync();

        var localized = transactions.Select(t =>
        {
            var utc = t.TransactionDate.Kind == DateTimeKind.Utc
                ? t.TransactionDate
                : DateTime.SpecifyKind(t.TransactionDate, DateTimeKind.Utc);
            var localDate = TimeZoneInfo.ConvertTimeFromUtc(utc, chinaTz).Date;
            return (LocalDate: localDate, t.Amount, t.Type);
        }).ToList();

        var summary = new TransactionPeriodSummaryDto
        {
            Yesterday = SummarizePeriod(localized.Where(t => t.LocalDate == yesterdayStart)),
            Today = SummarizePeriod(localized.Where(t => t.LocalDate == todayStart)),
            ThisWeek = SummarizePeriod(localized.Where(t => t.LocalDate >= weekStart && t.LocalDate <= todayStart))
        };

        await _cacheHelper.SetPeriodSummaryAsync(accountBookId, summary);
        return summary;
    }

    public async Task<UserStatisticsOverviewDto> GetUserStatisticsOverviewAsync(int userId, int year, int month)
    {
        if (month < 1 || month > 12)
            throw new ArgumentException("月份无效");

        var cached = await _cacheHelper.GetUserOverviewAsync(userId, year, month);
        if (cached != null)
            return cached;

        var bookIds = await GetAccessibleAccountBookIdsAsync(userId, _readContext);
        if (bookIds.Count == 0)
        {
            return BuildEmptyOverview(year, month);
        }

        var chinaTz = GetChinaTimeZone();
        var selectedStartLocal = new DateTime(year, month, 1);
        var selectedEndLocal = selectedStartLocal.AddMonths(1);
        var comparisonStartLocal = selectedStartLocal.AddMonths(-5);

        var rangeStartUtc = TimeZoneInfo.ConvertTimeToUtc(comparisonStartLocal, chinaTz);
        var rangeEndUtc = TimeZoneInfo.ConvertTimeToUtc(selectedEndLocal, chinaTz);

        var raw = await _readContext.Transactions
            .AsNoTracking()
            .Where(t => bookIds.Contains(t.AccountBookId)
                        && t.TransactionDate >= rangeStartUtc
                        && t.TransactionDate < rangeEndUtc)
            .Include(t => t.Category)
            .Select(t => new
            {
                t.TransactionDate,
                t.Amount,
                t.Type,
                t.CategoryId,
                CategoryName = t.Category.Name,
                CategoryIcon = t.Category.Icon,
                CategoryColor = t.Category.Color,
                CategoryParentId = t.Category.ParentId
            })
            .ToListAsync();

        var localized = raw.Select(t =>
        {
            var utc = t.TransactionDate.Kind == DateTimeKind.Utc
                ? t.TransactionDate
                : DateTime.SpecifyKind(t.TransactionDate, DateTimeKind.Utc);
            var local = TimeZoneInfo.ConvertTimeFromUtc(utc, chinaTz);
            return new
            {
                Local = local,
                Year = local.Year,
                Month = local.Month,
                Day = local.Day,
                DateKey = local.ToString("yyyy-MM-dd"),
                Amount = t.Amount / 100.0m,
                t.Type,
                t.CategoryId,
                t.CategoryName,
                t.CategoryIcon,
                t.CategoryColor,
                t.CategoryParentId
            };
        }).ToList();

        var monthItems = localized
            .Where(t => t.Year == year && t.Month == month)
            .ToList();

        var totalExpense = monthItems.Where(t => t.Type == 0).Sum(t => t.Amount);
        var totalIncome = monthItems.Where(t => t.Type == 1).Sum(t => t.Amount);

        var parentIds = monthItems
            .Where(t => t.CategoryParentId.HasValue)
            .Select(t => t.CategoryParentId!.Value)
            .Distinct()
            .ToList();

        var parentCategoryMap = parentIds.Count == 0
            ? new Dictionary<int, Category>()
            : await _readContext.Categories
                .AsNoTracking()
                .Where(c => parentIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);

        var expenseCategoryStats = BuildTopLevelCategoryStatistics(
            monthItems.Where(t => t.Type == 0).Select(t => (
                t.CategoryId, t.CategoryParentId, t.CategoryName, t.CategoryIcon, t.CategoryColor, t.Amount)),
            parentCategoryMap,
            totalExpense);
        var incomeCategoryStats = BuildTopLevelCategoryStatistics(
            monthItems.Where(t => t.Type == 1).Select(t => (
                t.CategoryId, t.CategoryParentId, t.CategoryName, t.CategoryIcon, t.CategoryColor, t.Amount)),
            parentCategoryMap,
            totalIncome);

        var daysInMonth = DateTime.DaysInMonth(year, month);
        var dailyMap = monthItems
            .GroupBy(t => t.Day)
            .ToDictionary(
                g => g.Key,
                g => new DailyStatisticsDto
                {
                    Day = g.Key,
                    Date = $"{year:0000}-{month:00}-{g.Key:00}",
                    ExpenseAmount = g.Where(x => x.Type == 0).Sum(x => x.Amount),
                    IncomeAmount = g.Where(x => x.Type == 1).Sum(x => x.Amount)
                });

        var dailyStatistics = Enumerable.Range(1, daysInMonth)
            .Select(day => dailyMap.TryGetValue(day, out var item)
                ? item
                : new DailyStatisticsDto
                {
                    Day = day,
                    Date = $"{year:0000}-{month:00}-{day:00}",
                    ExpenseAmount = 0,
                    IncomeAmount = 0
                })
            .ToList();

        var monthlyComparison = new List<MonthlyComparisonDto>();
        for (var i = 0; i < 6; i++)
        {
            var dt = selectedStartLocal.AddMonths(-5 + i);
            var monthExpense = localized
                .Where(t => t.Year == dt.Year && t.Month == dt.Month && t.Type == 0)
                .Sum(t => t.Amount);
            var monthIncome = localized
                .Where(t => t.Year == dt.Year && t.Month == dt.Month && t.Type == 1)
                .Sum(t => t.Amount);
            monthlyComparison.Add(new MonthlyComparisonDto
            {
                Year = dt.Year,
                Month = dt.Month,
                Label = $"{dt.Month}月",
                ExpenseAmount = monthExpense,
                IncomeAmount = monthIncome
            });
        }

        var overview = new UserStatisticsOverviewDto
        {
            Year = year,
            Month = month,
            TotalExpense = totalExpense,
            TotalIncome = totalIncome,
            ExpenseCategoryStatistics = expenseCategoryStats,
            IncomeCategoryStatistics = incomeCategoryStats,
            DailyStatistics = dailyStatistics,
            MonthlyComparison = monthlyComparison
        };

        await _cacheHelper.SetUserOverviewAsync(userId, year, month, overview);
        return overview;
    }

    public async Task<PersonalBudgetOverviewDto> GetPersonalBudgetOverviewAsync(
        int userId, int year, int month, int? personalAccountBookId = null)
    {
        if (month < 1 || month > 12)
            throw new ArgumentException("月份无效");

        var personalBook = await ResolvePersonalAccountBookAsync(userId, personalAccountBookId);
        var chinaTz = GetChinaTimeZone();
        var startLocal = new DateTime(year, month, 1);
        var endLocal = startLocal.AddMonths(1);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, chinaTz);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(endLocal, chinaTz);

        decimal personalBookExpense = 0;
        decimal personalBookIncome = 0;
        if (personalBook != null)
        {
            var personalTxs = await _readContext.Transactions
                .AsNoTracking()
                .Where(t => t.AccountBookId == personalBook.Id
                            && t.TransactionDate >= startUtc
                            && t.TransactionDate < endUtc)
                .Select(t => new { t.Amount, t.Type })
                .ToListAsync();
            personalBookExpense = personalTxs.Where(t => t.Type == 0).Sum(t => t.Amount) / 100.0m;
            personalBookIncome = personalTxs.Where(t => t.Type == 1).Sum(t => t.Amount) / 100.0m;
        }

        var sharedBookIds = await _readContext.AccountBookMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.AccountBook.Type == 1)
            .Select(m => m.AccountBookId)
            .Distinct()
            .ToListAsync();

        decimal sharedPersonalExpense = 0;
        decimal sharedPersonalIncome = 0;
        if (sharedBookIds.Count > 0)
        {
            var sharedTxs = await _readContext.Transactions
                .AsNoTracking()
                .Where(t => sharedBookIds.Contains(t.AccountBookId)
                            && t.UserId == userId
                            && t.TransactionDate >= startUtc
                            && t.TransactionDate < endUtc)
                .Select(t => new { t.Amount, t.Type })
                .ToListAsync();
            sharedPersonalExpense = sharedTxs.Where(t => t.Type == 0).Sum(t => t.Amount) / 100.0m;
            sharedPersonalIncome = sharedTxs.Where(t => t.Type == 1).Sum(t => t.Amount) / 100.0m;
        }

        var totalExpense = personalBookExpense + sharedPersonalExpense;
        var totalIncome = personalBookIncome + sharedPersonalIncome;
        decimal? budget = personalBook?.Budget.HasValue == true
            ? personalBook.Budget.Value / 100.0m
            : null;
        decimal? budgetRemaining = budget.HasValue ? budget.Value - totalExpense : null;

        var overview = new PersonalBudgetOverviewDto
        {
            Year = year,
            Month = month,
            PersonalAccountBookId = personalBook?.Id,
            Budget = budget,
            PersonalBookExpense = personalBookExpense,
            SharedPersonalExpense = sharedPersonalExpense,
            TotalPersonalExpense = totalExpense,
            BudgetRemaining = budgetRemaining,
            PersonalBookIncome = personalBookIncome,
            SharedPersonalIncome = sharedPersonalIncome,
            TotalPersonalIncome = totalIncome
        };

        return overview;
    }

    private async Task<AccountBook.Shared.Models.AccountBook?> ResolvePersonalAccountBookAsync(
        int userId, int? personalAccountBookId)
    {
        if (personalAccountBookId.HasValue)
        {
            var specified = await _readContext.AccountBooks
                .AsNoTracking()
                .FirstOrDefaultAsync(ab => ab.Id == personalAccountBookId.Value
                                           && ab.UserId == userId
                                           && ab.Type == 0);
            if (specified != null)
                return specified;
        }

        return await _readContext.AccountBooks
                   .AsNoTracking()
                   .Where(ab => ab.UserId == userId && ab.Type == 0 && ab.IsDefault)
                   .FirstOrDefaultAsync()
               ?? await _readContext.AccountBooks
                   .AsNoTracking()
                   .Where(ab => ab.UserId == userId && ab.Type == 0)
                   .OrderBy(ab => ab.Id)
                   .FirstOrDefaultAsync();
    }

    private static List<CategoryStatisticsDto> BuildTopLevelCategoryStatistics(
        IEnumerable<(int CategoryId, int? CategoryParentId, string CategoryName, string? CategoryIcon, string? CategoryColor, decimal Amount)> items,
        Dictionary<int, Category> parentCategoryMap,
        decimal total)
    {
        return items
            .Select(item =>
            {
                if (item.CategoryParentId.HasValue
                    && parentCategoryMap.TryGetValue(item.CategoryParentId.Value, out var parent))
                {
                    return (RootId: parent.Id, Name: parent.Name, Icon: parent.Icon, Color: parent.Color, Amount: item.Amount);
                }

                return (RootId: item.CategoryId, Name: item.CategoryName, Icon: item.CategoryIcon, Color: item.CategoryColor, Amount: item.Amount);
            })
            .GroupBy(x => x.RootId)
            .Select(g =>
            {
                var sample = g.First();
                var amount = g.Sum(x => x.Amount);
                return new CategoryStatisticsDto
                {
                    CategoryId = g.Key,
                    CategoryName = sample.Name,
                    CategoryIcon = sample.Icon,
                    CategoryColor = sample.Color,
                    Amount = amount,
                    Percentage = total > 0 ? (double)(amount / total * 100) : 0
                };
            })
            .OrderByDescending(x => x.Amount)
            .ToList();
    }

    public async Task<List<TransactionDto>> GetUserTransactionsByRootCategoryAsync(
        int userId, int rootCategoryId, int year, int month, int type)
    {
        if (month < 1 || month > 12)
            throw new ArgumentException("月份无效");

        if (type is not (0 or 1))
            throw new ArgumentException("交易类型无效");

        var rootCategory = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == rootCategoryId);
        if (rootCategory == null)
            throw new Exception("分类不存在");

        var bookIds = await GetAccessibleAccountBookIdsAsync(userId);
        if (bookIds.Count == 0)
            return new List<TransactionDto>();

        var categoryIds = await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == rootCategoryId || c.ParentId == rootCategoryId)
            .Select(c => c.Id)
            .ToListAsync();

        var chinaTz = GetChinaTimeZone();
        var monthStartLocal = new DateTime(year, month, 1);
        var monthEndLocal = monthStartLocal.AddMonths(1);
        var rangeStartUtc = TimeZoneInfo.ConvertTimeToUtc(monthStartLocal, chinaTz);
        var rangeEndUtc = TimeZoneInfo.ConvertTimeToUtc(monthEndLocal, chinaTz);

        var result = await _context.Transactions
            .Where(t => bookIds.Contains(t.AccountBookId)
                        && categoryIds.Contains(t.CategoryId)
                        && t.Type == type
                        && t.TransactionDate >= rangeStartUtc
                        && t.TransactionDate < rangeEndUtc)
            .Include(t => t.Category)
            .Include(t => t.AccountBook)
            .Include(t => t.User)
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                AccountBookId = t.AccountBookId,
                AccountBookName = t.AccountBook != null ? t.AccountBook.Name : string.Empty,
                AccountBookType = t.AccountBook != null ? t.AccountBook.Type : 0,
                CategoryId = t.CategoryId,
                CategoryName = t.Category.Name,
                CategoryIcon = t.Category.Icon,
                CategoryColor = t.Category.Color,
                Amount = t.Amount / 100.0m,
                Type = t.Type,
                Remark = t.Remark,
                PaymentMethod = (int)t.PaymentMethod,
                PaymentMethodName = string.Empty,
                SpendingChannel = t.SpendingChannel,
                SpendingChannelName = string.Empty,
                Currency = (int)t.Currency,
                CurrencyName = GetCurrencyName(t.Currency),
                CurrencySymbol = GetCurrencySymbol(t.Currency),
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                UserId = t.User != null ? t.User.Id : (int?)null,
                UserName = t.User != null ? t.User.NickName : null,
                UserAvatar = t.User != null ? _ossService.GetAvailableImageUrl(t.User.AvatarUrl) : null
            })
            .ToListAsync();

        await FillPaymentMethodNamesAsync(result);
        await FillSpendingChannelNamesAsync(result);
        await LoadImagesForTransactionsAsync(result);
        await LoadAllocationsForTransactionsAsync(result);
        return result;
    }

    private Task<List<int>> GetAccessibleAccountBookIdsAsync(int userId)
        => GetAccessibleAccountBookIdsAsync(userId, _context);

    private static async Task<List<int>> GetAccessibleAccountBookIdsAsync(int userId, ApplicationDbContext db)
    {
        var personalIds = await db.AccountBooks
            .AsNoTracking()
            .Where(ab => ab.UserId == userId && ab.Type == 0)
            .Select(ab => ab.Id)
            .ToListAsync();
        var sharedIds = await db.AccountBookMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId)
            .Select(m => m.AccountBookId)
            .ToListAsync();
        return personalIds.Concat(sharedIds).Distinct().ToList();
    }

    private static UserStatisticsOverviewDto BuildEmptyOverview(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var selectedStartLocal = new DateTime(year, month, 1);
        return new UserStatisticsOverviewDto
        {
            Year = year,
            Month = month,
            DailyStatistics = Enumerable.Range(1, daysInMonth)
                .Select(day => new DailyStatisticsDto
                {
                    Day = day,
                    Date = $"{year:0000}-{month:00}-{day:00}"
                }).ToList(),
            MonthlyComparison = Enumerable.Range(0, 6)
                .Select(i =>
                {
                    var dt = selectedStartLocal.AddMonths(-5 + i);
                    return new MonthlyComparisonDto
                    {
                        Year = dt.Year,
                        Month = dt.Month,
                        Label = $"{dt.Month}月"
                    };
                }).ToList()
        };
    }

    private static PeriodAmountSummaryDto SummarizePeriod(IEnumerable<(DateTime LocalDate, long Amount, int Type)> items)
    {
        var list = items.ToList();
        return new PeriodAmountSummaryDto
        {
            ExpenseAmount = list.Where(x => x.Type == 0).Sum(x => x.Amount) / 100.0m,
            IncomeAmount = list.Where(x => x.Type == 1).Sum(x => x.Amount) / 100.0m,
            TransactionCount = list.Count
        };
    }

    private static TimeZoneInfo GetChinaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("China Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Asia/Shanghai");
        }
    }

    public async Task<TransactionDto?> GetTransactionByIdAsync(int id, int userId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.Category)
            .Include(t => t.AccountBook)
                .ThenInclude(ab => ab.Members)
            .Include(t => t.User)
            .Include(t => t.Allocations)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
            return null;

        // 验证权限
        if (transaction.AccountBook.Type == 0 && transaction.AccountBook.UserId != userId)
            return null;

        if (transaction.AccountBook.Type == 1 && !transaction.AccountBook.Members.Any(m => m.UserId == userId))
            return null;

        // 加载图片
        var images = await _context.TransactionImages
            .Where(img => img.TransactionId == id)
            .OrderBy(img => img.SortOrder)
            .Select(img => new TransactionImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                SortOrder = img.SortOrder,
                CreatedAt = img.CreatedAt
            })
            .ToListAsync();

        var allocationDtos = transaction.Allocations?
            .Select(a => new TransactionAllocationDto
            {
                UserId = a.UserId,
                UserName = a.User?.NickName ?? "未知",
                UserAvatar = a.User != null ? _ossService.GetAvailableImageUrl(a.User.AvatarUrl) : null,
                Amount = a.Amount.HasValue ? a.Amount.Value / 100.0m : (decimal?)null
            })
            .ToList() ?? new List<TransactionAllocationDto>();

        return new TransactionDto
        {
            Id = transaction.Id,
            AccountBookId = transaction.AccountBookId,
            AccountBookName = transaction.AccountBook?.Name ?? string.Empty,
            AccountBookType = transaction.AccountBook?.Type ?? 0,
            CategoryId = transaction.CategoryId,
            CategoryName = transaction.Category.Name,
            CategoryIcon = transaction.Category.Icon,
            CategoryColor = transaction.Category.Color,
            Amount = transaction.Amount / 100.0m,
            Type = transaction.Type,
            Remark = transaction.Remark,
            PaymentMethod = (int)transaction.PaymentMethod,
            PaymentMethodName = await GetPaymentMethodNameAsync((int)transaction.PaymentMethod),
            SpendingChannel = transaction.SpendingChannel,
            SpendingChannelName = await GetSpendingChannelNameAsync(transaction.SpendingChannel),
            Currency = (int)transaction.Currency,
            CurrencyName = GetCurrencyName(transaction.Currency),
            CurrencySymbol = GetCurrencySymbol(transaction.Currency),
            TransactionDate = transaction.TransactionDate,
            CreatedAt = transaction.CreatedAt,
            Images = images,
            UserId = transaction.User != null ? transaction.User.Id : (int?)null,
            UserName = transaction.User != null ? transaction.User.NickName : null,
            UserAvatar = transaction.User != null ? _ossService.GetAvailableImageUrl(transaction.User.AvatarUrl) : null,
            Allocations = allocationDtos
        };
    }

    public async Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionRequest request)
    {
        // 检查用户是否已授权
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new Exception("用户不存在");
        
        if (!user.IsAuthorized)
            throw new Exception("需要授权微信登录后才能使用记账功能");

        // 验证账本权限
        var accountBook = await _context.AccountBooks
            .Include(ab => ab.Members)
            .FirstOrDefaultAsync(ab => ab.Id == request.AccountBookId);

        if (accountBook == null)
            throw new Exception("账本不存在");

        // 个人账本：必须是所有者
        if (accountBook.Type == 0 && accountBook.UserId != userId)
            throw new Exception("无权限访问该账本");

        // 集体账本：必须是成员
        if (accountBook.Type == 1 && !accountBook.Members.Any(m => m.UserId == userId))
            throw new Exception("无权限访问该一起账本");

        // 验证分类
        await _categoryService.ValidateCategoryForTransactionAsync(userId, request.AccountBookId, request.CategoryId, request.Type);
        var category = await _context.Categories.FindAsync(request.CategoryId)
            ?? throw new Exception("分类不存在");

        if (!await _paymentMethodTypeService.IsValidPaymentMethodAsync(request.PaymentMethod))
            throw new Exception("支付方式无效或已停用");

        var spendingChannel = request.Type == 0 ? request.SpendingChannel : 0;
        if (!await _spendingChannelTypeService.IsValidSpendingChannelAsync(spendingChannel))
            throw new Exception("消费渠道无效或已停用");

        // 确保 TransactionDate 是 UTC 时间
        var transactionDate = request.TransactionDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(request.TransactionDate, DateTimeKind.Utc)
            : request.TransactionDate.ToUniversalTime();

        var transaction = new Transaction
        {
            AccountBookId = request.AccountBookId,
            UserId = userId, // 保存创建者ID
            CategoryId = request.CategoryId,
            Amount = (long)(request.Amount * 100), // 转换为分
            Type = request.Type,
            Remark = request.Remark,
            PaymentMethod = (PaymentMethod)request.PaymentMethod,
            SpendingChannel = spendingChannel,
            Currency = (Currency)request.Currency,
            TransactionDate = transactionDate,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();

        await InvalidateTransactionCachesAsync(request.AccountBookId, userId);

        // 保存图片
        if (request.ImageUrls != null && request.ImageUrls.Any())
        {
            var imgs = request.ImageUrls.Select((url, index) => new TransactionImage
            {
                TransactionId = transaction.Id,
                ImageUrl = url,
                SortOrder = index,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.TransactionImages.AddRange(imgs);
            await _context.SaveChangesAsync();
        }

        // 集体账本支出：保存分摊对象
        if (accountBook.Type == 1 && request.Type == 0 && request.AllocationUserIds != null && request.AllocationUserIds.Any())
        {
            var memberIds = new HashSet<int>(accountBook.Members.Select(m => m.UserId));
            var validIds = request.AllocationUserIds.Where(uid => memberIds.Contains(uid)).Distinct().ToList();
            if (validIds.Any())
            {
                var totalCents = transaction.Amount;
                var perPersonCents = totalCents / validIds.Count;
                var remainder = totalCents % validIds.Count;
                var allocationList = new List<TransactionAllocation>();
                for (var i = 0; i < validIds.Count; i++)
                {
                    var amount = perPersonCents + (i < remainder ? 1 : 0);
                    allocationList.Add(new TransactionAllocation
                    {
                        TransactionId = transaction.Id,
                        UserId = validIds[i],
                        Amount = amount,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                _context.TransactionAllocations.AddRange(allocationList);
                await _context.SaveChangesAsync();
            }
        }

        // 获取图片列表
        var images = await _context.TransactionImages
            .Where(img => img.TransactionId == transaction.Id)
            .OrderBy(img => img.SortOrder)
            .Select(img => new TransactionImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                SortOrder = img.SortOrder,
                CreatedAt = img.CreatedAt
            })
            .ToListAsync();

        // 加载分摊对象（集体账本）
        var allocationDtos = new List<TransactionAllocationDto>();
        if (accountBook.Type == 1)
        {
            var allocs = await _context.TransactionAllocations
                .Where(a => a.TransactionId == transaction.Id)
                .Include(a => a.User)
                .ToListAsync();
            allocationDtos = allocs.Select(a => new TransactionAllocationDto
            {
                UserId = a.UserId,
                UserName = a.User?.NickName ?? "未知",
                UserAvatar = a.User != null ? _ossService.GetAvailableImageUrl(a.User.AvatarUrl) : null,
                Amount = a.Amount.HasValue ? a.Amount.Value / 100.0m : (decimal?)null
            }).ToList();
        }

        return new TransactionDto
        {
            Id = transaction.Id,
            AccountBookId = transaction.AccountBookId,
            AccountBookName = accountBook.Name,
            AccountBookType = accountBook.Type,
            CategoryId = transaction.CategoryId,
            CategoryName = category.Name,
            CategoryIcon = category.Icon,
            CategoryColor = category.Color,
            Amount = request.Amount,
            Type = transaction.Type,
            Remark = transaction.Remark,
            PaymentMethod = (int)transaction.PaymentMethod,
            PaymentMethodName = await GetPaymentMethodNameAsync((int)transaction.PaymentMethod),
            SpendingChannel = transaction.SpendingChannel,
            SpendingChannelName = await GetSpendingChannelNameAsync(transaction.SpendingChannel),
            Currency = (int)transaction.Currency,
            CurrencyName = GetCurrencyName(transaction.Currency),
            CurrencySymbol = GetCurrencySymbol(transaction.Currency),
            TransactionDate = transaction.TransactionDate,
            CreatedAt = transaction.CreatedAt,
            Images = images,
            UserId = user != null ? user.Id : (int?)null,
            UserName = user != null ? user.NickName : null,
            UserAvatar = user != null ? _ossService.GetAvailableImageUrl(user.AvatarUrl) : null,
            Allocations = allocationDtos
        };
    }

    private async Task InvalidateTransactionCachesAsync(int accountBookId, int userId)
    {
        await _cacheHelper.InvalidateAccountBookAsync(accountBookId);
        await _cacheHelper.InvalidateUserOverviewAsync(userId);
    }

    public async Task<TransactionDto?> UpdateTransactionAsync(int id, int userId, UpdateTransactionRequest request)
    {
        var transaction = await _context.Transactions
            .Include(t => t.AccountBook)
                .ThenInclude(ab => ab.Members)
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
            return null;

        // 验证权限
        if (transaction.AccountBook.Type == 0 && transaction.AccountBook.UserId != userId)
            return null;

        if (transaction.AccountBook.Type == 1 && !transaction.AccountBook.Members.Any(m => m.UserId == userId))
            return null;

        // 验证分类
        await _categoryService.ValidateCategoryForTransactionAsync(userId, transaction.AccountBookId, request.CategoryId, transaction.Type);
        var category = await _context.Categories.FindAsync(request.CategoryId)
            ?? throw new Exception("分类不存在");

        if (!await _paymentMethodTypeService.IsValidPaymentMethodAsync(request.PaymentMethod))
            throw new Exception("支付方式无效或已停用");

        var spendingChannel = transaction.Type == 0 ? request.SpendingChannel : 0;
        if (!await _spendingChannelTypeService.IsValidSpendingChannelAsync(spendingChannel))
            throw new Exception("消费渠道无效或已停用");

        // 确保 TransactionDate 是 UTC 时间
        var transactionDate = request.TransactionDate.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(request.TransactionDate, DateTimeKind.Utc)
            : request.TransactionDate.ToUniversalTime();

        transaction.CategoryId = request.CategoryId;
        transaction.Amount = (long)(request.Amount * 100);
        transaction.Remark = request.Remark;
        transaction.PaymentMethod = (PaymentMethod)request.PaymentMethod;
        transaction.SpendingChannel = spendingChannel;
        transaction.Currency = (Currency)request.Currency;
        transaction.TransactionDate = transactionDate;
        transaction.UpdatedAt = DateTime.UtcNow;

        // 更新图片
        if (request.ImageUrls != null)
        {
            // 删除旧图片
            var oldImages = await _context.TransactionImages
                .Where(img => img.TransactionId == id)
                .ToListAsync();
            _context.TransactionImages.RemoveRange(oldImages);

            // 添加新图片
            if (request.ImageUrls.Any())
            {
                var newImages = request.ImageUrls.Select((url, index) => new TransactionImage
                {
                    TransactionId = id,
                    ImageUrl = url,
                    SortOrder = index,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.TransactionImages.AddRange(newImages);
            }
        }

        // 集体账本：更新分摊对象
        if (request.AllocationUserIds != null && transaction.AccountBook.Type == 1 && transaction.Type == 0)
        {
            var oldAllocs = await _context.TransactionAllocations.Where(a => a.TransactionId == id).ToListAsync();
            _context.TransactionAllocations.RemoveRange(oldAllocs);

            var memberIds = new HashSet<int>(transaction.AccountBook.Members.Select(m => m.UserId));
            var validIds = request.AllocationUserIds.Where(uid => memberIds.Contains(uid)).Distinct().ToList();
            if (validIds.Any())
            {
                var totalCents = transaction.Amount;
                var perPersonCents = totalCents / validIds.Count;
                var remainder = totalCents % validIds.Count;
                for (var i = 0; i < validIds.Count; i++)
                {
                    var amount = perPersonCents + (i < remainder ? 1 : 0);
                    _context.TransactionAllocations.Add(new TransactionAllocation
                    {
                        TransactionId = id,
                        UserId = validIds[i],
                        Amount = amount,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        await InvalidateTransactionCachesAsync(transaction.AccountBookId, userId);

        // 获取图片列表
        var images = await _context.TransactionImages
            .Where(img => img.TransactionId == id)
            .OrderBy(img => img.SortOrder)
            .Select(img => new TransactionImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                SortOrder = img.SortOrder,
                CreatedAt = img.CreatedAt
            })
            .ToListAsync();

        // 获取分摊对象
        var allocationDtos = new List<TransactionAllocationDto>();
        if (transaction.AccountBook.Type == 1)
        {
            var allocs = await _context.TransactionAllocations
                .Where(a => a.TransactionId == id)
                .Include(a => a.User)
                .ToListAsync();
            allocationDtos = allocs.Select(a => new TransactionAllocationDto
            {
                UserId = a.UserId,
                UserName = a.User?.NickName ?? "未知",
                UserAvatar = a.User != null ? _ossService.GetAvailableImageUrl(a.User.AvatarUrl) : null,
                Amount = a.Amount.HasValue ? a.Amount.Value / 100.0m : (decimal?)null
            }).ToList();
        }

        return new TransactionDto
        {
            Id = transaction.Id,
            AccountBookId = transaction.AccountBookId,
            AccountBookName = transaction.AccountBook?.Name ?? string.Empty,
            AccountBookType = transaction.AccountBook?.Type ?? 0,
            CategoryId = transaction.CategoryId,
            CategoryName = category.Name,
            CategoryIcon = category.Icon,
            CategoryColor = category.Color,
            Amount = request.Amount,
            Type = transaction.Type,
            Remark = transaction.Remark,
            PaymentMethod = (int)transaction.PaymentMethod,
            PaymentMethodName = await GetPaymentMethodNameAsync((int)transaction.PaymentMethod),
            SpendingChannel = transaction.SpendingChannel,
            SpendingChannelName = await GetSpendingChannelNameAsync(transaction.SpendingChannel),
            Currency = (int)transaction.Currency,
            CurrencyName = GetCurrencyName(transaction.Currency),
            CurrencySymbol = GetCurrencySymbol(transaction.Currency),
            TransactionDate = transaction.TransactionDate,
            CreatedAt = transaction.CreatedAt,
            Images = images,
            Allocations = allocationDtos
        };
    }

    public async Task<bool> DeleteTransactionAsync(int id, int userId)
    {
        var transaction = await _context.Transactions
            .Include(t => t.AccountBook)
                .ThenInclude(ab => ab.Members)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transaction == null)
            return false;

        // 验证权限
        if (transaction.AccountBook.Type == 0 && transaction.AccountBook.UserId != userId)
            return false;

        if (transaction.AccountBook.Type == 1 && !transaction.AccountBook.Members.Any(m => m.UserId == userId))
            return false;

        var accountBookId = transaction.AccountBookId;
        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
        await InvalidateTransactionCachesAsync(accountBookId, userId);
        return true;
    }
}

