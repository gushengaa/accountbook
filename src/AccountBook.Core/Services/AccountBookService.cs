using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

/// <summary>
/// 账本服务实现
/// </summary>
public class AccountBookService : IAccountBookService
{
    private readonly ApplicationDbContext _context;
    private readonly ICategoryService _categoryService;
    
    // 账本用途类型名称映射
    private static readonly Dictionary<int, string> CategoryNames = new()
    {
        { 0, "日常消费" },
        { 1, "旅行" },
        { 2, "装修" },
        { 3, "结婚" },
        { 4, "育儿" },
        { 5, "生意" },
        { 6, "家庭" },
        { 7, "活动" },
        { 99, "其他" }
    };
    
    private static string GetCategoryName(AccountBookCategory category)
    {
        return CategoryNames.TryGetValue((int)category, out var name) ? name : "其他";
    }

    public AccountBookService(ApplicationDbContext context, ICategoryService categoryService)
    {
        _context = context;
        _categoryService = categoryService;
    }

    public async Task<List<AccountBookDto>> GetAccountBooksByUserIdAsync(int userId)
    {
        var books = await _context.AccountBooks
            .Where(ab => ab.UserId == userId && ab.Type == 0)
            .Include(ab => ab.CategoryLinks)
            .OrderByDescending(ab => ab.IsDefault)
            .ThenByDescending(ab => ab.CreatedAt)
            .ToListAsync();
        
        return books.Select(ab => new AccountBookDto
        {
            Id = ab.Id,
            Name = ab.Name,
            Description = ab.Description,
            Type = ab.Type,
            Category = (int)ab.Category,
            CategoryName = GetCategoryName(ab.Category),
            UserId = ab.UserId,
            IsDefault = ab.IsDefault,
            DefaultCurrency = ab.DefaultCurrency,
            EnabledCurrencyIds = ParseEnabledCurrencyIds(ab.EnabledCurrencyIds),
            LinkedCategoryIds = ab.CategoryLinks?.Count > 0 ? ab.CategoryLinks.Select(cl => cl.CategoryId).ToList() : null,
            CreatedAt = ab.CreatedAt,
            Budget = ab.Budget.HasValue ? ab.Budget.Value / 100.0m : null
        }).ToList();
    }

    public async Task<AccountBookDto?> GetAccountBookByIdAsync(int id, int userId)
    {
        // 个人账本：必须是所有者
        // 集体账本：必须是成员
        var accountBook = await _context.AccountBooks
            .Include(ab => ab.User)
            .Include(ab => ab.Members)
                .ThenInclude(m => m.User)
            .Include(ab => ab.CategoryLinks)
            .FirstOrDefaultAsync(ab => ab.Id == id && 
                ((ab.Type == 0 && ab.UserId == userId) || 
                (ab.Type == 1 && ab.Members.Any(m => m.UserId == userId))));

        if (accountBook == null)
            return null;

        return MapToDto(accountBook);
    }
    
    private static List<int>? ParseEnabledCurrencyIds(string? enabledCurrencyIds)
    {
        if (string.IsNullOrWhiteSpace(enabledCurrencyIds))
            return null;
        var ids = enabledCurrencyIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
            .Where(v => v.HasValue)
            .Select(v => v!.Value)
            .ToList();
        return ids.Count > 0 ? ids : null;
    }

    private static string? SerializeEnabledCurrencyIds(List<int>? ids)
    {
        if (ids == null || ids.Count == 0)
            return null;
        return string.Join(",", ids);
    }

