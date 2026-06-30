-- 支付方式配置表（管理员可维护）
-- 执行前请备份数据库

CREATE TABLE IF NOT EXISTS "PaymentMethodTypes" (
    "Id" serial PRIMARY KEY,
    "Value" integer NOT NULL,
    "Name" character varying(50) NOT NULL,
    "Icon" character varying(100),
    "Color" character varying(20),
    "SortOrder" integer NOT NULL DEFAULT 0,
    "IsVisible" boolean NOT NULL DEFAULT TRUE,
    "CreatedAt" timestamp with time zone NOT NULL,
    "UpdatedAt" timestamp with time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PaymentMethodTypes_Value" ON "PaymentMethodTypes" ("Value");

-- 首次初始化默认支付方式（表为空时）
INSERT INTO "PaymentMethodTypes" ("Value", "Name", "Icon", "Color", "SortOrder", "IsVisible", "CreatedAt", "UpdatedAt")
SELECT * FROM (VALUES
    (0, '现金', '💵', '#73B764', 0, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (1, '支付宝', '🔵', '#1677FF', 1, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (2, '微信', '🟢', '#07C160', 2, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (3, '云闪付', '🔴', '#E61F28', 3, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (4, '信用卡', '💳', '#5B6EE1', 4, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (5, '储蓄卡', '🏦', '#FA8C16', 5, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC'),
    (99, '其他', '📝', '#BFBFBF', 99, TRUE, NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC')
) AS v("Value", "Name", "Icon", "Color", "SortOrder", "IsVisible", "CreatedAt", "UpdatedAt")
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethodTypes" LIMIT 1);
