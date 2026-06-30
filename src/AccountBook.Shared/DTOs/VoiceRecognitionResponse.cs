using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AccountBook.Shared.DTOs
{
    public class VoiceRecognitionResponse
    {
        public string Text { get; set; }
        public AiTransactionResponse Transaction { get; set; }
    }
}