    private AccountBookDto MapToDto(AccountBook.Shared.Models.AccountBook accountBook)
    {
        return new AccountBookDto
        {
            Id = accountBook.Id,
            Name = accountBook.Name,
            Description = accountBook.Description,
            Type = accountBook.Type,
            Category = (int)accountBook.Category,
            CategoryName = GetCategoryName(accountBook.Category),
            UserId = accountBook.UserId,
            UserName = accountBook.User.NickName ?? "未知",
            UserAvatar = accountBook.User.AvatarUrl,
            IsDefault = accountBook.IsDefault,
            ShareCode = accountBook.ShareCode,
            Budget = accountBook.Budget.HasValue ? accountBook.Budget.Value / 100.0m : null,
            StartDate = accountBook.StartDate.HasValue?accountBook.StartDate.Value.AddHours(8):null,
            EndDate = accountBook.EndDate.HasValue ? accountBook.EndDate.Value.AddHours(8) : null,
            Status = accountBook.Status,
            DefaultCurrency = accountBook.DefaultCurrency,
            EnabledCurrencyIds = ParseEnabledCurrencyIds(accountBook.EnabledCurrencyIds),
            LinkedCategoryIds = accountBook.CategoryLinks?.Count > 0 ? accountBook.CategoryLinks.Select(cl => cl.CategoryId).ToList() : null,
            MemberCount = accountBook.Members.Count,
            CreatedAt = accountBook.CreatedAt,
            Members = accountBook.Members.Select(m => new MemberDto
            {
                Id = m.Id,
                UserId = m.UserId,
                UserName = m.User.NickName ?? "未知",
                UserAvatar = m.User.AvatarUrl,
                Role = m.Role,
                JoinedAt = m.JoinedAt
            }).ToList()
        };
    }

