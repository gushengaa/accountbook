using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

public class BookPurposeCategoryService : IBookPurposeCategoryService
{
    private readonly ApplicationDbContext _context;

    private static readonly Dictionary<int, string> PurposeNames = new()
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

    public BookPurposeCategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<List<BookPurposeOptionDto>> GetPurposeOptionsAsync()
    {
        var list = PurposeNames
            .OrderBy(kv => kv.Key == 99 ? 100 : kv.Key)
            .Select(kv => new BookPurposeOptionDto { Purpose = kv.Key, Name = kv.Value })
            .ToList();
        return Task.FromResult(list);
    }

    public async Task<BookPurposeCategoryConfigDto> GetAdminConfigAsync(int purpose)
    {
        EnsureValidPurpose(purpose);

        var links = await _context.BookPurposeCategoryLinks
            .Where(l => l.Purpose == purpose)
            .Include(l => l.Category)
            .OrderBy(l => l.Category.Type)
            .ThenBy(l => l.Category.SortOrder)
            .ThenBy(l => l.Category.Name)
            .ToListAsync();

        var parentIds = links
            .Where(l => l.Category.ParentId.HasValue)
            .Select(l => l.Category.ParentId!.Value)
            .Distinct()
            .ToList();

        var parentNames = parentIds.Count == 0
            ? new Dictionary<int, string>()
            : await _context.Categories
                .Where(c => parentIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c.Name);

        return new BookPurposeCategoryConfigDto
        {
            Purpose = purpose,
            PurposeName = GetPurposeName(purpose),
            Categories = links.Select(l => new BookPurposeCategoryItemDto
            {
                Id = l.CategoryId,
                Name = l.Category.Name,
                Icon = l.Category.Icon,
                Type = l.Category.Type,
                ParentId = l.Category.ParentId,
                ParentName = l.Category.ParentId.HasValue && parentNames.TryGetValue(l.Category.ParentId.Value, out var pn)
                    ? pn
                    : null
            }).ToList()
        };
    }

    public async Task<BookPurposeCategoryIdsDto> GetCategoryIdsByPurposeAsync(int purpose)
    {
        EnsureValidPurpose(purpose);

        var ids = await _context.BookPurposeCategoryLinks
            .Where(l => l.Purpose == purpose)
            .Select(l => l.CategoryId)
            .Distinct()
            .ToListAsync();

        return new BookPurposeCategoryIdsDto
        {
            Purpose = purpose,
            CategoryIds = ids
        };
    }

    public async Task<BookPurposeCategoryConfigDto> SavePurposeCategoriesAsync(int purpose, SaveBookPurposeCategoriesRequest request)
    {
        EnsureValidPurpose(purpose);

        var categoryIds = (request.CategoryIds ?? new List<int>()).Distinct().ToList();
        if (categoryIds.Count > 0)
        {
            var categories = await _context.Categories
                .Where(c => categoryIds.Contains(c.Id))
                .ToListAsync();

            if (categories.Count != categoryIds.Count)
                throw new InvalidOperationException("存在无效的分类 ID");

            foreach (var cat in categories)
            {
                if (cat.UserId != 0)
                    throw new InvalidOperationException($"「{cat.Name}」不是系统默认分类，不能关联到账本用途");
                if (cat.ParentId == null)
                    throw new InvalidOperationException($"「{cat.Name}」是一级分类，请选择二级分类");
            }
        }

        var oldLinks = await _context.BookPurposeCategoryLinks
            .Where(l => l.Purpose == purpose)
            .ToListAsync();
        _context.BookPurposeCategoryLinks.RemoveRange(oldLinks);

        if (categoryIds.Count > 0)
        {
            var now = DateTime.UtcNow;
            _context.BookPurposeCategoryLinks.AddRange(categoryIds.Select(cid => new BookPurposeCategoryLink
            {
                Purpose = purpose,
                CategoryId = cid,
                CreatedAt = now
            }));
        }

        await _context.SaveChangesAsync();
        return await GetAdminConfigAsync(purpose);
    }

    private static void EnsureValidPurpose(int purpose)
    {
        if (!PurposeNames.ContainsKey(purpose))
            throw new InvalidOperationException("无效的账本用途");
    }

    private static string GetPurposeName(int purpose)
    {
        return PurposeNames.TryGetValue(purpose, out var name) ? name : "其他";
    }
}
