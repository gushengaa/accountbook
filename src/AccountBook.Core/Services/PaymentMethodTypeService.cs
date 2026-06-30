using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace AccountBook.Core.Services;

public class PaymentMethodTypeService : IPaymentMethodTypeService
{
    private readonly ApplicationDbContext _context;

    private static readonly (int Value, string Name, string Icon, string Color, int SortOrder)[] DefaultItems =
    {
        (0, "现金", "💵", "#73B764", 0),
        (1, "支付宝", "🔵", "#1677FF", 1),
        (2, "微信", "🟢", "#07C160", 2),
        (3, "云闪付", "🔴", "#E61F28", 3),
        (4, "信用卡", "💳", "#5B6EE1", 4),
        (5, "储蓄卡", "🏦", "#FA8C16", 5),
        (99, "其他", "📝", "#BFBFBF", 99)
    };

    public PaymentMethodTypeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task EnsureSeededAsync()
    {
        if (await _context.PaymentMethodTypes.AnyAsync())
            return;

        var now = DateTime.UtcNow;
        foreach (var item in DefaultItems)
        {
            _context.PaymentMethodTypes.Add(new PaymentMethodType
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

    public async Task<List<PaymentMethodTypeDto>> GetVisibleListAsync()
    {
        await EnsureSeededAsync();
        var list = await _context.PaymentMethodTypes
            .AsNoTracking()
            .Where(x => x.IsVisible)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Value)
            .ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<List<PaymentMethodTypeAdminDto>> GetAdminListAsync()
    {
        await EnsureSeededAsync();
        var list = await _context.PaymentMethodTypes
            .AsNoTracking()
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Value)
            .ToListAsync();

        var usedValues = await _context.Transactions
            .Select(t => (int)t.PaymentMethod)
            .Distinct()
            .ToListAsync();
        var usedSet = new HashSet<int>(usedValues);

        return list.Select(x => new PaymentMethodTypeAdminDto
        {
            Id = x.Id,
            Value = x.Value,
            Name = x.Name,
            Icon = x.Icon,
            Color = x.Color,
            SortOrder = x.SortOrder,
            IsVisible = x.IsVisible,
            IsUsed = usedSet.Contains(x.Value)
        }).ToList();
    }

    public async Task<Dictionary<int, string>> GetNameLookupAsync()
    {
        await EnsureSeededAsync();
        var list = await _context.PaymentMethodTypes.AsNoTracking().ToListAsync();
        return list.ToDictionary(x => x.Value, x => x.Name);
    }

    public async Task<bool> IsValidPaymentMethodAsync(int value, bool requireVisible = true)
    {
        await EnsureSeededAsync();
        var query = _context.PaymentMethodTypes.AsNoTracking().Where(x => x.Value == value);
        if (requireVisible)
            query = query.Where(x => x.IsVisible);
        return await query.AnyAsync();
    }

    public async Task<PaymentMethodTypeAdminDto> AdminCreateAsync(CreatePaymentMethodTypeRequest request)
    {
        await EnsureSeededAsync();
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("支付方式名称不能为空");

        var value = request.Value ?? await AllocateNextValueAsync();
        if (await _context.PaymentMethodTypes.AnyAsync(x => x.Value == value))
            throw new InvalidOperationException("支付方式编码已存在");

        var now = DateTime.UtcNow;
        var entity = new PaymentMethodType
        {
            Value = value,
            Name = request.Name.Trim(),
            Icon = request.Icon,
            Color = request.Color,
            SortOrder = request.SortOrder,
            IsVisible = request.IsVisible,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.PaymentMethodTypes.Add(entity);
        await _context.SaveChangesAsync();

        return await MapAdminDtoAsync(entity);
    }

    public async Task<PaymentMethodTypeAdminDto?> AdminUpdateAsync(int id, CreatePaymentMethodTypeRequest request)
    {
        await EnsureSeededAsync();
        var entity = await _context.PaymentMethodTypes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null)
            return null;

        var isUsed = await _context.Transactions.AnyAsync(t => (int)t.PaymentMethod == entity.Value);

        if (isUsed)
        {
            var sameMeta = entity.Name == (request.Name?.Trim() ?? "")
                && entity.Icon == request.Icon
                && entity.Color == request.Color
                && entity.Value == (request.Value ?? entity.Value)
                && entity.SortOrder == request.SortOrder;
            if (!sameMeta)
                throw new InvalidOperationException("该支付方式已被使用，不能修改名称、图标等信息，仅可调整是否展示与排序");

            entity.IsVisible = request.IsVisible;
            entity.SortOrder = request.SortOrder;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new InvalidOperationException("支付方式名称不能为空");

            if (request.Value.HasValue && request.Value.Value != entity.Value)
            {
                if (await _context.PaymentMethodTypes.AnyAsync(x => x.Value == request.Value.Value && x.Id != id))
                    throw new InvalidOperationException("支付方式编码已存在");
                entity.Value = request.Value.Value;
            }

            entity.Name = request.Name.Trim();
            entity.Icon = request.Icon;
            entity.Color = request.Color;
            entity.SortOrder = request.SortOrder;
            entity.IsVisible = request.IsVisible;
        }

        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await MapAdminDtoAsync(entity);
    }

    public async Task<bool> AdminDeleteAsync(int id)
    {
        await EnsureSeededAsync();
        var entity = await _context.PaymentMethodTypes.FirstOrDefaultAsync(x => x.Id == id);
        if (entity == null)
            return false;

        var isUsed = await _context.Transactions.AnyAsync(t => (int)t.PaymentMethod == entity.Value);
        if (isUsed)
            throw new InvalidOperationException("该支付方式已被使用，无法删除");

        _context.PaymentMethodTypes.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task AdminReorderAsync(ReorderPaymentMethodTypesRequest request)
    {
        await EnsureSeededAsync();
        if (request.OrderedIds == null || request.OrderedIds.Count == 0)
            throw new InvalidOperationException("排序列表不能为空");

        var entities = await _context.PaymentMethodTypes.ToListAsync();
        var map = entities.ToDictionary(x => x.Id);
        for (var i = 0; i < request.OrderedIds.Count; i++)
        {
            var id = request.OrderedIds[i];
            if (!map.TryGetValue(id, out var entity))
                throw new InvalidOperationException($"支付方式不存在: {id}");
            entity.SortOrder = i;
            entity.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task<int> AllocateNextValueAsync()
    {
        var used = await _context.PaymentMethodTypes.Select(x => x.Value).ToListAsync();
        for (var i = 6; i <= 98; i++)
        {
            if (!used.Contains(i))
                return i;
        }

        throw new InvalidOperationException("已无可用支付方式编码，请指定编码或删除无用项");
    }

    private async Task<PaymentMethodTypeAdminDto> MapAdminDtoAsync(PaymentMethodType entity)
    {
        var isUsed = await _context.Transactions.AnyAsync(t => (int)t.PaymentMethod == entity.Value);
        return new PaymentMethodTypeAdminDto
        {
            Id = entity.Id,
            Value = entity.Value,
            Name = entity.Name,
            Icon = entity.Icon,
            Color = entity.Color,
            SortOrder = entity.SortOrder,
            IsVisible = entity.IsVisible,
            IsUsed = isUsed
        };
    }

    private static PaymentMethodTypeDto MapToDto(PaymentMethodType x) => new()
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
