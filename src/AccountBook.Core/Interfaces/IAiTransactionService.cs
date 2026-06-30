using AccountBook.Shared.DTOs;

namespace AccountBook.Core.Interfaces;

/// <summary>
/// AI交易识别服务接口
/// </summary>
public interface IAiTransactionService
{
    Task<AiTransactionResponse> RecognizeTransactionAsync(int userId, AiTransactionRequest request);
    Task<VoiceRecognitionResponse> RecognizeVoiceAsync(int userId, VoiceRecognitionRequest request);
}








