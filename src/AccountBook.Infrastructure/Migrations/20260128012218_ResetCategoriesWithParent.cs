using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountBook.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResetCategoriesWithParent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ========== 添加支出父分类 ==========
            migrationBuilder.Sql(@"
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '餐饮美食', '🍔', '#FF6B6B', 0, 0, 1, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '餐饮美食' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '交通出行', '🚗', '#4ECDC4', 0, 0, 2, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '交通出行' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '购物消费', '🛒', '#FFE66D', 0, 0, 3, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '购物消费' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '居家生活', '🏠', '#F38181', 0, 0, 4, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '居家生活' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '娱乐休闲', '🎬', '#A8E6CF', 0, 0, 5, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '娱乐休闲' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '医疗健康', '🏥', '#FF8B94', 0, 0, 6, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '医疗健康' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '学习教育', '📚', '#95E1D3', 0, 0, 7, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '学习教育' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '人情往来', '🧧', '#FFB6C1', 0, 0, 8, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '人情往来' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '金融理财', '💳', '#74C0FC', 0, 0, 9, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '金融理财' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '其他支出', '📝', '#AA96DA', 0, 0, 10, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '其他支出' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
            ");
            
            // ========== 更新现有支出子分类的 ParentId ==========
            migrationBuilder.Sql(@"
                -- 餐饮美食子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '餐饮美食' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('早餐', '午餐', '晚餐', '夜宵', '水果零食', '饮料奶茶') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 交通出行子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '交通出行' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('公交地铁', '打车', '共享单车', '加油', '停车费', '火车机票') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 购物消费子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '购物消费' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('日用品', '衣服鞋帽', '数码电子', '化妆护肤', '家居用品') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 居家生活子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '居家生活' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('房租房贷', '水电燃气', '物业费', '宽带网费', '家政保洁') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 娱乐休闲子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '娱乐休闲' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('电影演出', '游戏充值', '运动健身', '旅游度假', 'KTV唱歌') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 医疗健康子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '医疗健康' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('看病挂号', '买药', '体检') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 学习教育子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '学习教育' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('书籍资料', '培训课程', '学费') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 人情往来子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '人情往来' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('红包礼金', '请客送礼', '份子钱') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 金融理财子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '金融理财' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('转账', '还款', '保险') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 其他支出子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '其他支出' AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('宠物', '烟酒') AND ""Type"" = 0 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
            ");
            
            // ========== 添加收入父分类 ==========
            migrationBuilder.Sql(@"
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '工作收入', '💼', '#51CF66', 1, 0, 1, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '工作收入' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '投资理财', '📈', '#74C0FC', 1, 0, 2, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '投资理财' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
                
                INSERT INTO ""Categories"" (""Name"", ""Icon"", ""Color"", ""Type"", ""UserId"", ""SortOrder"", ""ParentId"", ""CreatedAt"")
                SELECT '其他收入', '📝', '#AA96DA', 1, 0, 3, NULL, NOW()
                WHERE NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = '其他收入' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL);
            ");
            
            // ========== 更新现有收入子分类的 ParentId ==========
            migrationBuilder.Sql(@"
                -- 工作收入子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '工作收入' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('工资薪水', '奖金提成', '兼职收入') AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 投资理财子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '投资理财' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('投资收益', '租金收入') AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
                
                -- 其他收入子类
                UPDATE ""Categories"" SET ""ParentId"" = (SELECT ""Id"" FROM ""Categories"" WHERE ""Name"" = '其他收入' AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL)
                WHERE ""Name"" IN ('红包收入', '报销退款') AND ""Type"" = 1 AND ""UserId"" = 0 AND ""ParentId"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 回滚：清空所有 ParentId
            migrationBuilder.Sql(@"
                UPDATE ""Categories"" SET ""ParentId"" = NULL WHERE ""UserId"" = 0;
            ");
            
            // 删除父分类（只删除那些是父分类的）
            migrationBuilder.Sql(@"
                DELETE FROM ""Categories"" 
                WHERE ""Name"" IN ('餐饮美食', '交通出行', '购物消费', '居家生活', '娱乐休闲', '医疗健康', '学习教育', '人情往来', '金融理财', '其他支出', '工作收入', '投资理财', '其他收入') 
                AND ""UserId"" = 0 
                AND ""ParentId"" IS NULL
                AND NOT EXISTS (SELECT 1 FROM ""Transactions"" WHERE ""CategoryId"" = ""Categories"".""Id"");
            ");
        }
    }
}
