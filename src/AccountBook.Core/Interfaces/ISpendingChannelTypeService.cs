using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

public interface ISpendingChannelTypeService
{
    Task<List<SpendingChannelTypeDto>> GetVisibleListAsync();
    Task<Dictionary<int, string>> GetNameLookupAsync();
    Task<bool> IsValidSpendingChannelAsync(int value, bool requireVisible = true);
}
