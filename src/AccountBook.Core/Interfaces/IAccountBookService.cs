using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 账本服务接口
/// </summary>
public interface IAccountBookService
{
    /// <summary>
    /// 获取用户的所有账本
    /// </summary>
    Task<List<AccountBookDto>> GetAccountBooksByUserIdAsync(int userId);
    
    /// <summary>
    /// 根据ID获取账本
    /// </summary>
    Task<AccountBookDto?> GetAccountBookByIdAsync(int id, int userId);
    
    /// <summary>
    /// 创建账本（type=0 个人，type=1 集体）
    /// </summary>
    Task<AccountBookDto> CreateAccountBookAsync(int userId, CreateAccountBookRequest request);
    
    /// <summary>
    /// 更新账本
    /// </summary>
    Task<AccountBookDto?> UpdateAccountBookAsync(int id, int userId, UpdateAccountBookRequest request);
    
    /// <summary>
    /// 删除账本
    /// </summary>
    Task<bool> DeleteAccountBookAsync(int id, int userId);
    
    /// <summary>
    /// 设置默认账本
    /// </summary>
    Task<bool> SetDefaultAccountBookAsync(int id, int userId);
    
    /// <summary>
    /// 获取用户的所有集体账本（包括作为成员的）
    /// </summary>
    Task<List<AccountBookDto>> GetSharedAccountBooksByUserIdAsync(int userId);
    
    /// <summary>
    /// 加入集体账本（通过分享码）
    /// </summary>
    Task<AccountBookDto> JoinSharedAccountBookAsync(int userId, JoinSharedAccountBookRequest request);
    
    /// <summary>
    /// 移除成员（仅创建者或管理员）
    /// </summary>
    Task<bool> RemoveMemberAsync(int accountBookId, int memberUserId, int operatorUserId);
    
    /// <summary>
    /// 获取集体账本统计信息
    /// </summary>
    Task<SharedAccountBookStatisticsDto> GetSharedAccountBookStatisticsAsync(int id, int userId);
    
    /// <summary>
    /// 生成集体账本报告
    /// </summary>
    Task<SharedAccountBookReportDto> GenerateSharedAccountBookReportAsync(int id, int userId);
}



