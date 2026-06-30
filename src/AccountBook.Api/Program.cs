using System.Threading.RateLimiting;
using AccountBook.Api.Jobs;
using AccountBook.Core.Interfaces;
using AccountBook.Core.Services;
using AccountBook.Infrastructure.Data;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Server.IIS;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;

var appTempDir = Path.Combine(AppContext.BaseDirectory, "temp");
Directory.CreateDirectory(appTempDir);
Environment.SetEnvironmentVariable("ASPNETCORE_TEMP", appTempDir);
Environment.SetEnvironmentVariable("TEMP", appTempDir);
Environment.SetEnvironmentVariable("TMP", appTempDir);

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

const long maxUploadBytes = 10 * 1024 * 1024;
builder.Services.Configure<IISServerOptions>(options => options.MaxRequestBodySize = maxUploadBytes);
builder.Services.Configure<FormOptions>(options => options.MultipartBodyLengthLimit = maxUploadBytes);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = maxUploadBytes);

var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new Exception("数据库连接字符串未配置");

var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrWhiteSpace(redisConnection))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(defaultConnection, npgsql => npgsql.CommandTimeout(30)));

builder.Services.AddScoped<ApplicationReadDbContext>();

var healthChecks = builder.Services.AddHealthChecks()
    .AddNpgSql(defaultConnection, name: "postgresql");

if (!string.IsNullOrWhiteSpace(redisConnection))
    healthChecks.AddRedis(redisConnection, name: "redis");

var permitLimit = builder.Configuration.GetValue("RateLimiting:PermitLimit", 100);
var windowMinutes = builder.Configuration.GetValue("RateLimiting:WindowMinutes", 1);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("api", opt =>
    {
        opt.PermitLimit = permitLimit;
        opt.Window = TimeSpan.FromMinutes(windowMinutes);
        opt.QueueLimit = 0;
    });
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var key = context.User.Identity?.IsAuthenticated == true
            ? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? context.Connection.RemoteIpAddress?.ToString() ?? "anon"
            : context.Connection.RemoteIpAddress?.ToString() ?? "anon";
        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromMinutes(windowMinutes),
            QueueLimit = 0
        });
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "记账小程序 API",
            Version = "v1",
            Description = "记账微信小程序后端 API"
        });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });
}

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new Exception("JWT密钥未配置");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AccountBook";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AccountBook";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api/images", StringComparison.OrdinalIgnoreCase))
            {
                var accessToken = context.Request.Query["access_token"].FirstOrDefault();
                if (!string.IsNullOrEmpty(accessToken))
                    context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsync("{\"message\":\"登录已过期，请重新登录\"}");
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("WeChatAppPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(options => options.UseNpgsqlConnection(defaultConnection)));
builder.Services.AddHangfireServer();

builder.Services.AddHttpClient<WeChatService>();
builder.Services.AddScoped<WeChatService>();
builder.Services.AddHttpClient<IAiTransactionService, AiTransactionService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<OssService>();
builder.Services.AddScoped<TransactionCacheHelper>();
builder.Services.AddScoped<AiRecognitionTaskStore>();
builder.Services.AddScoped<AiRecognitionBackgroundJobs>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAccountBookService, AccountBookService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IPaymentMethodTypeService, PaymentMethodTypeService>();
builder.Services.AddScoped<IBookPurposeCategoryService, BookPurposeCategoryService>();
builder.Services.AddScoped<ICurrencyRateService, CurrencyRateService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();

var app = builder.Build();

var pathBase = builder.Configuration["PathBase"];
if (!string.IsNullOrEmpty(pathBase))
    app.UsePathBase(pathBase);

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        var swaggerPath = string.IsNullOrEmpty(pathBase)
            ? "/swagger/v1/swagger.json"
            : $"{pathBase}/swagger/v1/swagger.json";
        c.SwaggerEndpoint(swaggerPath, "记账小程序 API v1");
    });
}

app.UseSerilogRequestLogging();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var ex = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "未处理异常: {Path}", context.Request.Path);

        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.StatusCode = ex is Microsoft.AspNetCore.Http.BadHttpRequestException badRequest
            ? badRequest.StatusCode
            : StatusCodes.Status500InternalServerError;

        var message = ex switch
        {
            Microsoft.AspNetCore.Http.BadHttpRequestException => "上传数据过大或格式无效，请换一张较小的图片",
            _ => ex?.Message ?? "服务器内部错误"
        };
        await context.Response.WriteAsJsonAsync(new { message });
    });
});

if (builder.Configuration.GetValue("UseHttpsRedirection", false))
    app.UseHttpsRedirection();

app.UseCors("WeChatAppPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire");
}

if (builder.Configuration.GetValue("Database:RunMigrationsOnStartup", false))
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        context.Database.Migrate();
        DbInitializer.Initialize(context);
        logger.LogInformation("数据库迁移与初始化成功");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "数据库迁移失败");
        throw;
    }
}
else
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        DbInitializer.Initialize(context);
        logger.LogInformation("数据库种子数据检查完成");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "数据库种子初始化失败");
    }
}

app.Run();
