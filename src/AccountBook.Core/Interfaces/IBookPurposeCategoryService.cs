using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

public interface IBookPurposeCategoryService
{
    Task<List<BookPurposeOptionDto>> GetPurposeOptionsAsync();
    Task<BookPurposeCategoryConfigDto> GetAdminConfigAsync(int purpose);
    Task<BookPurposeCategoryIdsDto> GetCategoryIdsByPurposeAsync(int purpose);
    Task<BookPurposeCategoryConfigDto> SavePurposeCategoriesAsync(int purpose, SaveBookPurposeCategoriesRequest request);
}
