# 手动数据库迁移指南

## 说明

由于迁移文件之间存在冲突，需要手动执行SQL脚本来完成数据库迁移。

## 执行步骤

### 方法一：使用 psql 命令行工具

1. 打开命令行或 PowerShell

2. 连接到 PostgreSQL 数据库：
```bash
psql -h 118.89.134.117 -p 5432 -U postgres -d AccountBook
```

3. 输入密码：`123456@`

4. 执行 SQL 脚本：
```bash
\i manual_migration.sql
```

或者直接复制粘贴 `manual_migration.sql` 文件中的内容到 psql 中执行。

### 方法二：使用数据库管理工具

1. 使用 pgAdmin、DBeaver、Navicat 等工具连接到数据库：
   - 主机：118.89.134.117
   - 端口：5432
   - 数据库：AccountBook
   - 用户名：postgres
   - 密码：123456@

2. 打开 `manual_migration.sql` 文件

3. 执行整个脚本

### 方法三：使用 .NET EF Core 工具（推荐）

如果数据库结构已经部分存在，可以先标记迁移为已应用，然后只执行缺失的部分：

```bash
# 标记迁移为已应用（如果数据库结构已存在）
dotnet ef database update 20251204082212_AddSharedAccountBook --project src/AccountBook.Infrastructure/AccountBook.Infrastructure.csproj --startup-project src/AccountBook.Api/AccountBook.Api.csproj

# 然后执行剩余的迁移
dotnet ef database update --project src/AccountBook.Infrastructure/AccountBook.Infrastructure.csproj --startup-project src/AccountBook.Api/AccountBook.Api.csproj
```

## SQL 脚本内容说明

脚本包含以下操作（使用 IF NOT EXISTS 检查，安全执行）：

1. **添加检查约束**：确保 Transactions 表中的 AccountBookId 和 SharedAccountBookId 互斥
2. **添加日期列**：为 SharedAccountBooks 表添加 StartDate 和 EndDate 列
3. **创建 TransactionImages 表**：创建交易图片表
4. **更新迁移历史**：标记迁移为已应用，避免重复执行

## 验证迁移是否成功

执行以下 SQL 查询验证：

```sql
-- 检查 TransactionImages 表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'TransactionImages';

-- 检查 StartDate 和 EndDate 列是否存在
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'SharedAccountBooks' 
AND column_name IN ('StartDate', 'EndDate');

-- 检查检查约束是否存在
SELECT conname 
FROM pg_constraint 
WHERE conname = 'CK_Transaction_AccountBookId_SharedAccountBookId';

-- 查看迁移历史
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```

## 注意事项

1. **备份数据库**：执行迁移前请先备份数据库
2. **检查现有数据**：如果数据库中已有数据，请确保迁移不会影响现有数据
3. **测试环境**：建议先在测试环境执行，确认无误后再在生产环境执行

## 如果遇到错误

如果执行过程中遇到错误，请检查：

1. 数据库连接是否正常
2. 用户权限是否足够
3. 相关表是否已存在
4. 迁移历史表 `__EFMigrationsHistory` 是否存在

如果表已存在但迁移历史未记录，可以手动插入迁移记录：

```sql
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('迁移名称', '8.0.0');
```










