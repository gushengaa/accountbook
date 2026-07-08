using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

public class SpendingChannelTypeService : ISpendingChannelTypeService
{
    private readonly ApplicationDbContext _context;

    private static readonly (int Value, string Name, string Icon, string Color, int SortOrder)[] DefaultItems =
    {
        (0, "未指定", "📍", "#BFBFBF", 0),
        (1, "淘宝", "🛒", "#FF5000", 1),
        (2, "京东", "📦", "#E1251B", 2),
        (3, "拼多多", "🛍️", "#E02E24", 3),
        (4, "美团", "🍔", "#FFD100", 4),
        (5, "饿了么", "🥡", "#0097FF", 5),
        (6, "叮咚买菜", "🥬", "#00B853", 6),
        (7, "盒马", "🦐", "#FF6A00", 7),
        (8, "抖音商城", "🎵", "#161823", 8),
        (9, "线下门店", "🏪", "#8C8C8C", 9),
        (99, "其他", "📝", "#BFBFBF", 99)
    };

    public SpendingChannelTypeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task EnsureSeededAsync()
    {
        if (await _context.SpendingChannelTypes.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        foreach (var item in DefaultItems)
        {
            _context.SpendingChannelTypes.Add(new SpendingChannelType
            {
                Value = item.Value,
                Name = item.Name,
                Icon = item.Icon,
                Color = item.Color,
                SortOrder = item.SortOrder,
                IsVisible = true,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<SpendingChannelTypeDto>> GetVisibleListAsync()
    {
        await EnsureSeededAsync();
        var list = await _context.SpendingChannelTypes
            .AsNoTracking()
            .Where(x => x.IsVisible)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Value)
            .ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<Dictionary<int, string>> GetNameLookupAsync()
    {
        await EnsureSeededAsync();
        var list = await _context.SpendingChannelTypes.AsNoTracking().ToListAsync();
        return list.ToDictionary(x => x.Value, x => x.Name);
    }

    public async Task<bool> IsValidSpendingChannelAsync(int value, bool requireVisible = true)
    {
        await EnsureSeededAsync();
        if (value == 0)
            return true;

        var query = _context.SpendingChannelTypes.AsNoTracking().Where(x => x.Value == value);
        if (requireVisible)
            query = query.Where(x => x.IsVisible);
        return await query.AnyAsync();
    }

    private static SpendingChannelTypeDto MapToDto(SpendingChannelType x) => new()
    {
        Id = x.Id,
        Value = x.Value,
        Name = x.Name,
        Icon = x.Icon,
        Color = x.Color,
        SortOrder = x.SortOrder,
        IsVisible = x.IsVisible
    };
}
