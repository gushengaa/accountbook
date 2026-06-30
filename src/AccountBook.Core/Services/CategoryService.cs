using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

/// <summary>
/// 分类服务实现
/// </summary>
public class CategoryService : ICategoryService
{
    public const string UserCustomRootName = "我的分类";

    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(int userId, int? type = null, int? accountBookId = null)
    {
        var query = _context.Categories
            .Where(c => c.UserId != 0 || c.IsVisible)
            .Where(c => c.UserId == 0 || c.UserId == userId)
            .Where(c => !c.IsUserCustomRoot || c.UserId == userId);

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        var allCategories = await query
            .OrderBy(c => c.UserId)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                Color = c.Color,
                Type = c.Type,
                SortOrder = c.SortOrder,
                ParentId = c.ParentId,
                IsVisible = c.UserId != 0 || c.IsVisible,
                IsUserCustom = c.UserId != 0 && !c.IsUserCustomRoot,
                IsUserCustomRoot = c.IsUserCustomRoot
            })
            .ToListAsync();

        Dictionary<int, int>? linkSortMap = null;
        HashSet<int>? linkedIds = null;
        if (accountBookId.HasValue)
        {
            var links = await _context.AccountBookCategoryLinks
                .Where(cl => cl.AccountBookId == accountBookId.Value)
                .ToListAsync();
            if (links.Count > 0)
            {
                linkedIds = new HashSet<int>(links.Select(l => l.CategoryId));
                linkSortMap = links.ToDictionary(l => l.CategoryId, l => l.SortOrder);
            }
        }

        if (linkedIds != null)
        {
            var keepIds = new HashSet<int>(linkedIds);
            foreach (var c in allCategories.Where(c => c.ParentId.HasValue && linkedIds.Contains(c.Id)))
            {
                if (c.ParentId.HasValue)
                    keepIds.Add(c.ParentId.Value);
            }
            allCategories = allCategories.Where(c => keepIds.Contains(c.Id)).ToList();
        }

        int SortKey(int categoryId, int fallback)
        {
            if (linkSortMap != null && linkSortMap.TryGetValue(categoryId, out var s))
                return s;
            return fallback;
        }

        var parentCategories = allCategories.Where(c => c.ParentId == null).ToList();
        var childCategories = allCategories.Where(c => c.ParentId != null).ToList();

        foreach (var parent in parentCategories)
        {
            parent.Children = childCategories
                .Where(c => c.ParentId == parent.Id)
                .OrderBy(c => c.IsUserCustom ? 0 : 1)
                .ThenBy(c => SortKey(c.Id, c.SortOrder))
                .ThenBy(c => c.Name)
                .ToList();
        }

        parentCategories = parentCategories
            .OrderBy(p => p.IsUserCustomRoot ? 0 : 1)
            .ThenBy(p => SortKey(p.Id, p.Children?.Count > 0
                ? p.Children.Min(ch => SortKey(ch.Id, ch.SortOrder))
                : p.SortOrder))
            .ToList();

        if (linkedIds != null)
            parentCategories = parentCategories.Where(p => p.IsUserCustomRoot || (p.Children?.Count ?? 0) > 0).ToList();

        return parentCategories;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesFlatAsync(int userId, int? type = null)
    {
        var query = _context.Categories
            .Where(c => c.UserId != 0 || c.IsVisible)
            .Where(c => c.UserId == 0 || c.UserId == userId)
            .Where(c => !c.IsUserCustomRoot);

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        return await query
            .OrderBy(c => c.UserId != 0 ? 0 : 1)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                Color = c.Color,
                Type = c.Type,
                SortOrder = c.SortOrder,
                ParentId = c.ParentId,
                IsVisible = c.UserId != 0 || c.IsVisible,
                IsUserCustom = c.UserId != 0,
                IsUserCustomRoot = false
            })
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return null;

        return MapCategoryDto(category);
    }

    public async Task<CategoryDto> CreateCategoryAsync(int userId, CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Icon = request.Icon,
            Color = request.Color,
            Type = request.Type,
            UserId = userId,
            SortOrder = request.SortOrder,
            ParentId = request.ParentId,
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return MapCategoryDto(category);
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(int id, int userId, CreateCategoryRequest request)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null)
            return null;

        category.Name = request.Name;
        category.Icon = request.Icon;
        category.Color = request.Color;
        category.Type = request.Type;
        category.ParentId = request.ParentId;
        category.SortOrder = request.SortOrder;

        await _context.SaveChangesAsync();

        return MapCategoryDto(category);
    }

    public async Task<bool> DeleteCategoryAsync(int id, int userId)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

        if (category == null)
            return false;

        var hasTransactions = await _context.Transactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            throw new Exception("该分类已被使用，无法删除");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CanManageBookCategoriesAsync(int userId, int accountBookId)
    {
        var book = await _context.AccountBooks.AsNoTracking()
            .FirstOrDefaultAsync(ab => ab.Id == accountBookId);
        if (book == null)
            return false;
        return book.UserId == userId;
    }

    public async Task<List<BookCategoryManageItemDto>> GetBookCategoriesManageAsync(int userId, int accountBookId, int type)
    {
        if (!await CanManageBookCategoriesAsync(userId, accountBookId))
            throw new UnauthorizedAccessException("无权限管理该账本分类");

        await EnsureBookCategoryLinksMaterializedAsync(accountBookId, userId, type);

        var tree = await GetCategoriesAsync(userId, type, accountBookId);
        var linkSortMap = await GetLinkSortMapAsync(accountBookId);
        var usedIds = await GetUsedCategoryIdsAsync(tree);

        var parentNameMap = tree.ToDictionary(p => p.Id, p => p.Name);
        var items = new List<BookCategoryManageItemDto>();

        foreach (var parent in tree)
        {
            if (parent.Children != null && parent.Children.Count > 0)
            {
                foreach (var child in parent.Children)
                {
                    items.Add(new BookCategoryManageItemDto
                    {
                        Id = child.Id,
                        Name = child.Name,
                        Icon = child.Icon,
                        Color = child.Color,
                        Type = child.Type,
                        ParentId = parent.Id,
                        ParentName = parent.Name,
                        IsUserCustom = child.IsUserCustom,
                        IsUserCustomRoot = false,
                        IsUsed = usedIds.Contains(child.Id),
                        SortOrder = linkSortMap.TryGetValue(child.Id, out var s) ? s : child.SortOrder
                    });
                }
            }
            else if (!parent.IsUserCustomRoot)
            {
                items.Add(new BookCategoryManageItemDto
                {
                    Id = parent.Id,
                    Name = parent.Name,
                    Icon = parent.Icon,
                    Color = parent.Color,
                    Type = parent.Type,
                    ParentId = null,
                    ParentName = null,
                    IsUserCustom = parent.IsUserCustom,
                    IsUserCustomRoot = false,
                    IsUsed = usedIds.Contains(parent.Id),
                    SortOrder = linkSortMap.TryGetValue(parent.Id, out var s) ? s : parent.SortOrder
                });
            }
        }

        return items.OrderBy(i => i.SortOrder).ThenBy(i => i.Name).ToList();
    }

    public async Task<CategoryDto> CreateBookCustomCategoryAsync(int userId, int accountBookId, CreateBookCustomCategoryRequest request)
    {
        if (!await CanManageBookCategoriesAsync(userId, accountBookId))
            throw new UnauthorizedAccessException("无权限管理该账本分类");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("分类名称不能为空");

        await EnsureBookCategoryLinksMaterializedAsync(accountBookId, userId, request.Type);

        var root = await GetOrCreateUserCustomRootAsync(userId, request.Type);
        var maxSort = await _context.Categories
            .Where(c => c.UserId == userId && c.ParentId == root.Id)
            .Select(c => (int?)c.SortOrder)
            .MaxAsync() ?? 0;

        var category = new Category
        {
            Name = request.Name.Trim(),
            Icon = string.IsNullOrWhiteSpace(request.Icon) ? "📝" : request.Icon.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#F5A623" : request.Color.Trim(),
            Type = request.Type,
            UserId = userId,
            ParentId = root.Id,
            SortOrder = maxSort + 1,
            IsVisible = true,
            IsUserCustomRoot = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        await PrependCategoryLinksAsync(accountBookId, new[] { root.Id, category.Id });

        return MapCategoryDto(category);
    }

    public async Task RemoveCategoryFromBookAsync(int userId, int accountBookId, int categoryId)
    {
        if (!await CanManageBookCategoriesAsync(userId, accountBookId))
            throw new UnauthorizedAccessException("无权限管理该账本分类");

        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
            throw new InvalidOperationException("分类不存在");
        if (category.IsUserCustomRoot)
            throw new InvalidOperationException("不能删除「我的分类」分组");

        var categoryType = category.ParentId.HasValue
            ? (await _context.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == category.ParentId))?.Type ?? category.Type
            : category.Type;

        await EnsureBookCategoryLinksMaterializedAsync(accountBookId, userId, categoryType);

        if (category.UserId == 0)
        {
            var link = await _context.AccountBookCategoryLinks
                .FirstOrDefaultAsync(cl => cl.AccountBookId == accountBookId && cl.CategoryId == categoryId);
            if (link != null)
            {
                _context.AccountBookCategoryLinks.Remove(link);
                await _context.SaveChangesAsync();
            }
            return;
        }

        if (category.UserId != userId)
            throw new UnauthorizedAccessException("无权删除该分类");

        if (await _context.Transactions.AnyAsync(t => t.CategoryId == categoryId))
            throw new InvalidOperationException("该分类已被使用，无法删除");

        var allLinks = await _context.AccountBookCategoryLinks
            .Where(cl => cl.CategoryId == categoryId)
            .ToListAsync();
        _context.AccountBookCategoryLinks.RemoveRange(allLinks);
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
    }

    public async Task ReorderBookCategoriesAsync(int userId, int accountBookId, ReorderBookCategoriesRequest request)
    {
        if (!await CanManageBookCategoriesAsync(userId, accountBookId))
            throw new UnauthorizedAccessException("无权限管理该账本分类");

        await EnsureBookCategoryLinksMaterializedAsync(accountBookId, userId, request.Type);

        var links = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId)
            .ToListAsync();
        var linkByCategoryId = links.ToDictionary(l => l.CategoryId);

        for (var i = 0; i < request.CategoryIds.Count; i++)
        {
            var categoryId = request.CategoryIds[i];
            if (linkByCategoryId.TryGetValue(categoryId, out var link))
                link.SortOrder = i;
        }

        await _context.SaveChangesAsync();
    }

    public async Task SyncUserCustomCategoriesToBookAsync(int userId, int accountBookId)
    {
        var customCategories = await _context.Categories
            .Where(c => c.UserId == userId && !c.IsUserCustomRoot && c.ParentId != null)
            .ToListAsync();

        if (customCategories.Count == 0)
            return;

        var parentIds = customCategories.Select(c => c.ParentId!.Value).Distinct().ToList();
        var allIds = customCategories.Select(c => c.Id).Concat(parentIds).Distinct().ToList();

        var existing = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId && allIds.Contains(cl.CategoryId))
            .Select(cl => cl.CategoryId)
            .ToListAsync();
        var existingSet = new HashSet<int>(existing);

        var toAdd = allIds.Where(id => !existingSet.Contains(id)).ToList();
        if (toAdd.Count == 0)
            return;

        await PrependCategoryLinksAsync(accountBookId, toAdd);
    }

    public async Task ValidateCategoryForTransactionAsync(int userId, int accountBookId, int categoryId, int transactionType)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
            throw new InvalidOperationException("分类不存在");
        if (category.IsUserCustomRoot)
            throw new InvalidOperationException("请选择具体分类");
        if (category.UserId == 0 && !category.IsVisible)
            throw new InvalidOperationException("该分类已停用，请重新选择分类");
        if (category.UserId != 0 && category.UserId != userId)
            throw new InvalidOperationException("无权使用该分类");
        if (category.Type != transactionType)
            throw new InvalidOperationException("分类收支类型与交易不一致");

        var hasLinks = await _context.AccountBookCategoryLinks.AnyAsync(cl => cl.AccountBookId == accountBookId);
        if (hasLinks)
        {
            var linked = await _context.AccountBookCategoryLinks
                .AnyAsync(cl => cl.AccountBookId == accountBookId && cl.CategoryId == categoryId);
            if (!linked)
                throw new InvalidOperationException("该分类未关联当前账本");
        }
    }

    public async Task<List<CategoryAdminDto>> GetAdminCategoriesAsync(int? type = null)
    {
        var query = _context.Categories.Where(c => c.UserId == 0);
        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        var list = await query
            .OrderBy(c => c.Type)
            .ThenBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Icon,
                c.Color,
                c.Type,
                c.SortOrder,
                c.ParentId,
                c.IsVisible
            })
            .ToListAsync();

        var ids = list.Select(x => x.Id).ToList();
        var usedIds = await _context.Transactions
            .Where(t => ids.Contains(t.CategoryId))
            .Select(t => t.CategoryId)
            .Distinct()
            .ToListAsync();
        var usedSet = new HashSet<int>(usedIds);

        var dtos = list.Select(c => new CategoryAdminDto
        {
            Id = c.Id,
            Name = c.Name,
            Icon = c.Icon,
            Color = c.Color,
            Type = c.Type,
            SortOrder = c.SortOrder,
            ParentId = c.ParentId,
            IsVisible = c.IsVisible,
            IsUsed = usedSet.Contains(c.Id)
        }).ToList();

        var parentDtos = dtos.Where(c => c.ParentId == null).ToList();
        var childDtos = dtos.Where(c => c.ParentId != null).ToList();
        foreach (var p in parentDtos)
        {
            p.Children = childDtos
                .Where(c => c.ParentId == p.Id)
                .OrderBy(c => c.SortOrder)
                .ThenBy(c => c.Name)
                .ToList();
        }

        return parentDtos;
    }

    public async Task<CategoryAdminDto> AdminCreateCategoryAsync(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("分类名称不能为空");

        if (request.ParentId.HasValue)
        {
            var parent = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == request.ParentId.Value && c.UserId == 0);
            if (parent == null)
                throw new InvalidOperationException("父分类不存在");
            if (parent.Type != request.Type)
                throw new InvalidOperationException("子分类收支类型须与父分类一致");
            if (parent.ParentId != null)
                throw new InvalidOperationException("仅支持二级分类，不能在子分类下再建子分类");
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Icon = request.Icon,
            Color = request.Color,
            Type = request.Type,
            UserId = 0,
            SortOrder = request.SortOrder,
            ParentId = request.ParentId,
            IsVisible = request.IsVisible,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        if (request.ParentId.HasValue)
            await AutoLinkNewCategoryToRestrictedBooksAsync(category.Id, request.ParentId.Value);

        var isUsed = await _context.Transactions.AnyAsync(t => t.CategoryId == category.Id);
        return new CategoryAdminDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Type = category.Type,
            SortOrder = category.SortOrder,
            ParentId = category.ParentId,
            IsVisible = category.IsVisible,
            IsUsed = isUsed
        };
    }

    public async Task<CategoryAdminDto?> AdminUpdateCategoryAsync(int id, CreateCategoryRequest request)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == 0);
        if (category == null)
            return null;

        var isUsed = await _context.Transactions.AnyAsync(t => t.CategoryId == id);

        if (isUsed)
        {
            var reqName = request.Name?.Trim() ?? "";
            var sameMeta = category.Name == reqName
                && category.Icon == request.Icon
                && category.Color == request.Color
                && category.Type == request.Type
                && category.ParentId == request.ParentId
                && category.SortOrder == request.SortOrder;
            if (!sameMeta)
                throw new InvalidOperationException("该分类已被交易使用，不能修改名称、图标等信息，仅可调整是否展示");

            category.IsVisible = request.IsVisible;
            await _context.SaveChangesAsync();
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new InvalidOperationException("分类名称不能为空");

            if (request.ParentId.HasValue)
            {
                if (request.ParentId.Value == id)
                    throw new InvalidOperationException("不能将父分类设为自己");

                var parent = await _context.Categories
                    .FirstOrDefaultAsync(c => c.Id == request.ParentId.Value && c.UserId == 0);
                if (parent == null)
                    throw new InvalidOperationException("父分类不存在");
                if (parent.Type != request.Type)
                    throw new InvalidOperationException("子分类收支类型须与父分类一致");
                if (parent.ParentId != null)
                    throw new InvalidOperationException("仅支持二级分类");
            }

            category.Name = request.Name.Trim();
            category.Icon = request.Icon;
            category.Color = request.Color;
            category.Type = request.Type;
            category.ParentId = request.ParentId;
            category.SortOrder = request.SortOrder;
            category.IsVisible = request.IsVisible;
            await _context.SaveChangesAsync();
        }

        isUsed = await _context.Transactions.AnyAsync(t => t.CategoryId == id);
        return new CategoryAdminDto
        {
            Id = category.Id,
            Name = category.Name,
            Icon = category.Icon,
            Color = category.Color,
            Type = category.Type,
            SortOrder = category.SortOrder,
            ParentId = category.ParentId,
            IsVisible = category.IsVisible,
            IsUsed = isUsed
        };
    }

    public async Task<bool> AdminDeleteCategoryAsync(int id)
    {
        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == 0);
        if (category == null)
            return false;

        var hasTransactions = await _context.Transactions.AnyAsync(t => t.CategoryId == id);
        if (hasTransactions)
            throw new InvalidOperationException("该分类已被使用，无法删除");

        var hasChildren = await _context.Categories.AnyAsync(c => c.ParentId == id && c.UserId == 0);
        if (hasChildren)
            throw new InvalidOperationException("请先删除该分类下的子分类");

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CategoryDto MapCategoryDto(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Icon = category.Icon,
        Color = category.Color,
        Type = category.Type,
        SortOrder = category.SortOrder,
        ParentId = category.ParentId,
        IsVisible = category.UserId != 0 || category.IsVisible,
        IsUserCustom = category.UserId != 0 && !category.IsUserCustomRoot,
        IsUserCustomRoot = category.IsUserCustomRoot
    };

    private async Task<Category> GetOrCreateUserCustomRootAsync(int userId, int type)
    {
        var root = await _context.Categories
            .FirstOrDefaultAsync(c => c.UserId == userId && c.IsUserCustomRoot && c.Type == type);
        if (root != null)
            return root;

        root = new Category
        {
            Name = UserCustomRootName,
            Icon = "⭐",
            Color = "#F5A623",
            Type = type,
            UserId = userId,
            IsUserCustomRoot = true,
            IsVisible = true,
            SortOrder = 9999,
            CreatedAt = DateTime.UtcNow
        };
        _context.Categories.Add(root);
        await _context.SaveChangesAsync();
        return root;
    }

    private async Task EnsureBookCategoryLinksMaterializedAsync(int accountBookId, int userId, int type)
    {
        var hasAnyLinks = await _context.AccountBookCategoryLinks
            .AnyAsync(cl => cl.AccountBookId == accountBookId);
        if (hasAnyLinks)
            return;

        var tree = await GetCategoriesAsync(userId, type, null);
        var sort = 0;
        var links = new List<AccountBookCategoryLink>();

        foreach (var parent in tree.OrderBy(p => p.IsUserCustomRoot ? 0 : 1))
        {
            if (parent.Children != null && parent.Children.Count > 0)
            {
                links.Add(new AccountBookCategoryLink
                {
                    AccountBookId = accountBookId,
                    CategoryId = parent.Id,
                    SortOrder = sort++,
                    CreatedAt = DateTime.UtcNow
                });
                foreach (var child in parent.Children)
                {
                    links.Add(new AccountBookCategoryLink
                    {
                        AccountBookId = accountBookId,
                        CategoryId = child.Id,
                        SortOrder = sort++,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            else if (!parent.IsUserCustomRoot)
            {
                links.Add(new AccountBookCategoryLink
                {
                    AccountBookId = accountBookId,
                    CategoryId = parent.Id,
                    SortOrder = sort++,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (links.Count == 0)
            return;

        _context.AccountBookCategoryLinks.AddRange(links);
        await _context.SaveChangesAsync();
    }

    private async Task AddCategoryLinksAsync(int accountBookId, IEnumerable<int> categoryIds, int startSort)
    {
        var ids = categoryIds.Distinct().ToList();
        var existing = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId && ids.Contains(cl.CategoryId))
            .Select(cl => cl.CategoryId)
            .ToListAsync();
        var existingSet = new HashSet<int>(existing);

        var sort = startSort;
        var newLinks = new List<AccountBookCategoryLink>();
        foreach (var id in ids.Where(id => !existingSet.Contains(id)))
        {
            newLinks.Add(new AccountBookCategoryLink
            {
                AccountBookId = accountBookId,
                CategoryId = id,
                SortOrder = sort++,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (newLinks.Count == 0)
            return;

        _context.AccountBookCategoryLinks.AddRange(newLinks);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// 将分类关联插入账本最前（自定义分类优先展示）
    /// </summary>
    private async Task PrependCategoryLinksAsync(int accountBookId, IEnumerable<int> categoryIds)
    {
        var ids = categoryIds.Distinct().ToList();
        if (ids.Count == 0)
            return;

        var existing = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId && ids.Contains(cl.CategoryId))
            .Select(cl => cl.CategoryId)
            .ToListAsync();
        var toAdd = ids.Where(id => !existing.Contains(id)).ToList();
        if (toAdd.Count == 0)
            return;

        var allLinks = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId)
            .ToListAsync();
        foreach (var link in allLinks)
            link.SortOrder += toAdd.Count;

        var now = DateTime.UtcNow;
        for (var i = 0; i < toAdd.Count; i++)
        {
            _context.AccountBookCategoryLinks.Add(new AccountBookCategoryLink
            {
                AccountBookId = accountBookId,
                CategoryId = toAdd[i],
                SortOrder = i,
                CreatedAt = now
            });
        }

        await _context.SaveChangesAsync();
    }

    private async Task<int> GetNextLinkSortOrderAsync(int accountBookId, int type)
    {
        var tree = await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId)
            .Select(cl => cl.SortOrder)
            .ToListAsync();
        if (tree.Count == 0)
            return 0;
        return tree.Max() + 1;
    }

    private async Task<Dictionary<int, int>> GetLinkSortMapAsync(int accountBookId)
    {
        return await _context.AccountBookCategoryLinks
            .Where(cl => cl.AccountBookId == accountBookId)
            .ToDictionaryAsync(cl => cl.CategoryId, cl => cl.SortOrder);
    }

    private async Task<HashSet<int>> GetUsedCategoryIdsAsync(List<CategoryDto> tree)
    {
        var ids = new List<int>();
        foreach (var parent in tree)
        {
            if (parent.Children != null)
                ids.AddRange(parent.Children.Select(c => c.Id));
            else if (!parent.IsUserCustomRoot)
                ids.Add(parent.Id);
        }
        if (ids.Count == 0)
            return new HashSet<int>();

        var used = await _context.Transactions
            .Where(t => ids.Contains(t.CategoryId))
            .Select(t => t.CategoryId)
            .Distinct()
            .ToListAsync();
        return new HashSet<int>(used);
    }

    private async Task AutoLinkNewCategoryToRestrictedBooksAsync(int categoryId, int parentId)
    {
        var relatedCategoryIds = await _context.Categories
            .Where(c => c.UserId == 0 && (c.Id == parentId || c.ParentId == parentId))
            .Select(c => c.Id)
            .ToListAsync();

        if (relatedCategoryIds.Count == 0)
            return;

        var restrictedBookIds = await _context.AccountBookCategoryLinks
            .Where(cl => relatedCategoryIds.Contains(cl.CategoryId))
            .Select(cl => cl.AccountBookId)
            .Distinct()
            .ToListAsync();

        if (restrictedBookIds.Count == 0)
            return;

        var alreadyLinkedBookIds = await _context.AccountBookCategoryLinks
            .Where(cl => cl.CategoryId == categoryId && restrictedBookIds.Contains(cl.AccountBookId))
            .Select(cl => cl.AccountBookId)
            .ToListAsync();
        var linkedSet = new HashSet<int>(alreadyLinkedBookIds);

        var newLinks = restrictedBookIds
            .Where(bookId => !linkedSet.Contains(bookId))
            .Select(bookId => new AccountBookCategoryLink
            {
                AccountBookId = bookId,
                CategoryId = categoryId,
                SortOrder = 0,
                CreatedAt = DateTime.UtcNow
            })
            .ToList();

        if (newLinks.Count == 0)
            return;

        _context.AccountBookCategoryLinks.AddRange(newLinks);
        await _context.SaveChangesAsync();
    }
}
