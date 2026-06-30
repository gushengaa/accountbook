using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 交易记录服务接口
/// </summary>
public interface ITransactionService
{
    /// <summary>
    /// 获取账本的所有交易记录（支持个人账本和集体账本）
    /// </summary>
    Task<List<TransactionDto>> GetTransactionsByAccountBookIdAsync(int accountBookId, int userId);
    
    /// <summary>
    /// 根据日期范围获取交易记录
    /// </summary>
    Task<List<TransactionDto>> GetTransactionsByDateRangeAsync(int accountBookId, int userId, DateTime startDate, DateTime endDate);

    /// <summary>
    /// 获取昨日、今日、本周交易金额统计
    /// </summary>
    Task<TransactionPeriodSummaryDto> GetPeriodSummaryAsync(int accountBookId, int userId);

    /// <summary>
    /// 获取用户全账本统计概览（个人+集体合并）
    /// </summary>
    Task<UserStatisticsOverviewDto> GetUserStatisticsOverviewAsync(int userId, int year, int month);

    /// <summary>
    /// 获取用户全账本下某一级分类（含二级）在指定年月的交易明细
    /// </summary>
    Task<List<TransactionDto>> GetUserTransactionsByRootCategoryAsync(
        int userId, int rootCategoryId, int year, int month, int type);
    
    /// <summary>
    /// 根据ID获取交易记录
    /// </summary>
    Task<TransactionDto?> GetTransactionByIdAsync(int id, int userId);
    
    /// <summary>
    /// 创建交易记录
    /// </summary>
    Task<TransactionDto> CreateTransactionAsync(int userId, CreateTransactionRequest request);
    
    /// <summary>
    /// 更新交易记录
    /// </summary>
    Task<TransactionDto?> UpdateTransactionAsync(int id, int userId, UpdateTransactionRequest request);
    
    /// <summary>
    /// 删除交易记录
    /// </summary>
    Task<bool> DeleteTransactionAsync(int id, int userId);
}



