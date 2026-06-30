using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.CircuitBreaker;

namespace AccountBook.Core.Services;

/// <summary>
/// 微信服务
/// </summary>
public class WeChatService
{
    private const string AccessTokenCacheKey = "wechat:access_token";
    private const string AccessTokenExpireCacheKey = "wechat:access_token_expire";

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WeChatService> _logger;
    private readonly IDistributedCache _cache;
    private readonly AsyncCircuitBreakerPolicy<HttpResponseMessage> _circuitBreaker;

    public WeChatService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WeChatService> logger,
        IDistributedCache cache)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _cache = cache;
        _circuitBreaker = Policy<HttpResponseMessage>
            .Handle<HttpRequestException>()
            .OrResult(r => r.StatusCode >= HttpStatusCode.InternalServerError)
            .CircuitBreakerAsync(5, TimeSpan.FromMinutes(1));
    }

    private static JsonSerializerOptions JsonOptions => new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    /// <summary>
    /// 通过 code 获取 openid 和 session_key
    /// </summary>
    public async Task<WeChatSessionResult?> Code2SessionAsync(string code)
    {
        var appId = _configuration["WeChat:AppId"];
        var appSecret = _configuration["WeChat:AppSecret"];

        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
            throw new Exception("微信配置未设置");

        var url = $"https://api.weixin.qq.com/sns/jscode2session?appid={appId}&secret={appSecret}&js_code={code}&grant_type=authorization_code";

        try
        {
            var response = await _circuitBreaker.ExecuteAsync(() => _httpClient.GetAsync(url));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<WeChatSessionResult>(body, JsonOptions);

            if (result?.Errcode != 0 && result?.Errcode != null)
                throw new Exception($"微信登录失败: {result.Errmsg ?? "未知错误"}");

            return result;
        }
        catch (BrokenCircuitException)
        {
            throw new Exception("微信服务暂时不可用，请稍后重试");
        }
        catch (Exception ex)
        {
            throw new Exception($"调用微信API失败: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// 获取小程序 access_token（分布式缓存）
    /// </summary>
    public async Task<string> GetAccessTokenAsync()
    {
        var cached = await _cache.GetStringAsync(AccessTokenCacheKey);
        var expireStr = await _cache.GetStringAsync(AccessTokenExpireCacheKey);
        if (!string.IsNullOrEmpty(cached) &&
            DateTime.TryParse(expireStr, null, System.Globalization.DateTimeStyles.RoundtripKind, out var expireAt) &&
            DateTime.UtcNow < expireAt)
        {
            return cached;
        }

        var appId = _configuration["WeChat:AppId"];
        var appSecret = _configuration["WeChat:AppSecret"];
        if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
            throw new Exception("微信配置未设置");

        var url = $"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appId}&secret={appSecret}";

        try
        {
            var response = await _circuitBreaker.ExecuteAsync(() => _httpClient.GetAsync(url));
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<WeChatAccessTokenResult>(body, JsonOptions);

            if (result == null || string.IsNullOrEmpty(result.AccessToken))
                throw new Exception($"获取 access_token 失败: {result?.Errmsg ?? body}");

            if (result.Errcode is > 0)
                throw new Exception($"获取 access_token 失败: {result.Errmsg ?? result.Errcode.ToString()}");

            var expiresIn = result.ExpiresIn > 300 ? result.ExpiresIn - 300 : result.ExpiresIn;
            var expireAtUtc = DateTime.UtcNow.AddSeconds(expiresIn);

            await _cache.SetStringAsync(AccessTokenCacheKey, result.AccessToken, new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = expireAtUtc
            });
            await _cache.SetStringAsync(AccessTokenExpireCacheKey, expireAtUtc.ToString("O"), new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = expireAtUtc
            });

            return result.AccessToken;
        }
        catch (BrokenCircuitException)
        {
            throw new Exception("微信服务暂时不可用，请稍后重试");
        }
    }

    /// <summary>
    /// 同步检测图片是否含有敏感/违规内容
    /// </summary>
    public async Task<WeChatContentSecurityResult> CheckImageContentAsync(byte[] imageBytes, string contentType, string fileName)
    {
        if (imageBytes.Length == 0)
            return WeChatContentSecurityResult.Fail("图片内容为空");

        const int maxBytes = 1024 * 1024;
        if (imageBytes.Length > maxBytes)
            return WeChatContentSecurityResult.Fail("单据图片不能超过1MB，请重新拍摄或压缩后上传");

        var accessToken = await GetAccessTokenAsync();
        var safeFileName = string.IsNullOrWhiteSpace(fileName) ? "image.jpg" : Path.GetFileName(fileName);
        var mimeType = ResolveImageMimeType(contentType, safeFileName);
        var boundary = $"WebKitFormBoundary{Guid.NewGuid():N}";
        var multipartBody = BuildImgSecCheckMultipartBody(imageBytes, boundary, safeFileName, mimeType);

        using var request = new HttpRequestMessage(HttpMethod.Post,
            $"https://api.weixin.qq.com/wxa/img_sec_check?access_token={accessToken}");
        request.Content = new ByteArrayContent(multipartBody);
        request.Content.Headers.TryAddWithoutValidation("Content-Type", $"multipart/form-data; boundary={boundary}");

        HttpResponseMessage response;
        try
        {
            response = await _circuitBreaker.ExecuteAsync(() => _httpClient.SendAsync(request));
        }
        catch (BrokenCircuitException)
        {
            return WeChatContentSecurityResult.Fail("微信服务暂时不可用，请稍后重试");
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WeChatApiResult>(responseBody, JsonOptions) ?? new WeChatApiResult();

        if (result.Errcode == 0)
            return WeChatContentSecurityResult.Pass();

        if (result.Errcode == 87014)
            return WeChatContentSecurityResult.Fail("图片含有敏感信息，请更换后重试");

        if (result.Errcode == 47001)
        {
            _logger.LogWarning("微信 img_sec_check 数据格式错误: {Body}, file={FileName}, size={Size}",
                responseBody, fileName, imageBytes.Length);
            return WeChatContentSecurityResult.Fail(
                "图片安全检测请求格式异常，请确认图片为 JPG/PNG/GIF 且不超过 750×1334 像素、1MB");
        }

        _logger.LogWarning("微信图片内容安全检测异常: errcode={Errcode}, errmsg={Errmsg}, file={FileName}",
            result.Errcode, result.Errmsg, fileName);

        return WeChatContentSecurityResult.Fail($"图片安全检测失败({result.Errcode})，请稍后重试");
    }

    private static byte[] BuildImgSecCheckMultipartBody(
        byte[] imageBytes, string boundary, string fileName, string contentType)
    {
        var header = Encoding.UTF8.GetBytes(
            $"--{boundary}\r\n" +
            $"Content-Disposition: form-data; name=\"media\"; filename=\"{fileName}\"\r\n" +
            $"Content-Type: {contentType}\r\n\r\n");
        var footer = Encoding.UTF8.GetBytes($"\r\n--{boundary}--\r\n");

        var body = new byte[header.Length + imageBytes.Length + footer.Length];
        Buffer.BlockCopy(header, 0, body, 0, header.Length);
        Buffer.BlockCopy(imageBytes, 0, body, header.Length, imageBytes.Length);
        Buffer.BlockCopy(footer, 0, body, header.Length + imageBytes.Length, footer.Length);
        return body;
    }

    private static string ResolveImageMimeType(string contentType, string fileName)
    {
        if (!string.IsNullOrWhiteSpace(contentType))
            return contentType;

        return Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "image/jpeg"
        };
    }

    public async Task<string?> SubmitMediaCheckAsync(string mediaUrl, string openId, int scene = 4)
    {
        var accessToken = await GetAccessTokenAsync();
        var payload = new
        {
            media_url = mediaUrl,
            media_type = 2,
            version = 2,
            scene,
            openid = openId
        };
        var json = JsonSerializer.Serialize(payload);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await _circuitBreaker.ExecuteAsync(() =>
                _httpClient.PostAsync($"https://api.weixin.qq.com/wxa/media_check_async?access_token={accessToken}", content));
        }
        catch (BrokenCircuitException)
        {
            throw new Exception("微信服务暂时不可用，请稍后重试");
        }

        var body = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<WeChatMediaCheckAsyncResult>(body, JsonOptions);
        if (result?.Errcode != 0)
        {
            _logger.LogWarning("media_check_async 提交失败: {Body}", body);
            throw new Exception(result?.Errmsg ?? "图片安全检测提交失败");
        }

        return result?.TraceId;
    }
}

