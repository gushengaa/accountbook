using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AccountBook.Infrastructure.Data;

/// <summary>
/// 只读数据库上下文（连接只读副本；未配置时与主库相同连接串）
/// </summary>
public class ApplicationReadDbContext : ApplicationDbContext
{
    public ApplicationReadDbContext(IConfiguration configuration)
        : base(CreateOptions(configuration))
    {
    }

    private static DbContextOptions<ApplicationDbContext> CreateOptions(IConfiguration configuration)
    {
        var readOnly = configuration.GetConnectionString("ReadOnlyConnection");
        var connection = !string.IsNullOrWhiteSpace(readOnly)
            ? readOnly
            : configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("数据库连接字符串未配置");

        return new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(connection, npgsql => npgsql.CommandTimeout(30))
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options;
    }
}
