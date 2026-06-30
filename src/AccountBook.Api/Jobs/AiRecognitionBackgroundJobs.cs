using AccountBook.Core.Interfaces;
using AccountBook.Core.Services;
using AccountBook.Shared.DTOs;
using Hangfire;

namespace AccountBook.Api.Jobs;

/// <summary>
/// AI 语音识别 Hangfire 后台任务
/// </summary>
public class AiRecognitionBackgroundJobs
{
    private readonly IAiTransactionService _aiTransactionService;
    private readonly AiRecognitionTaskStore _taskStore;

    public AiRecognitionBackgroundJobs(
        IAiTransactionService aiTransactionService,
        AiRecognitionTaskStore taskStore)
    {
        _aiTransactionService = aiTransactionService;
        _taskStore = taskStore;
    }

    [AutomaticRetry(Attempts = 2)]
    public async Task ProcessVoiceRecognitionAsync(string taskId, int userId, VoiceRecognitionRequest request)
    {
        await _taskStore.SetProcessingAsync(taskId);
        try
        {
            var result = await _aiTransactionService.RecognizeVoiceAsync(userId, request);
            await _taskStore.SetCompletedAsync(taskId, result);
        }
        catch (Exception ex)
        {
            await _taskStore.SetFailedAsync(taskId, ex.Message);
            throw;
        }
    }
}
