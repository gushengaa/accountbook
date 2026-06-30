using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNewCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 添加新的支出分类（只添加不存在的）
            var expenseCategories = new[]
            {
                // 餐饮美食
                ("早餐", "🥣", "#FF6B6B", 0, 1),
                ("午餐", "🍱", "#FF8E8E", 0, 2),
                ("晚餐", "🍲", "#FF7B7B", 0, 3),
                ("夜宵", "🍜", "#FF9B9B", 0, 4),
                ("水果零食", "🍎", "#FFB6B6", 0, 5),
                ("饮料奶茶", "🧋", "#FFA8A8", 0, 6),
                // 交通出行
                ("公交地铁", "🚇", "#4ECDC4", 0, 7),
                ("打车", "🚕", "#5ED4CB", 0, 8),
                ("共享单车", "🚲", "#6EDBD2", 0, 9),
                ("加油", "⛽", "#3EC3BA", 0, 10),
                ("停车费", "🅿️", "#2EB9B0", 0, 11),
                ("火车机票", "✈️", "#1EAFA6", 0, 12),
                // 购物消费
                ("日用品", "🧴", "#FFE66D", 0, 13),
                ("衣服鞋帽", "👕", "#FFEB7D", 0, 14),
                ("数码电子", "📱", "#FFF08D", 0, 15),
                ("化妆护肤", "💄", "#FFE15D", 0, 16),
                ("家居用品", "🛋️", "#FFDC4D", 0, 17),
                // 居家生活
                ("房租房贷", "🏠", "#F38181", 0, 18),
                ("水电燃气", "💡", "#F39191", 0, 19),
                ("物业费", "🏢", "#F3A1A1", 0, 20),
                ("宽带网费", "📶", "#F3B1B1", 0, 21),
                ("家政保洁", "🧹", "#F37171", 0, 22),
                // 娱乐休闲
                ("电影演出", "🎬", "#A8E6CF", 0, 23),
                ("游戏充值", "🎮", "#B8EDDA", 0, 24),
                ("运动健身", "🏃", "#C8F4E5", 0, 25),
                ("旅游度假", "🏖️", "#98DFC4", 0, 26),
                ("KTV唱歌", "🎤", "#88D5B9", 0, 27),
                // 医疗健康
                ("看病挂号", "🏥", "#FF8B94", 0, 28),
                ("买药", "💊", "#FF9BA4", 0, 29),
                ("体检", "🩺", "#FFABB4", 0, 30),
                // 学习教育
                ("书籍资料", "📚", "#95E1D3", 0, 31),
                ("培训课程", "🎓", "#A5EBE3", 0, 32),
                ("学费", "🏫", "#85D7C3", 0, 33),
                // 人情往来
                ("红包礼金", "🧧", "#FFB6C1", 0, 34),
                ("请客送礼", "🎁", "#FFC6D1", 0, 35),
                ("份子钱", "💒", "#FFA6B1", 0, 36),
                // 金融相关
                ("转账", "💸", "#74C0FC", 0, 37),
                ("还款", "💳", "#84CAFC", 0, 38),
                ("保险", "🛡️", "#64B6FC", 0, 39),
                // 其他
                ("宠物", "🐱", "#DDA0DD", 0, 40),
                ("烟酒", "🚬", "#D8BFD8", 0, 41),
                ("其他支出", "📝", "#AA96DA", 0, 42)
            };

            foreach (var (name, icon, color, type, sortOrder) in expenseCategories)
            {
                migrationBuilder.Sql($@"
                    INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""CreatedAt"")
                    SELECT '{name}', '{icon}', '{color}', {type}, 0, {sortOrder}, NOW()
                    WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '{name}' AND ""Type"" = {type} AND ""UserId"" = 0)
                ");
            }

            // 添加新的收入分类
            var incomeCategories = new[]
            {
                ("工资薪水", "💰", "#51CF66", 1, 1),
                ("奖金提成", "🏆", "#61D976", 1, 2),
                ("兼职收入", "💼", "#71E386", 1, 3),
                ("投资收益", "📈", "#41C556", 1, 4),
                ("红包收入", "🧧", "#FFD43B", 1, 5),
                ("租金收入", "🏠", "#FFE44B", 1, 6),
                ("报销退款", "💵", "#74C0FC", 1, 7),
                ("其他收入", "📝", "#AA96DA", 1, 8)
            };

            foreach (var (name, icon, color, type, sortOrder) in incomeCategories)
            {
                migrationBuilder.Sql($@"
                    INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""CreatedAt"")
                    SELECT '{name}', '{icon}', '{color}', {type}, 0, {sortOrder}, NOW()
                    WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '{name}' AND ""Type"" = {type} AND ""UserId"" = 0)
                ");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 删除新添加的分类（只删除没有关联交易记录的）
            var newCategories = new[]
            {
                "早餐", "午餐", "晚餐", "夜宵", "水果零食", "饮料奶茶",
                "公交地铁", "打车", "共享单车", "加油", "停车费", "火车机票",
                "日用品", "衣服鞋帽", "数码电子", "化妆护肤", "家居用品",
                "房租房贷", "水电燃气", "物业费", "宽带网费", "家政保洁",
                "电影演出", "游戏充值", "运动健身", "旅游度假", "KTV唱歌",
                "看病挂号", "买药", "体检",
                "书籍资料", "培训课程", "学费",
                "红包礼金", "请客送礼", "份子钱",
                "转账", "还款", "保险",
                "宠物", "烟酒", "其他支出",
                "工资薪水", "奖金提成", "兼职收入", "投资收益", "红包收入", "租金收入", "报销退款", "其他收入"
            };

            foreach (var name in newCategories)
            {
                migrationBuilder.Sql($@"
                    DELETE FROM ""Categories"" 
                    WHERE ""Name"" = '{name}' AND ""UserId"" = 0 
                    AND NOT EXISTS (SELECT 1 FROM ""Transactions"" WHERE ""CategoryId"" = ""Categories"".""Id"")
                ");
            }
        }
    }
}
