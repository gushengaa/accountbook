using AccountBook.Core.Interfaces;
using AccountBook.Infrastructure.Data;
using AccountBook.Shared.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using Polly;
using Polly.CircuitBreaker;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AccountBook.Core.Services;

/// <summary>
/// AI交易识别服务实现
/// </summary>
public class AiTransactionService : IAiTransactionService
{
    private readonly ApplicationDbContext _context;
    private readonly ICategoryService _categoryService;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OssService> _logger;
    private readonly AsyncCircuitBreakerPolicy _voiceCircuitBreaker;

    public AiTransactionService(
        ApplicationDbContext context,
        ICategoryService categoryService,
        HttpClient httpClient,
        IConfiguration configuration, ILogger<OssService> logger)
    {
        _context = context;
        _categoryService = categoryService;
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _voiceCircuitBreaker = Policy
            .Handle<Exception>()
            .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1));
    }

    public async Task<AiTransactionResponse> RecognizeTransactionAsync(int userId, AiTransactionRequest request)
    {
        // 获取该账本的所有分类
        var categories = await _categoryService.GetCategoriesAsync(userId, request.TransactionType);

        if (!categories.Any())
        {
            throw new Exception("未找到可用的分类");
        }

        // 使用规则引擎解析自然语言
        var result = ParseTransactionText(request.Text, categories, request.TransactionType);

        // 如果解析失败，尝试使用简单的关键词匹配
        if (result == null)
        {
            result = ParseWithKeywordMatching(request.Text, categories, request.TransactionType);
        }

        if (result == null)
        {
            throw new Exception("无法识别交易信息，请检查输入内容");
        }

        return result;
    }

    /// <summary>
    /// 使用规则引擎解析交易文本
    /// </summary>
    private AiTransactionResponse? ParseTransactionText(string text, List<CategoryDto> categories, int? expectedType)
    {
        text = text.Trim();

        // 提取金额
        var amountMatch = Regex.Match(text, @"(\d+(?:\.\d+)?)");
        if (!amountMatch.Success)
        {
            return null;
        }

        decimal amount = decimal.Parse(amountMatch.Groups[1].Value);

        // 判断类型（支出/收入）
        int type = 0; // 默认支出
        var lowerText = text.ToLower();

        if (expectedType.HasValue)
        {
            type = expectedType.Value;
        }
        else
        {
            // 通过关键词判断
            var incomeKeywords = new[] { "收入", "赚", "收到", "获得", "工资", "奖金", "红包", "退款", "返现" };
            var expenseKeywords = new[] { "花费", "支出", "买", "支付", "消费", "花", "付", "早餐", "午餐", "晚餐", "打车", "购物" };

            if (incomeKeywords.Any(k => text.Contains(k)))
            {
                type = 1;
            }
            else if (expenseKeywords.Any(k => text.Contains(k)) || !incomeKeywords.Any(k => text.Contains(k)))
            {
                type = 0;
            }
        }

        // 提取日期（如果包含）
        DateTime? transactionDate = null;
        var datePatterns = new[]
        {
            @"今天|今日",
            @"昨天|昨日",
            @"(\d{1,2})月(\d{1,2})日",
            @"(\d{4})[年\-/](\d{1,2})[月\-/](\d{1,2})日?"
        };

        foreach (var pattern in datePatterns)
        {
            var match = Regex.Match(text, pattern);
            if (match.Success)
            {
                if (pattern.Contains("今天") || pattern.Contains("今日"))
                {
                    transactionDate = DateTime.UtcNow.Date;
                }
                else if (pattern.Contains("昨天") || pattern.Contains("昨日"))
                {
                    transactionDate = DateTime.UtcNow.Date.AddDays(-1);
                }
                else if (match.Groups.Count > 1)
                {
                    // 解析具体日期
                    try
                    {
                        if (match.Groups.Count == 3) // 月日格式
                        {
                            var month = int.Parse(match.Groups[1].Value);
                            var day = int.Parse(match.Groups[2].Value);
                            var year = DateTime.UtcNow.Year;
                            transactionDate = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                        }
                        else if (match.Groups.Count == 4) // 年月日格式
                        {
                            var year = int.Parse(match.Groups[1].Value);
                            var month = int.Parse(match.Groups[2].Value);
                            var day = int.Parse(match.Groups[3].Value);
                            transactionDate = new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                        }
                    }
                    catch
                    {
                        // 日期解析失败，使用默认值
                    }
                }
                break;
            }
        }

        // 匹配分类
        CategoryDto? matchedCategory = null;
        var categoryKeywords = new Dictionary<string, string[]>
        {
            { "早餐", new[] { "早餐", "早饭", "早", "早点", "早茶" } },
            { "午餐", new[] { "午餐", "午饭", "中餐", "中饭", "午" } },
            { "晚餐", new[] { "晚餐", "晚饭", "晚", "夜宵", "宵夜" } },
            { "交通", new[] { "打车", "地铁", "公交", "交通", "出行", "车费", "油费", "滴滴", "出租车" } },
            { "购物", new[] { "购物", "买", "采购", "超市", "商场", "购物", "商店" } },
            { "娱乐", new[] { "娱乐", "电影", "KTV", "游戏", "娱乐", "看片" } },
            { "医疗", new[] { "医疗", "医院", "看病", "药", "药品", "看病", "就医" } },
            { "教育", new[] { "教育", "学习", "培训", "课程", "学费", "学习" } },
            { "工资", new[] { "工资", "薪水", "薪资", "月薪" } },
            { "奖金", new[] { "奖金", "奖励", "绩效" } },
            { "红包", new[] { "红包", "礼金", "压岁钱" } }
        };

        //var lowerText = text.ToLower();

        // 先尝试精确匹配分类名称和关键词
        foreach (var category in categories)
        {
            var categoryName = category.Name;
            var categoryNameLower = categoryName.ToLower();

            // 直接匹配分类名称
            if (lowerText.Contains(categoryNameLower))
            {
                matchedCategory = category;
                break;
            }

            // 通过关键词匹配
            foreach (var kv in categoryKeywords)
            {
                if (categoryName.Contains(kv.Key) && kv.Value.Any(k => lowerText.Contains(k.ToLower())))
                {
                    matchedCategory = category;
                    break;
                }
            }

            if (matchedCategory != null)
                break;
        }

        // 如果还是没找到，使用第一个匹配类型的分类作为默认
        if (matchedCategory == null)
        {
            matchedCategory = categories.FirstOrDefault(c => c.Type == type);
        }

        // 最后兜底：使用第一个分类
        if (matchedCategory == null)
        {
            matchedCategory = categories.First();
        }

        // 提取备注（去除金额、日期、分类关键词后的剩余文本）
        string? remark = text;
        remark = Regex.Replace(remark, @"\d+(?:\.\d+)?", ""); // 移除金额
        remark = Regex.Replace(remark, @"今天|昨日|昨天|\d+[年月日\-/]", ""); // 移除日期
        remark = remark.Trim();
        if (string.IsNullOrWhiteSpace(remark) || remark.Length < 2)
        {
            remark = null;
        }

        return new AiTransactionResponse
        {
            CategoryId = matchedCategory.Id,
            Amount = amount,
            Type = type,
            Remark = remark,
            TransactionDate = transactionDate,
            CategoryName = matchedCategory.Name,
            CategoryIcon = matchedCategory.Icon,
            CategoryColor = matchedCategory.Color
        };
    }

    /// <summary>
    /// 使用关键词匹配解析
    /// </summary>
    private AiTransactionResponse? ParseWithKeywordMatching(string text, List<CategoryDto> categories, int? expectedType)
    {
        // 简单的关键词匹配逻辑
        var amountMatch = Regex.Match(text, @"(\d+(?:\.\d+)?)");
        if (!amountMatch.Success)
        {
            return null;
        }

        decimal amount = decimal.Parse(amountMatch.Groups[1].Value);
        int type = expectedType ?? 0;
        var category = categories.FirstOrDefault(c => c.Type == type) ?? categories.First();

        return new AiTransactionResponse
        {
            CategoryId = category.Id,
            Amount = amount,
            Type = type,
            Remark = text,
            TransactionDate = null,
            CategoryName = category.Name,
            CategoryIcon = category.Icon,
            CategoryColor = category.Color
        };
    }

    /// <summary>
    /// 语音识别并生成交易记录
    /// </summary>
    public async Task<VoiceRecognitionResponse> RecognizeVoiceAsync(int userId, VoiceRecognitionRequest request)
    {
        // 1. 调用语音识别API将音频转换为文本
        string recognizedText =  RecognizeAudioToTextAsync(request.AudioBase64, request.Format);

        if (string.IsNullOrWhiteSpace(recognizedText))
        {
            throw new Exception("语音识别失败，无法识别音频内容");
        }

        // 2. 使用识别出的文本进行交易识别
        var aiRequest = new AiTransactionRequest
        {
            Text = recognizedText,
            AccountBookId = request.AccountBookId,
            TransactionType = request.TransactionType
        };

        var transaction = await RecognizeTransactionAsync(userId, aiRequest);

        return new VoiceRecognitionResponse
        {
            Text = recognizedText,
            Transaction = transaction
        };
    }

    /// <summary>
    /// 调用语音识别API将音频转换为文本
    /// </summary>
    private string RecognizeAudioToTextAsync(string audioBase64, string format)
    {
        // 获取配置
        var appId = _configuration["VoiceRecognition:AppId"];
        var apiKey = _configuration["VoiceRecognition:ApiKey"];
        var apiSecret = _configuration["VoiceRecognition:ApiSecret"];
        var apiUrl = _configuration["VoiceRecognition:ApiUrl"] ?? "https://vop.baidu.com/server_api";

        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            // 如果没有配置API密钥，返回模拟结果（用于开发测试）
            return "今天早餐花费20元";
        }

        try
        {
            return _voiceCircuitBreaker.ExecuteAsync(() => Task.FromResult(RecognizeAudioInternal(audioBase64, format, appId, apiKey, apiSecret))).GetAwaiter().GetResult();
        }
        catch (BrokenCircuitException)
        {
            throw new Exception("语音识别服务暂时不可用，请稍后重试");
        }
        catch (Exception ex)
        {
            _logger.LogError($"语音识别失败: {ex.Message}");
            throw new Exception($"语音识别失败: {ex.Message}", ex);
        }
    }

    private string RecognizeAudioInternal(string audioBase64, string format, string? appId, string apiKey, string apiSecret)
    {
            var client = new Baidu.Aip.Speech.Asr(appId, apiKey, apiSecret);
            client.Timeout = 60000;

            byte[] audioBytes = Convert.FromBase64String(audioBase64);

            var options = new Dictionary<string, object>
            {
                {"dev_pid", 1537}
            };

            var resultJObject = client.Recognize(audioBytes, "pcm", 16000, options);

            _logger.LogInformation($"语音识别result: {resultJObject}");
            string err_msg = resultJObject.Value<string>("err_msg");
            _logger.LogInformation($"err_msg: {err_msg}");
            if (err_msg.Contains("success"))
            {
                var result = (JArray)resultJObject["result"];
                _logger.LogInformation($"result: {result}");
                if (result.Any())
                {
                    return result[0].ToString() ?? string.Empty;
                }
            }

            throw new Exception("语音识别API返回格式错误");
    }
}

