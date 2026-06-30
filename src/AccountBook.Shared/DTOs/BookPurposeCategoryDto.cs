namespace AccountBook.Shared.DTOs;

public class BookPurposeOptionDto
{
    public int Purpose { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class BookPurposeCategoryItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int Type { get; set; }
    public int? ParentId { get; set; }
    public string? ParentName { get; set; }
}

public class BookPurposeCategoryConfigDto
{
    public int Purpose { get; set; }
    public string PurposeName { get; set; } = string.Empty;
    public List<BookPurposeCategoryItemDto> Categories { get; set; } = new();
}

public class BookPurposeCategoryIdsDto
{
    public int Purpose { get; set; }
    public List<int> CategoryIds { get; set; } = new();
}

public class SaveBookPurposeCategoriesRequest
{
    public List<int> CategoryIds { get; set; } = new();
}
