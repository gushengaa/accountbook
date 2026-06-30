using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 分类服务接口
/// </summary>
public interface ICategoryService
{
    /// <summary>
    /// 获取所有分类（树形结构，父分类包含子分类）。
    /// 当 accountBookId 有值且该账本有关联类别时，仅返回账本关联的类别（及所需父节点）。
    /// </summary>
    Task<List<CategoryDto>> GetCategoriesAsync(int userId, int? type = null, int? accountBookId = null);
    
    /// <summary>
    /// 获取所有分类（平铺列表，不分父子）
    /// </summary>
    Task<List<CategoryDto>> GetAllCategoriesFlatAsync(int userId, int? type = null);
    
    /// <summary>
    /// 根据ID获取分类
    /// </summary>
    Task<CategoryDto?> GetCategoryByIdAsync(int id);
    
    /// <summary>
    /// 创建分类
    /// </summary>
    Task<CategoryDto> CreateCategoryAsync(int userId, CreateCategoryRequest request);
    
    /// <summary>
    /// 更新分类
    /// </summary>
    Task<CategoryDto?> UpdateCategoryAsync(int id, int userId, CreateCategoryRequest request);
    
    /// <summary>
    /// 删除分类
    /// </summary>
    Task<bool> DeleteCategoryAsync(int id, int userId);

    /// <summary>
    /// 是否可管理账本内分类（个人账本 owner；集体账本仅创建人）
    /// </summary>
    Task<bool> CanManageBookCategoriesAsync(int userId, int accountBookId);

    /// <summary>
    /// 获取账本内可管理的分类列表（叶子分类，含排序）
    /// </summary>
    Task<List<BookCategoryManageItemDto>> GetBookCategoriesManageAsync(int userId, int accountBookId, int type);

    /// <summary>
    /// 在账本内创建用户自定义二级分类，并写入关联表
    /// </summary>
    Task<CategoryDto> CreateBookCustomCategoryAsync(int userId, int accountBookId, CreateBookCustomCategoryRequest request);

    /// <summary>
    /// 从账本移除分类（系统分类仅删关联；用户自定义则彻底删除）
    /// </summary>
    Task RemoveCategoryFromBookAsync(int userId, int accountBookId, int categoryId);

    /// <summary>
    /// 账本内分类排序
    /// </summary>
    Task ReorderBookCategoriesAsync(int userId, int accountBookId, ReorderBookCategoriesRequest request);

    /// <summary>
    /// 新建账本时同步用户全部自定义分类到关联表
    /// </summary>
    Task SyncUserCustomCategoriesToBookAsync(int userId, int accountBookId);

    /// <summary>
    /// 校验分类可用于账本交易
    /// </summary>
    Task ValidateCategoryForTransactionAsync(int userId, int accountBookId, int categoryId, int transactionType);

    /// <summary>
    /// 管理员：获取全部系统默认分类（含已停用、已使用标记）
    /// </summary>
    Task<List<CategoryAdminDto>> GetAdminCategoriesAsync(int? type = null);

    /// <summary>
    /// 管理员：新增系统默认分类
    /// </summary>
    Task<CategoryAdminDto> AdminCreateCategoryAsync(CreateCategoryRequest request);

    /// <summary>
    /// 管理员：更新系统默认分类（已使用的分类仅允许修改是否展示）
    /// </summary>
    Task<CategoryAdminDto?> AdminUpdateCategoryAsync(int id, CreateCategoryRequest request);

    /// <summary>
    /// 管理员：删除系统默认分类（已使用或存在子分类时不可删）
    /// </summary>
    Task<bool> AdminDeleteCategoryAsync(int id);
}
