using System.Text.Json;
using AccountBook.Shared.DTOs;
using Microsoft.Extensions.Caching.Distributed;

namespace AccountBook.Core.Services;

/// <summary>
/// AI 识别异步任务结果存储（Redis / 内存分布式缓存）
/// </summary>
public class AiRecognitionTaskStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IDistributedCache _cache;

    public AiRecognitionTaskStore(IDistributedCache cache)
    {
        _cache = cache;
    }

    private static string Key(string taskId) => $"ai-task:{taskId}";

    public async Task CreateAsync(string taskId)
    {
        var task = new AiRecognitionTaskDto { TaskId = taskId, Status = "pending" };
        await SaveAsync(task);
    }

    public async Task<AiRecognitionTaskDto?> GetAsync(string taskId)
    {
        var json = await _cache.GetStringAsync(Key(taskId));
        return string.IsNullOrEmpty(json)
            ? null
            : JsonSerializer.Deserialize<AiRecognitionTaskDto>(json, JsonOptions);
    }

    public async Task SetProcessingAsync(string taskId)
    {
        var task = await GetAsync(taskId) ?? new AiRecognitionTaskDto { TaskId = taskId };
        task.Status = "processing";
        await SaveAsync(task);
    }

    public async Task SetCompletedAsync(string taskId, VoiceRecognitionResponse result)
    {
        var task = await GetAsync(taskId) ?? new AiRecognitionTaskDto { TaskId = taskId };
        task.Status = "completed";
        task.Result = result;
        task.Error = null;
        await SaveAsync(task);
    }

    public async Task SetFailedAsync(string taskId, string error)
    {
        var task = await GetAsync(taskId) ?? new AiRecognitionTaskDto { TaskId = taskId };
        task.Status = "failed";
        task.Error = error;
        await SaveAsync(task);
    }

    private Task SaveAsync(AiRecognitionTaskDto task)
    {
        var json = JsonSerializer.Serialize(task, JsonOptions);
        return _cache.SetStringAsync(
            Key(task.TaskId),
            json,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            });
    }
}