    public async Task<AccountBookDto> CreateAccountBookAsync(int userId, CreateAccountBookRequest request)
    {
        if (request.Type == 1)
            return await CreateSharedAccountBookInternalAsync(userId, request);

        // 个人账本
        if (request.IsDefault)
        {
            var defaultBooks = await _context.AccountBooks
                .Where(ab => ab.UserId == userId && ab.IsDefault)
                .ToListAsync();
            foreach (var book in defaultBooks)
            {
                book.IsDefault = false;
            }
        }

        var accountBook = new AccountBook.Shared.Models.AccountBook
        {
            Name = request.Name,
            Description = request.Description,
            Type = 0,
            Category = (AccountBookCategory)request.Category,
            UserId = userId,
            IsDefault = request.IsDefault,
            Budget = request.Budget.HasValue ? (long)(request.Budget.Value * 100) : null,
            DefaultCurrency = request.DefaultCurrency,
            EnabledCurrencyIds = SerializeEnabledCurrencyIds(request.EnabledCurrencyIds),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AccountBooks.Add(accountBook);
        await _context.SaveChangesAsync();

        await AddLinkedCategoryIdsAsync(accountBook.Id, request.LinkedCategoryIds);
        await _categoryService.SyncUserCustomCategoriesToBookAsync(userId, accountBook.Id);

        var createdBook = await _context.AccountBooks
            .Include(ab => ab.User)
            .Include(ab => ab.Members)
                .ThenInclude(m => m.User)
            .Include(ab => ab.CategoryLinks)
            .FirstOrDefaultAsync(ab => ab.Id == accountBook.Id);

        return createdBook != null ? MapToDto(createdBook) : throw new Exception("创建失败");
    }

    private async Task AddLinkedCategoryIdsAsync(int accountBookId, List<int>? linkedCategoryIds)
    {
        if (linkedCategoryIds == null || linkedCategoryIds.Count == 0) return;
        var links = linkedCategoryIds.Distinct()
            .Select((cid, index) => new AccountBookCategoryLink
            {
                AccountBookId = accountBookId,
                CategoryId = cid,
                SortOrder = index,
                CreatedAt = DateTime.UtcNow
            })
            .ToList();
        _context.AccountBookCategoryLinks.AddRange(links);
        await _context.SaveChangesAsync();
    }

    private async Task<AccountBookDto> CreateSharedAccountBookInternalAsync(int userId, CreateAccountBookRequest request)
    {
        var shareCode = GenerateShareCode();

        var accountBook = new AccountBook.Shared.Models.AccountBook
        {
            Name = request.Name,
            Description = request.Description,
            Type = 1,
            Category = (AccountBookCategory)request.Category,
            UserId = userId,
            ShareCode = shareCode,
            Budget = request.Budget.HasValue ? (long)(request.Budget.Value * 100) : null,
            StartDate = request.StartDate?.ToUniversalTime(),
            EndDate = request.EndDate?.ToUniversalTime(),
            Status = 0,
            DefaultCurrency = request.DefaultCurrency,
            EnabledCurrencyIds = SerializeEnabledCurrencyIds(request.EnabledCurrencyIds),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AccountBooks.Add(accountBook);
        await _context.SaveChangesAsync();

        var creatorMember = new AccountBookMember
        {
            AccountBookId = accountBook.Id,
            UserId = userId,
            Role = 1,
            JoinedAt = DateTime.UtcNow
        };
        _context.AccountBookMembers.Add(creatorMember);
        await _context.SaveChangesAsync();

        await AddLinkedCategoryIdsAsync(accountBook.Id, request.LinkedCategoryIds);
        await _categoryService.SyncUserCustomCategoriesToBookAsync(userId, accountBook.Id);

        return await GetAccountBookByIdAsync(accountBook.Id, userId) ?? throw new Exception("创建失败");
    }

    public async Task<AccountBookDto?> UpdateAccountBookAsync(int id, int userId, UpdateAccountBookRequest request)
    {
        var accountBook = await _context.AccountBooks
            .FirstOrDefaultAsync(ab => ab.Id == id && ab.UserId == userId);

        if (accountBook == null)
            return null;

        accountBook.Name = request.Name;
        accountBook.Description = request.Description;
        if (request.IsDefault.HasValue && accountBook.Type == 0)
            accountBook.IsDefault = request.IsDefault.Value;
        if (request.Budget.HasValue)
            accountBook.Budget = (long)(request.Budget.Value * 100);
        if (request.StartDate.HasValue && accountBook.Type == 1)
            accountBook.StartDate = request.StartDate.Value.ToUniversalTime();
        if (request.EndDate.HasValue && accountBook.Type == 1)
            accountBook.EndDate = request.EndDate.Value.ToUniversalTime();
        if (request.Status.HasValue && accountBook.Type == 1)
            accountBook.Status = request.Status.Value;
        if (request.Category.HasValue)
            accountBook.Category = (AccountBookCategory)request.Category.Value;
        if (request.DefaultCurrency.HasValue)
            accountBook.DefaultCurrency = request.DefaultCurrency.Value;
        if (request.EnabledCurrencyIds != null)
            accountBook.EnabledCurrencyIds = SerializeEnabledCurrencyIds(request.EnabledCurrencyIds);
        if (request.LinkedCategoryIds != null)
        {
            var oldLinks = await _context.AccountBookCategoryLinks.Where(cl => cl.AccountBookId == id).ToListAsync();
            _context.AccountBookCategoryLinks.RemoveRange(oldLinks);
            var ids = request.LinkedCategoryIds.Distinct().ToList();
            if (ids.Count > 0)
            {
                var links = ids.Select((cid, index) => new AccountBookCategoryLink
                {
                    AccountBookId = id,
                    CategoryId = cid,
                    SortOrder = index,
                    CreatedAt = DateTime.UtcNow
                }).ToList();
                _context.AccountBookCategoryLinks.AddRange(links);
            }
        }
        accountBook.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var updatedBook = await _context.AccountBooks
            .Include(ab => ab.User)
            .Include(ab => ab.Members)
                .ThenInclude(m => m.User)
            .Include(ab => ab.CategoryLinks)
            .FirstOrDefaultAsync(ab => ab.Id == id);

        return updatedBook != null ? MapToDto(updatedBook) : null;
    }

    public async Task<bool> DeleteAccountBookAsync(int id, int userId)
    {
        var accountBook = await _context.AccountBooks
            .FirstOrDefaultAsync(ab => ab.Id == id && ab.UserId == userId);

        if (accountBook == null)
            return false;

        // 不能删除默认账本
        if (accountBook.IsDefault)
        {
            throw new Exception("不能删除默认账本");
        }

        _context.AccountBooks.Remove(accountBook);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetDefaultAccountBookAsync(int id, int userId)
    {
        var accountBook = await _context.AccountBooks
            .FirstOrDefaultAsync(ab => ab.Id == id && ab.UserId == userId);

        if (accountBook == null)
            return false;

        // 取消其他默认账本
        var defaultBooks = await _context.AccountBooks
            .Where(ab => ab.UserId == userId && ab.IsDefault && ab.Id != id)
            .ToListAsync();
        foreach (var book in defaultBooks)
        {
            book.IsDefault = false;
        }

        accountBook.IsDefault = true;
        accountBook.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<AccountBookDto>> GetSharedAccountBooksByUserIdAsync(int userId)
    {
        // 先加载数据到内存
        var members = await _context.AccountBookMembers
            .Where(m => m.UserId == userId)
            .Include(m => m.AccountBook)
                .ThenInclude(ab => ab.User)
            .Include(m => m.AccountBook)
                .ThenInclude(ab => ab.Members)
                    .ThenInclude(mem => mem.User)
            .Include(m => m.AccountBook)
                .ThenInclude(ab => ab.CategoryLinks)
            .Where(m => m.AccountBook.Type == 1) // 只获取集体账本
            .ToListAsync();
        
        // 在内存中转换为 DTO
        var accountBooks = members
            .Select(m => m.AccountBook)
            .Distinct()
            .OrderByDescending(ab => ab.CreatedAt)
            .Select(ab => MapToDto(ab))
            .ToList();
        
        return accountBooks;
    }

    public async Task<AccountBookDto> JoinSharedAccountBookAsync(int userId, JoinSharedAccountBookRequest request)
    {
        var accountBook = await _context.AccountBooks
            .FirstOrDefaultAsync(ab => ab.ShareCode == request.ShareCode && ab.Type == 1);

        if (accountBook == null)
            throw new Exception("分享码无效");

        // 检查是否已经是成员
        var existingMember = await _context.AccountBookMembers
            .FirstOrDefaultAsync(m => m.AccountBookId == accountBook.Id && m.UserId == userId);

        if (existingMember != null)
            throw new Exception("您已经是该账本的成员");

        var member = new AccountBookMember
        {
            AccountBookId = accountBook.Id,
            UserId = userId,
            Role = 0, // 普通成员
            JoinedAt = DateTime.UtcNow
        };

        _context.AccountBookMembers.Add(member);
        await _context.SaveChangesAsync();

        return await GetAccountBookByIdAsync(accountBook.Id, userId) ?? throw new Exception("加入失败");
    }

    public async Task<bool> RemoveMemberAsync(int accountBookId, int memberUserId, int operatorUserId)
    {
        // 验证操作者权限
        var operatorMember = await _context.AccountBookMembers
            .FirstOrDefaultAsync(m => m.AccountBookId == accountBookId && m.UserId == operatorUserId);

        if (operatorMember == null || operatorMember.Role == 0)
            return false;

        // 不能移除创建者
        var accountBook = await _context.AccountBooks.FindAsync(accountBookId);
        if (accountBook?.UserId == memberUserId)
            throw new Exception("不能移除创建者");

        var member = await _context.AccountBookMembers
            .FirstOrDefaultAsync(m => m.AccountBookId == accountBookId && m.UserId == memberUserId);

        if (member == null)
            return false;

        _context.AccountBookMembers.Remove(member);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<SharedAccountBookStatisticsDto> GetSharedAccountBookStatisticsAsync(int id, int userId)
    {
        // 验证用户是否是成员
        var isMember = await _context.AccountBookMembers
            .AnyAsync(m => m.AccountBookId == id && m.UserId == userId);

        if (!isMember)
            throw new Exception("无权限访问");

        var accountBook = await _context.AccountBooks
            .Include(ab => ab.Transactions)
                .ThenInclude(t => t.Category)
            .Include(ab => ab.Members)
            .FirstOrDefaultAsync(ab => ab.Id == id && ab.Type == 1);

        if (accountBook == null)
            throw new Exception("账本不存在");

        var transactions = accountBook.Transactions.Where(t => t.Type == 0).ToList(); // 只统计支出
        var totalExpense = transactions.Any() ? transactions.Sum(t => t.Amount) / 100.0m : 0;
        var memberCount = accountBook.Members.Count;
        var averagePerPerson = memberCount > 0 ? totalExpense / memberCount : 0;
        var totalAmount = transactions.Any() ? transactions.Sum(t => t.Amount) : 0;

        // 按分类统计
        var categoryStats = transactions
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.Icon, t.Category.Color })
            .Select(g => new CategoryStatisticsDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.Name,
                CategoryIcon = g.Key.Icon,
                CategoryColor = g.Key.Color,
                Amount = g.Sum(t => t.Amount) / 100.0m,
                Percentage = totalAmount > 0 ? (double)(g.Sum(t => t.Amount) * 100.0 / totalAmount) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return new SharedAccountBookStatisticsDto
        {
            TotalExpense = totalExpense,
            TotalIncome = 0,
            Balance = totalExpense,
            Budget = accountBook.Budget.HasValue ? accountBook.Budget.Value / 100.0m : null,
            BudgetRemaining = accountBook.Budget.HasValue ? (accountBook.Budget.Value / 100.0m - totalExpense) : null,
            AveragePerPerson = averagePerPerson,
            MemberCount = memberCount,
            CategoryStatistics = categoryStats
        };
    }

    public async Task<SharedAccountBookReportDto> GenerateSharedAccountBookReportAsync(int id, int userId)
    {
        // 验证用户是否是成员
        var isMember = await _context.AccountBookMembers
            .AnyAsync(m => m.AccountBookId == id && m.UserId == userId);

        if (!isMember)
            throw new Exception("无权限访问");

        // 加载账本信息
        var accountBook = await _context.AccountBooks
            .Include(ab => ab.User)
            .Include(ab => ab.Members)
                .ThenInclude(m => m.User)
            .Include(ab => ab.Transactions)
                .ThenInclude(t => t.Category)
            .Include(ab => ab.Transactions)
                .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(ab => ab.Id == id && ab.Type == 1);

        if (accountBook == null)
            throw new Exception("账本不存在");

        // 获取账本DTO
        var accountBookDto = MapToDto(accountBook);

        // 获取所有交易记录
        var transactionIds = accountBook.Transactions.Select(t => t.Id).ToList();
        var transactions = accountBook.Transactions
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                AccountBookId = t.AccountBookId,
                AccountBookName = accountBook.Name,
                AccountBookType = 1,
                CategoryId = t.CategoryId,
                CategoryName = t.Category.Name,
                CategoryIcon = t.Category.Icon,
                CategoryColor = t.Category.Color,
                Amount = t.Amount / 100.0m,
                Type = t.Type,
                Remark = t.Remark,
                TransactionDate = t.TransactionDate,
                CreatedAt = t.CreatedAt,
                UserId = t.User?.Id,
                UserName = t.User?.NickName,
                UserAvatar = t.User?.AvatarUrl
            })
            .ToList();

        // 为每条支出交易填充分摊成员（供报告展示）
        var userIdToName = accountBook.Members.ToDictionary(m => m.UserId, m => m.User?.NickName ?? "未知");
        var allocationsByTid = new Dictionary<int, List<AccountBook.Shared.Models.TransactionAllocation>>();

        // 根据分摊表汇总每位成员的分摊后支出
        var expenseTransactionIds = accountBook.Transactions.Where(t => t.Type == 0).Select(t => t.Id).ToList();
        var allocations = expenseTransactionIds.Count > 0
            ? await _context.TransactionAllocations
                .Where(a => expenseTransactionIds.Contains(a.TransactionId))
                .ToListAsync()
            : new List<AccountBook.Shared.Models.TransactionAllocation>();
        var transactionAmounts = accountBook.Transactions
            .Where(t => t.Type == 0)
            .ToDictionary(t => t.Id, t => t.Amount / 100.0m);
        var memberAllocatedExpense = new Dictionary<int, decimal>();
        foreach (var g in allocations.GroupBy(a => a.TransactionId))
        {
            var amount = transactionAmounts.TryGetValue(g.Key, out var amt) ? amt : 0;
            var list = g.ToList();
            var count = list.Count;
            foreach (var a in list)
            {
                var share = a.Amount.HasValue ? a.Amount.Value / 100.0m : (count > 0 ? amount / count : 0);
                memberAllocatedExpense.TryGetValue(a.UserId, out var cur);
                memberAllocatedExpense[a.UserId] = cur + share;
            }
        }
        var totalAllocatedExpense = memberAllocatedExpense.Values.Sum();

        foreach (var g in allocations.GroupBy(a => a.TransactionId))
            allocationsByTid[g.Key] = g.ToList();
        foreach (var t in transactions)
        {
            if (t.Type == 0 && allocationsByTid.TryGetValue(t.Id, out var list))
            {
                t.Allocations = list.Select(a => new TransactionAllocationDto
                {
                    UserId = a.UserId,
                    UserName = userIdToName.TryGetValue(a.UserId, out var name) ? name : "未知"
                }).ToList();
            }
        }

        // 计算总支出和总收入
        var totalExpense = transactions.Where(t => t.Type == 0).Sum(t => t.Amount);
        var totalIncome = transactions.Where(t => t.Type == 1).Sum(t => t.Amount);
        var balance = totalIncome - totalExpense;

        // 按分类统计支出
        var expenseTransactions = transactions.Where(t => t.Type == 0).ToList();
        var expenseTotalAmount = expenseTransactions.Sum(t => t.Amount);
        var expenseCategoryStats = expenseTransactions
            .GroupBy(t => new { t.CategoryId, t.CategoryName, t.CategoryIcon, t.CategoryColor })
            .Select(g => new CategoryStatisticsDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.CategoryName,
                CategoryIcon = g.Key.CategoryIcon,
                CategoryColor = g.Key.CategoryColor,
                Amount = g.Sum(t => t.Amount),
                Percentage = expenseTotalAmount > 0 ? (double)(g.Sum(t => t.Amount) * 100.0m / expenseTotalAmount) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        // 按分类统计收入
        var incomeTransactions = transactions.Where(t => t.Type == 1).ToList();
        var incomeTotalAmount = incomeTransactions.Sum(t => t.Amount);
        var incomeCategoryStats = incomeTransactions
            .GroupBy(t => new { t.CategoryId, t.CategoryName, t.CategoryIcon, t.CategoryColor })
            .Select(g => new CategoryStatisticsDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.CategoryName,
                CategoryIcon = g.Key.CategoryIcon,
                CategoryColor = g.Key.CategoryColor,
                Amount = g.Sum(t => t.Amount),
                Percentage = incomeTotalAmount > 0 ? (double)(g.Sum(t => t.Amount) * 100.0m / incomeTotalAmount) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        // 按成员统计（支出含分摊后支出）
        var memberCount = accountBook.Members.Count;
        var memberStats = accountBook.Members
            .Select(m => new MemberStatisticsDto
            {
                UserId = m.UserId,
                UserName = m.User.NickName ?? "未知",
                UserAvatar = m.User.AvatarUrl,
                TotalExpense = transactions.Where(t => t.Type == 0 && t.UserId == m.UserId).Sum(t => t.Amount),
                TotalIncome = transactions.Where(t => t.Type == 1 && t.UserId == m.UserId).Sum(t => t.Amount),
                Balance = transactions.Where(t => t.UserId == m.UserId).Sum(t => t.Type == 1 ? t.Amount : -t.Amount),
                AllocatedExpense = memberAllocatedExpense.TryGetValue(m.UserId, out var alloc) ? alloc : 0,
                TransactionCount = transactions.Count(t => t.UserId == m.UserId)
            })
            .OrderByDescending(m => m.AllocatedExpense + m.TotalIncome)
            .ToList();

        // 人均数据：支出按分摊后人均
        var averageExpensePerPerson = memberCount > 0 ? totalAllocatedExpense / memberCount : 0;
        var averageIncomePerPerson = memberCount > 0 ? totalIncome / memberCount : 0;

        return new SharedAccountBookReportDto
        {
            AccountBook = accountBookDto,
            AllTransactions = transactions,
            ExpenseCategoryStatistics = expenseCategoryStats,
            IncomeCategoryStatistics = incomeCategoryStats,
            MemberStatistics = memberStats,
            TotalExpense = totalExpense,
            TotalIncome = totalIncome,
            Balance = balance,
            AverageExpensePerPerson = averageExpensePerPerson,
            AverageIncomePerPerson = averageIncomePerPerson,
            GeneratedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// 生成分享码（6位数字字母组合）
    /// </summary>
    private string GenerateShareCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string shareCode;
        
        do
        {
            shareCode = new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        } while (_context.AccountBooks.Any(ab => ab.ShareCode == shareCode));

        return shareCode;
    }
}

