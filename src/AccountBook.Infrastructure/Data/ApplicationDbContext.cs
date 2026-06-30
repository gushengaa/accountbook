using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using AccountBook.Shared.Models;

namespace AccountBook.Infrastructure.Data;

/// <summary>
/// 应用程序数据库上下文
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<AccountBook.Shared.Models.AccountBook> AccountBooks { get; set; }
    public DbSet<AccountBookMember> AccountBookMembers { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<TransactionImage> TransactionImages { get; set; }
    public DbSet<TransactionAllocation> TransactionAllocations { get; set; }
    public DbSet<AccountBookCategoryLink> AccountBookCategoryLinks { get; set; }
    public DbSet<BookPurposeCategoryLink> BookPurposeCategoryLinks { get; set; }
    public DbSet<PaymentMethodType> PaymentMethodTypes { get; set; }
    public DbSet<CurrencyRate> CurrencyRates { get; set; }
    public DbSet<Feedback> Feedbacks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置所有 DateTime 属性使用 UTC
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(new ValueConverter<DateTime, DateTime>(
                        v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                        v => DateTime.SpecifyKind(v, DateTimeKind.Utc)));
                }
            }
        }

        // 配置 User 实体
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.OpenId).IsUnique();
            entity.Property(e => e.OpenId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.NickName).HasMaxLength(100);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
        });

        // 配置 AccountBook 实体（统一个人账本和集体账本）
        modelBuilder.Entity<AccountBook.Shared.Models.AccountBook>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.ShareCode).HasMaxLength(20);
            entity.Property(e => e.EnabledCurrencyIds).HasMaxLength(100);
            entity.HasIndex(e => e.ShareCode).IsUnique().HasFilter("\"ShareCode\" IS NOT NULL");
            entity.HasOne(e => e.User)
                  .WithMany(u => u.AccountBooks)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 配置 Category 实体
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(20);
            entity.HasIndex(e => new { e.UserId, e.Type });
        });

        modelBuilder.Entity<PaymentMethodType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Value).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.Property(e => e.Color).HasMaxLength(20);
        });

        // 配置 AccountBookMember 实体
        modelBuilder.Entity<AccountBookMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.AccountBookId, e.UserId }).IsUnique();
            entity.HasOne(e => e.AccountBook)
                  .WithMany(ab => ab.Members)
                  .HasForeignKey(e => e.AccountBookId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 配置 Transaction 实体
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Remark).HasMaxLength(500);
            entity.HasIndex(e => new { e.AccountBookId, e.TransactionDate });

            entity.HasOne(e => e.AccountBook)
                  .WithMany(ab => ab.Transactions)
                  .HasForeignKey(e => e.AccountBookId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Transactions)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 配置 TransactionImage 实体
        modelBuilder.Entity<TransactionImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.Transaction)
                  .WithMany()
                  .HasForeignKey(e => e.TransactionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => e.TransactionId);
        });

        // 配置 TransactionAllocation 实体（交易分摊：关联交易与用户）
        modelBuilder.Entity<TransactionAllocation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TransactionId, e.UserId }).IsUnique();
            entity.HasOne(e => e.Transaction)
                  .WithMany(t => t.Allocations)
                  .HasForeignKey(e => e.TransactionId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 配置 AccountBookCategoryLink 实体（账本与交易类别关联）
        modelBuilder.Entity<AccountBookCategoryLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.AccountBookId, e.CategoryId }).IsUnique();
            entity.HasOne(e => e.AccountBook)
                  .WithMany(ab => ab.CategoryLinks)
                  .HasForeignKey(e => e.AccountBookId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Category)
                  .WithMany()
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // 账本用途与交易分类（二级）关联
        modelBuilder.Entity<BookPurposeCategoryLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Purpose, e.CategoryId }).IsUnique();
            entity.HasOne(e => e.Category)
                  .WithMany()
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

