# PostgreSQL 数据库配置指南

## 安装 PostgreSQL

### Windows

1. 下载 PostgreSQL：https://www.postgresql.org/download/windows/
2. 运行安装程序，记住设置的 postgres 用户密码
3. 安装完成后，PostgreSQL 服务会自动启动

### macOS

```bash
# 使用 Homebrew
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 创建数据库

### 方法一：使用 psql 命令行

```bash
# 连接到 PostgreSQL（默认用户 postgres）
psql -U postgres

# 在 psql 中执行
CREATE DATABASE AccountBookDb;

# 退出
\q
```

### 方法二：使用 pgAdmin

1. 打开 pgAdmin
2. 连接到 PostgreSQL 服务器
3. 右键点击 "Databases" -> "Create" -> "Database"
4. 输入数据库名称：`AccountBookDb`
5. 点击 "Save"

## 配置连接字符串

编辑 `src/AccountBook.Api/appsettings.json`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=AccountBookDb;Username=postgres;Password=your_password"
  }
}
```

### 连接字符串参数说明

- **Host**: 数据库服务器地址
  - 本地：`localhost` 或 `127.0.0.1`
  - 远程：服务器 IP 地址或域名
- **Port**: PostgreSQL 端口（默认 5432）
- **Database**: 数据库名称（`AccountBookDb`）
- **Username**: 数据库用户名（默认 `postgres`）
- **Password**: 数据库密码

### 其他连接字符串格式

**使用 SSL：**
```
Host=localhost;Port=5432;Database=AccountBookDb;Username=postgres;Password=your_password;SSL Mode=Require
```

**使用连接池：**
```
Host=localhost;Port=5432;Database=AccountBookDb;Username=postgres;Password=your_password;Pooling=true;Minimum Pool Size=0;Maximum Pool Size=100
```

**远程连接：**
```
Host=your-server.com;Port=5432;Database=AccountBookDb;Username=postgres;Password=your_password
```

## 验证连接

运行后端项目，如果连接成功，应用启动时会自动：
1. 创建数据库表（如果不存在）
2. 初始化默认分类数据

如果连接失败，检查：
- PostgreSQL 服务是否运行
- 用户名和密码是否正确
- 数据库是否存在
- 防火墙是否允许连接

## 使用 EF Core Migrations（可选）

如果需要使用 Migrations 管理数据库：

```bash
# 创建迁移
dotnet ef migrations add InitialCreate --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api

# 应用迁移
dotnet ef database update --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api

# 查看迁移历史
dotnet ef migrations list --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api
```

## 常见问题

### 1. 连接被拒绝

**错误：** `Npgsql.NpgsqlException: Connection refused`

**解决方案：**
- 检查 PostgreSQL 服务是否运行
- 检查端口是否正确（默认 5432）
- 检查防火墙设置

### 2. 认证失败

**错误：** `Npgsql.NpgsqlException: password authentication failed`

**解决方案：**
- 确认用户名和密码正确
- 检查 `pg_hba.conf` 配置文件

### 3. 数据库不存在

**错误：** `database "AccountBookDb" does not exist`

**解决方案：**
- 先创建数据库（参考上面的"创建数据库"部分）
- 或修改连接字符串中的数据库名称

### 4. 权限不足

**错误：** `permission denied`

**解决方案：**
- 确保数据库用户有足够的权限
- 可以授予用户所有权限：
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE AccountBookDb TO postgres;
  ```

## 生产环境建议

1. **使用专用数据库用户**：不要使用 postgres 超级用户
   ```sql
   CREATE USER accountbook_user WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE AccountBookDb TO accountbook_user;
   ```

2. **启用 SSL**：生产环境建议启用 SSL 连接

3. **使用连接池**：配置合适的连接池大小

4. **备份策略**：定期备份数据库
   ```bash
   pg_dump -U postgres AccountBookDb > backup.sql
   ```

5. **监控**：使用 PostgreSQL 监控工具监控数据库性能

## 相关资源

- PostgreSQL 官方文档：https://www.postgresql.org/docs/
- Npgsql 文档：https://www.npgsql.org/doc/
- Entity Framework Core 文档：https://learn.microsoft.com/ef/core/



