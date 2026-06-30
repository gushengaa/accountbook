using AccountBook.Shared.Models;

namespace AccountBook.Infrastructure.Data;

/// <summary>
/// 数据库初始化器
/// </summary>
public static class DbInitializer
{
    /// <summary>
    /// 初始化数据库（创建默认分类）
    /// </summary>
    public static void Initialize(ApplicationDbContext context)
    {
        // 如果已有分类数据，则跳过初始化
        if (context.Categories.Any())
        {
            return;
        }

        InitializeCategories(context);
    }
    
    /// <summary>
    /// 初始化或重置分类数据（使用父子分类结构）
    /// </summary>
    public static void InitializeCategories(ApplicationDbContext context)
    {
        // ========== 支出父类 ==========
        var expenseParents = new List<Category>
        {
            new Category { Name = "餐饮美食", Icon = "🍔", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 1, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "交通出行", Icon = "🚗", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 2, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "购物消费", Icon = "🛒", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 3, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "居家生活", Icon = "🏠", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 4, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "娱乐休闲", Icon = "🎬", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 5, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "医疗健康", Icon = "🏥", Color = "#FF8B94", Type = 0, UserId = 0, SortOrder = 6, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "学习教育", Icon = "📚", Color = "#95E1D3", Type = 0, UserId = 0, SortOrder = 7, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "人情往来", Icon = "🧧", Color = "#FFB6C1", Type = 0, UserId = 0, SortOrder = 8, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "金融理财", Icon = "💳", Color = "#74C0FC", Type = 0, UserId = 0, SortOrder = 9, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "其他支出", Icon = "📝", Color = "#AA96DA", Type = 0, UserId = 0, SortOrder = 10, ParentId = null, CreatedAt = DateTime.UtcNow }
        };
        
        context.Categories.AddRange(expenseParents);
        context.SaveChanges();
        
        // 获取父类ID映射
        var parentMap = context.Categories
            .Where(c => c.UserId == 0 && c.Type == 0 && c.ParentId == null)
            .ToDictionary(c => c.Name, c => c.Id);
        
        // ========== 支出子类 ==========
        var expenseChildren = new List<Category>
        {
            // 餐饮美食子类
            new Category { Name = "早餐", Icon = "🥣", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "午餐", Icon = "🍱", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "晚餐", Icon = "🍲", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "夜宵", Icon = "🍜", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 4, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "水果零食", Icon = "🍎", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 5, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "饮料奶茶", Icon = "🧋", Color = "#FF6B6B", Type = 0, UserId = 0, SortOrder = 6, ParentId = parentMap["餐饮美食"], CreatedAt = DateTime.UtcNow },
            
            // 交通出行子类
            new Category { Name = "公交地铁", Icon = "🚇", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "打车租车", Icon = "🚕", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "共享单车", Icon = "🚲", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "加油费", Icon = "⛽", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 4, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "停车费", Icon = "🅿️", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 5, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "火车机票", Icon = "✈️", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 6, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "高速通行费", Icon = "🛣️", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 7, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "交通违章", Icon = "🚥", Color = "#4ECDC4", Type = 0, UserId = 0, SortOrder = 8, ParentId = parentMap["交通出行"], CreatedAt = DateTime.UtcNow },
            
            // 购物消费子类
            new Category { Name = "生活日用", Icon = "🧴", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "衣服鞋帽", Icon = "👕", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "数码电子", Icon = "📱", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "化妆护肤", Icon = "💄", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 4, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "家居用品", Icon = "🛋️", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 5, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "旅游纪念", Icon = "🛍", Color = "#FFE66D", Type = 0, UserId = 0, SortOrder = 6, ParentId = parentMap["购物消费"], CreatedAt = DateTime.UtcNow },
            
            // 居家生活子类
            new Category { Name = "房租房贷", Icon = "🏠", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["居家生活"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "水电燃气", Icon = "💡", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["居家生活"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "物业费", Icon = "🏢", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["居家生活"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "宽带网费", Icon = "📶", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 4, ParentId = parentMap["居家生活"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "家政保洁", Icon = "🧹", Color = "#F38181", Type = 0, UserId = 0, SortOrder = 5, ParentId = parentMap["居家生活"], CreatedAt = DateTime.UtcNow },
            
            // 娱乐休闲子类
            new Category { Name = "电影演出", Icon = "🎬", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["娱乐休闲"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "游戏充值", Icon = "🎮", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["娱乐休闲"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "运动健身", Icon = "🏃", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["娱乐休闲"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "旅游度假", Icon = "🏖️", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 4, ParentId = parentMap["娱乐休闲"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "KTV唱歌", Icon = "🎤", Color = "#A8E6CF", Type = 0, UserId = 0, SortOrder = 5, ParentId = parentMap["娱乐休闲"], CreatedAt = DateTime.UtcNow },
            
            // 医疗健康子类
            new Category { Name = "看病挂号", Icon = "🏥", Color = "#FF8B94", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["医疗健康"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "买药", Icon = "💊", Color = "#FF8B94", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["医疗健康"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "体检", Icon = "🩺", Color = "#FF8B94", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["医疗健康"], CreatedAt = DateTime.UtcNow },
            
            // 学习教育子类
            new Category { Name = "书籍资料", Icon = "📖", Color = "#95E1D3", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["学习教育"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "培训课程", Icon = "🎓", Color = "#95E1D3", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["学习教育"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "学费", Icon = "🏫", Color = "#95E1D3", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["学习教育"], CreatedAt = DateTime.UtcNow },
            
            // 人情往来子类
            new Category { Name = "红包礼金", Icon = "🧧", Color = "#FFB6C1", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["人情往来"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "请客送礼", Icon = "🎁", Color = "#FFB6C1", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["人情往来"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "份子钱", Icon = "💒", Color = "#FFB6C1", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["人情往来"], CreatedAt = DateTime.UtcNow },
            
            // 金融理财子类
            new Category { Name = "转账", Icon = "💸", Color = "#74C0FC", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["金融理财"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "还款", Icon = "💳", Color = "#74C0FC", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["金融理财"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "保险", Icon = "🛡️", Color = "#74C0FC", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["金融理财"], CreatedAt = DateTime.UtcNow },
            
            // 其他支出子类
            new Category { Name = "宠物", Icon = "🐱", Color = "#AA96DA", Type = 0, UserId = 0, SortOrder = 1, ParentId = parentMap["其他支出"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "烟酒", Icon = "🚬", Color = "#AA96DA", Type = 0, UserId = 0, SortOrder = 2, ParentId = parentMap["其他支出"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "其他", Icon = "📝", Color = "#AA96DA", Type = 0, UserId = 0, SortOrder = 3, ParentId = parentMap["其他支出"], CreatedAt = DateTime.UtcNow }
        };
        
        context.Categories.AddRange(expenseChildren);
        context.SaveChanges();

        // ========== 收入父类 ==========
        var incomeParents = new List<Category>
        {
            new Category { Name = "工作收入", Icon = "💼", Color = "#51CF66", Type = 1, UserId = 0, SortOrder = 1, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "投资理财", Icon = "📈", Color = "#74C0FC", Type = 1, UserId = 0, SortOrder = 2, ParentId = null, CreatedAt = DateTime.UtcNow },
            new Category { Name = "其他收入", Icon = "📝", Color = "#AA96DA", Type = 1, UserId = 0, SortOrder = 3, ParentId = null, CreatedAt = DateTime.UtcNow }
        };
        
        context.Categories.AddRange(incomeParents);
        context.SaveChanges();
        
        // 获取收入父类ID映射
        var incomeParentMap = context.Categories
            .Where(c => c.UserId == 0 && c.Type == 1 && c.ParentId == null)
            .ToDictionary(c => c.Name, c => c.Id);
        
        // ========== 收入子类 ==========
        var incomeChildren = new List<Category>
        {
            // 工作收入子类
            new Category { Name = "工资薪水", Icon = "💰", Color = "#51CF66", Type = 1, UserId = 0, SortOrder = 1, ParentId = incomeParentMap["工作收入"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "奖金提成", Icon = "🏆", Color = "#51CF66", Type = 1, UserId = 0, SortOrder = 2, ParentId = incomeParentMap["工作收入"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "兼职收入", Icon = "💼", Color = "#51CF66", Type = 1, UserId = 0, SortOrder = 3, ParentId = incomeParentMap["工作收入"], CreatedAt = DateTime.UtcNow },
            
            // 投资理财子类
            new Category { Name = "投资收益", Icon = "📈", Color = "#74C0FC", Type = 1, UserId = 0, SortOrder = 1, ParentId = incomeParentMap["投资理财"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "租金收入", Icon = "🏠", Color = "#74C0FC", Type = 1, UserId = 0, SortOrder = 2, ParentId = incomeParentMap["投资理财"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "利息收入", Icon = "🏦", Color = "#74C0FC", Type = 1, UserId = 0, SortOrder = 3, ParentId = incomeParentMap["投资理财"], CreatedAt = DateTime.UtcNow },
            
            // 其他收入子类
            new Category { Name = "红包收入", Icon = "🧧", Color = "#AA96DA", Type = 1, UserId = 0, SortOrder = 1, ParentId = incomeParentMap["其他收入"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "报销退款", Icon = "💵", Color = "#AA96DA", Type = 1, UserId = 0, SortOrder = 2, ParentId = incomeParentMap["其他收入"], CreatedAt = DateTime.UtcNow },
            new Category { Name = "其他", Icon = "📝", Color = "#AA96DA", Type = 1, UserId = 0, SortOrder = 3, ParentId = incomeParentMap["其他收入"], CreatedAt = DateTime.UtcNow }
        };
        
        context.Categories.AddRange(incomeChildren);
        context.SaveChanges();
    }
    
    /// <summary>
    /// 重置分类数据（删除所有系统分类并重新创建）
    /// 注意：这会删除所有 UserId=0 的系统默认分类
    /// </summary>
    public static void ResetCategories(ApplicationDbContext context)
    {
        // 删除所有系统默认分类（UserId = 0）
        var systemCategories = context.Categories.Where(c => c.UserId == 0).ToList();
        context.Categories.RemoveRange(systemCategories);
        context.SaveChanges();
        
        // 重新创建分类
        InitializeCategories(context);
    }
}

