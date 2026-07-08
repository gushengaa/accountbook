namespace AccountBook.Shared.DTOs;

public class SpendingChannelTypeDto
{
    public int Id { get; set; }
    public int Value { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}
