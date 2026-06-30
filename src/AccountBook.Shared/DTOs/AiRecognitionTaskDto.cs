namespace AccountBook.Shared.DTOs;

/// <summary>
/// AI 识别异步任务状态
/// </summary>
public class AiRecognitionTaskDto
{
    public string TaskId { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public VoiceRecognitionResponse? Result { get; set; }
    public string? Error { get; set; }
}
