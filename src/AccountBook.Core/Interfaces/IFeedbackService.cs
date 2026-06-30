using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// 反馈服务接口
/// </summary>
public interface IFeedbackService
{
    /// <summary>
    /// 创建反馈
    /// </summary>
    Task<FeedbackDto> CreateFeedbackAsync(int userId, CreateFeedbackRequest request);
    
    /// <summary>
    /// 获取用户的反馈列表
    /// </summary>
    Task<List<FeedbackDto>> GetUserFeedbacksAsync(int userId);
    
    /// <summary>
    /// 获取反馈详情
    /// </summary>
    Task<FeedbackDto?> GetFeedbackByIdAsync(int id, int userId);
    
    /// <summary>
    /// 管理员获取所有反馈列表
    /// </summary>
    Task<List<FeedbackDto>> GetAllFeedbacksAsync(int? status = null);
    
    /// <summary>
    /// 管理员获取反馈详情
    /// </summary>
    Task<FeedbackDto?> GetFeedbackByIdForAdminAsync(int id);
    
    /// <summary>
    /// 管理员处理反馈
    /// </summary>
    Task<FeedbackDto?> ProcessFeedbackAsync(int id, ProcessFeedbackRequest request);
    
    /// <summary>
    /// 检查用户是否是管理员
    /// </summary>
    Task<bool> IsAdminAsync(int userId);
}