public class WeChatSessionResult
{
    [JsonPropertyName("openid")]
    public string? Openid { get; set; }

    [JsonPropertyName("session_key")]
    public string? Session_key { get; set; }

    [JsonPropertyName("unionid")]
    public string? Unionid { get; set; }

    [JsonPropertyName("errcode")]
    public int? Errcode { get; set; }

    [JsonPropertyName("errmsg")]
    public string? Errmsg { get; set; }
}

public class WeChatAccessTokenResult
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("expires_in")]
    public int ExpiresIn { get; set; }

    [JsonPropertyName("errcode")]
    public int? Errcode { get; set; }

    [JsonPropertyName("errmsg")]
    public string? Errmsg { get; set; }
}

public class WeChatApiResult
{
    [JsonPropertyName("errcode")]
    public int Errcode { get; set; }

    [JsonPropertyName("errmsg")]
    public string? Errmsg { get; set; }
}

public class WeChatMediaCheckAsyncResult : WeChatApiResult
{
    [JsonPropertyName("trace_id")]
    public string? TraceId { get; set; }
}

public class WeChatContentSecurityResult
{
    public bool IsPass { get; init; }
    public string Message { get; init; } = string.Empty;

    public static WeChatContentSecurityResult Pass() => new() { IsPass = true };

    public static WeChatContentSecurityResult Fail(string message) => new() { IsPass = false, Message = message };
}
