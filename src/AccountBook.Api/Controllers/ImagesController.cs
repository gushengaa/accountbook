using AccountBook.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

/// <summary>
/// 图片上传控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ImagesController : ControllerBase
{
    private readonly OssService _ossService;
    private readonly WeChatService _weChatService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(
        OssService ossService,
        WeChatService weChatService,
        IConfiguration configuration,
        ILogger<ImagesController> logger)
    {
        _ossService = ossService;
        _weChatService = weChatService;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// 上传图片。contentCheck=true 时对单据图片做微信内容安全检测（≤1MB，jpg/png/gif）
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    public async Task<ActionResult<object>> UploadImage(IFormFile file, [FromQuery] bool contentCheck = false)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "请选择要上传的图片" });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return BadRequest(new { message = "不支持的图片格式，仅支持 JPG、PNG、GIF、WEBP" });
        }

        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(new { message = "图片大小不能超过 5MB" });
        }

        try
        {
            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            var bytes = ms.ToArray();

            if (contentCheck && IsContentSecurityEnabled())
            {
                var secExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                if (!secExtensions.Contains(fileExtension))
                {
                    return BadRequest(new { message = "单据图片请使用 JPG、PNG 或 GIF 格式" });
                }

                var contentType = GetImageContentType(fileExtension);
                var checkResult = await _weChatService.CheckImageContentAsync(bytes, contentType, $"receipt{fileExtension}");
                if (!checkResult.IsPass)
                {
                    return BadRequest(new { message = checkResult.Message });
                }
            }

            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            await using var uploadStream = new MemoryStream(bytes);
            var imageUrl = await _ossService.UploadFileAsync(uploadStream, fileName, "images");
            return Ok(new
            {
                imageUrl,
                displayUrl = _ossService.GetAvailableImageUrl(imageUrl)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "上传图片失败");
            return StatusCode(500, new { message = ex.Message ?? "上传图片失败" });
        }
    }

    /// <summary>
    /// 删除图片
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> DeleteImage([FromQuery] string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
        {
            return BadRequest(new { message = "请提供图片URL" });
        }

        try
        {
            var result = await _ossService.DeleteFileAsync(imageUrl);
            if (result)
            {
                return Ok(new { message = "删除成功" });
            }
            return NotFound(new { message = "文件不存在或删除失败" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "删除图片失败");
            return StatusCode(500, new { message = ex.Message ?? "删除图片失败" });
        }
    }

    private bool IsContentSecurityEnabled()
    {
        return _configuration.GetValue("WeChat:EnableContentSecurity", true);
    }

    private static string GetImageContentType(string extension)
    {
        return extension switch
        {
            ".png" => "image/png",
            ".gif" => "image/gif",
            _ => "image/jpeg"
        };
    }
}
