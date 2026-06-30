using Aliyun.OSS;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AccountBook.Core.Services;

/// <summary>
/// 阿里云OSS服务
/// </summary>
public class OssService
{
    private readonly OssClient _ossClient;
    private readonly string _bucketName;
    private readonly string _domain;
    private readonly ILogger<OssService> _logger;

    public OssService(IConfiguration configuration, ILogger<OssService> logger)
    {
        var accessKeyId = configuration["AliyunOSS:AccessKeyId"] 
            ?? throw new Exception("阿里云OSS AccessKeyId 未配置");
        var accessKeySecret = configuration["AliyunOSS:AccessKeySecret"] 
            ?? throw new Exception("阿里云OSS AccessKeySecret 未配置");
        var endpoint = configuration["AliyunOSS:Endpoint"] 
            ?? throw new Exception("阿里云OSS Endpoint 未配置");
        _bucketName = configuration["AliyunOSS:BucketName"] 
            ?? throw new Exception("阿里云OSS BucketName 未配置");
        _domain = configuration["AliyunOSS:Domain"] 
            ?? throw new Exception("阿里云OSS Domain 未配置");

        _ossClient = new OssClient(endpoint, accessKeyId, accessKeySecret);
        _logger = logger;
    }

    /// <summary>
    /// 上传文件到OSS
    /// </summary>
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string? folder = null)
    {
        try
        {
            // 参数验证
            if (fileStream == null)
                throw new ArgumentNullException(nameof(fileStream), "文件流不能为空");
            if (string.IsNullOrWhiteSpace(fileName))
                throw new ArgumentException("文件名不能为空", nameof(fileName));
            if (_ossClient == null)
                throw new InvalidOperationException("OSS客户端未初始化");
            if (string.IsNullOrWhiteSpace(_bucketName))
                throw new InvalidOperationException("OSS Bucket名称未配置");
            if (string.IsNullOrWhiteSpace(_domain))
                throw new InvalidOperationException("OSS域名未配置");

            // 构建对象键（Object Key）
            var objectKey = string.IsNullOrEmpty(folder) 
                ? $"images/{fileName}" 
                : $"{folder}/{fileName}";

            // 上传文件
            var putObjectRequest = new PutObjectRequest(_bucketName, objectKey, fileStream);
            if (putObjectRequest == null)
                throw new InvalidOperationException("创建上传请求失败");
                
            var result = await Task.Run(() => _ossClient.PutObject(putObjectRequest));
            
            // 检查上传结果
            if (result == null)
            {
                _logger.LogWarning($"OSS上传返回结果为空，但可能已成功: {objectKey}");
            }

            // 生成访问URL
            var imageUrl = $"{_domain.TrimEnd('/')}/{objectKey}";
            
            _logger.LogInformation($"文件上传成功: {objectKey}");
            return imageUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"上传文件到OSS失败: {fileName}");
            throw new Exception("上传文件失败", ex);
        }
    }

    /// <summary>
    /// 删除OSS中的文件
    /// </summary>
    public async Task<bool> DeleteFileAsync(string imageUrl)
    {
        try
        {
            var objectKey = ExtractObjectKeyFromUrl(imageUrl,_bucketName);
            
            await Task.Run(() => _ossClient.DeleteObject(_bucketName, objectKey));
            
            _logger.LogInformation($"文件删除成功: {objectKey}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"删除OSS文件失败: {imageUrl}");
            return false;
        }
    }

    /// <summary>
    /// 从URL中提取object key
    /// </summary>
    /// <param name="fileUrl">文件URL</param>
    /// <param name="bucketName">Bucket名称</param>
    /// <returns>object key</returns>
    private string ExtractObjectKeyFromUrl(string fileUrl, string bucketName)
    {
        try
        {
            if (string.IsNullOrEmpty(fileUrl))
                return null;

            var uri = new Uri(fileUrl);
            var path = uri.AbsolutePath.TrimStart('/');

            // 移除bucket名称前缀（如果存在）
            if (path.StartsWith(bucketName + "/"))
            {
                path = path.Substring(bucketName.Length + 1);
            }

            return path;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// 获取可访问的图片URL（带签名）
    /// </summary>
    /// <param name="url">原始URL</param>
    /// <returns>带签名的URL</returns>
    public string GetAvailableImageUrl(string url)
    {
        if (_ossClient == null || string.IsNullOrEmpty(url))
        {
            return url;
        }

        try
        {
            string objectKey = ExtractObjectKeyFromUrl(url, _bucketName);
            if (string.IsNullOrEmpty(objectKey))
            {
                return url;
            }

            // 生成1小时有效的访问URL
            var req = new GeneratePresignedUriRequest(_bucketName, objectKey, SignHttpMethod.Get)
            {
                Expiration = DateTime.Now.AddHours(1)
            };
            Uri signedUrl = _ossClient.GeneratePresignedUri(req);
            return signedUrl.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"生成签名URL失败: {url}");
            return url; // 返回原始URL作为降级方案
        }
    }
}

