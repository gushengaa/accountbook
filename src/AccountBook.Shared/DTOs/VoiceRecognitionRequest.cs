namespace AccountBook.Shared.DTOs;
public class VoiceRecognitionRequest
{
    public string AudioBase64 { get; set; }
    public string Format { get; set; }
    public int AccountBookId { get; set; }
    public int TransactionType { get; set; }
}
