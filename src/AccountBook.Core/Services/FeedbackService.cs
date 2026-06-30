using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using AccountBook.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AccountBook.Core.Services;

/// <summary>
/// 反馈服务实现
/// </summary>
public class FeedbackService : IFeedbackService
{
    private readonly ApplicationDbContext _context;

    private static readonly Dictionary<FeedbackType, string> TypeNames = new()
    {
        { FeedbackType.FeatureRequest, "功能建议" },
        { FeedbackType.BugReport, "问题反馈" },
        { FeedbackType.Complaint, "投诉" },
        { FeedbackType.Other, "其他" }
    };

    private static readonly Dictionary<FeedbackStatus, string> StatusNames = new()
    {
        { FeedbackStatus.Pending, "待处理" },
        { FeedbackStatus.Processing, "处理中" },
        { FeedbackStatus.Completed, "已完成" },
        { FeedbackStatus.Closed, "已关闭" }
    };

    public FeedbackService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FeedbackDto> CreateFeedbackAsync(int userId, CreateFeedbackRequest request)
    {
        var feedback = new Feedback
        {
            UserId = userId,
            Type = (FeedbackType)request.Type,
            Title = request.Title,
            Content = request.Content,
            Contact = request.Contact,
            Images = request.Images != null && request.Images.Any()
                ? JsonSerializer.Serialize(request.Images)
                : null,
            Status = FeedbackStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Feedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        // 重新加载用户信息
        await _context.Entry(feedback).Reference(f => f.User).LoadAsync();

        return MapToDto(feedback);
    }

    public async Task<List<FeedbackDto>> GetUserFeedbacksAsync(int userId)
    {
        var feedbacks = await _context.Feedbacks
            .Include(f => f.User)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return feedbacks.Select(MapToDto).ToList();
    }

    public async Task<FeedbackDto?> GetFeedbackByIdAsync(int id, int userId)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        return feedback != null ? MapToDto(feedback) : null;
    }

    public async Task<List<FeedbackDto>> GetAllFeedbacksAsync(int? status = null)
    {
        var query = _context.Feedbacks.Include(f => f.User).AsQueryable();

        if (status.HasValue && status.Value != -1)
        {
            var feedbackStatus = (FeedbackStatus)status.Value;
            query = query.Where(f => f.Status == feedbackStatus);
        }

        var feedbacks = await query
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return feedbacks.Select(MapToDto).ToList();
    }

    public async Task<FeedbackDto?> GetFeedbackByIdForAdminAsync(int id)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.Id == id);

        return feedback != null ? MapToDto(feedback) : null;
    }

    public async Task<FeedbackDto?> ProcessFeedbackAsync(int id, ProcessFeedbackRequest request)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (feedback == null)
            return null;

        feedback.Status = (FeedbackStatus)request.Status;
        feedback.AdminReply = request.AdminReply;
        feedback.ReplyAt = DateTime.UtcNow;
        feedback.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(feedback);
    }

    public async Task<bool> IsAdminAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.IsAdmin ?? false;
    }

    private static FeedbackDto MapToDto(Feedback feedback)
    {
        List<string>? images = null;
        if (!string.IsNullOrEmpty(feedback.Images))
        {
            try
            {
                images = JsonSerializer.Deserialize<List<string>>(feedback.Images);
            }
            catch
            {
                images = null;
            }
        }

        return new FeedbackDto
        {
            Id = feedback.Id,
            UserId = feedback.UserId,
            UserName = feedback.User?.NickName,
            UserAvatar = feedback.User?.AvatarUrl,
            Type = (int)feedback.Type,
            TypeName = TypeNames.TryGetValue(feedback.Type, out var typeName) ? typeName : "未知",
            Title = feedback.Title,
            Content = feedback.Content,
            Contact = feedback.Contact,
            Images = images,
            Status = (int)feedback.Status,
            StatusName = StatusNames.TryGetValue(feedback.Status, out var statusName) ? statusName : "未知",
            AdminReply = feedback.AdminReply,
            ReplyAt = feedback.ReplyAt,
            CreatedAt = feedback.CreatedAt
        };
    }
}
