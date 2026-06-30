using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

public interface IPaymentMethodTypeService
{
    Task<List<PaymentMethodTypeDto>> GetVisibleListAsync();
    Task<List<PaymentMethodTypeAdminDto>> GetAdminListAsync();
    Task<Dictionary<int, string>> GetNameLookupAsync();
    Task<bool> IsValidPaymentMethodAsync(int value, bool requireVisible = true);
    Task<PaymentMethodTypeAdminDto> AdminCreateAsync(CreatePaymentMethodTypeRequest request);
    Task<PaymentMethodTypeAdminDto?> AdminUpdateAsync(int id, CreatePaymentMethodTypeRequest request);
    Task<bool> AdminDeleteAsync(int id);
    Task AdminReorderAsync(ReorderPaymentMethodTypesRequest request);
}
