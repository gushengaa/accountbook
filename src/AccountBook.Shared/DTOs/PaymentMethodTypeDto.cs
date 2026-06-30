namespace AccountBook.Shared.DTOs;

public class PaymentMethodTypeDto
{
    public int Id { get; set; }
    public int Value { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}

public class PaymentMethodTypeAdminDto : PaymentMethodTypeDto
{
    public bool IsUsed { get; set; }
}

public class CreatePaymentMethodTypeRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int? Value { get; set; }
    public int SortOrder { get; set; }
    public bool IsVisible { get; set; } = true;
}

public class ReorderPaymentMethodTypesRequest
{
    public List<int> OrderedIds { get; set; } = new();
}
