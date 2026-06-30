namespace AccountBook.Shared.DTOs;

/// <summary>
/// 分类DTO
/// </summary>
public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Type { get; set; }
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }

    /// <summary>
    /// 系统分类是否展示（用户自定义分类恒为 true）
    /// </summary>
    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// 是否为用户自定义分类
    /// </summary>
    public bool IsUserCustom { get; set; }

    /// <summary>
    /// 是否为「我的分类」一级分组
    /// </summary>
    public bool IsUserCustomRoot { get; set; }
    
    /// <summary>
    /// 子分类列表（仅父分类有）
    /// </summary>
    public List<CategoryDto>? Children { get; set; }
}

/// <summary>
/// 管理员分类管理（含是否已使用）
/// </summary>
public class CategoryAdminDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Type { get; set; }
    public int SortOrder { get; set; }
    public int? ParentId { get; set; }
    public bool IsVisible { get; set; } = true;
    /// <summary>
    /// 是否存在交易记录引用该分类
    /// </summary>
    public bool IsUsed { get; set; }
    public List<CategoryAdminDto>? Children { get; set; }
}

/// <summary>
/// 创建分类请求
/// </summary>
public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Type { get; set; }
    public int? ParentId { get; set; }
    public bool IsVisible { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}

/// <summary>
/// 账本内创建用户自定义分类
/// </summary>
public class CreateBookCustomCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Type { get; set; }
}

/// <summary>
/// 账本内分类排序
/// </summary>
public class ReorderBookCategoriesRequest
{
    public int Type { get; set; }
    public List<int> CategoryIds { get; set; } = new();
}

/// <summary>
/// 账本分类管理项（管理抽屉）
/// </summary>
public class BookCategoryManageItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int Type { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
    public bool IsUserCustom { get; set; }
    public bool IsUserCustomRoot { get; set; }
    public bool IsUsed { get; set; }
    public int SortOrder { get; set; }
}



