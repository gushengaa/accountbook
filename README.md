# 记账微信小程序 - 全栈项目

基于 ASP.NET Core 8 后端 + uni-app 前端的记账微信小程序完整解决方案。

## 项目结构

```
AI记账/
├── AccountBook.sln              # .NET 解决方案
├── src/                         # 后端代码
│   ├── AccountBook.Api/         # Web API 项目
│   ├── AccountBook.Core/        # 业务逻辑层
│   ├── AccountBook.Infrastructure/ # 数据访问层
│   └── AccountBook.Shared/      # 共享模型
├── frontend/                    # 前端代码（uni-app）
│   ├── pages/                   # 页面
│   ├── utils/                   # 工具函数
│   ├── store/                   # 状态管理
│   └── static/                  # 静态资源
└── README.md                    # 项目文档
```

## 技术栈

### 后端
- **框架**: ASP.NET Core 8.0
- **数据库**: PostgreSQL
- **ORM**: Entity Framework Core 8.0
- **认证**: JWT Bearer Token
- **API文档**: Swagger
- **日志**: Serilog

### 前端
- **框架**: uni-app (Vue 3)
- **状态管理**: Vuex
- **UI风格**: 生活化、渐变色彩

## 快速开始

### 1. 后端设置

#### 1.1 配置数据库

编辑 `src/AccountBook.Api/appsettings.json`：

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=AccountBookDb;Username=postgres;Password=your_password"
  }
}
```

**PostgreSQL 连接字符串格式：**
- `Host`: 数据库服务器地址（本地为 localhost）
- `Port`: 端口号（默认 5432）
- `Database`: 数据库名称
- `Username`: 数据库用户名
- `Password`: 数据库密码

**创建数据库：**
```sql
CREATE DATABASE AccountBookDb;
```

#### 1.2 配置微信小程序

```json
{
  "WeChat": {
    "AppId": "你的微信小程序AppId",
    "AppSecret": "你的微信小程序AppSecret"
  }
}
```

#### 1.3 配置 JWT

```json
{
  "Jwt": {
    "Key": "你的JWT密钥（至少32个字符）"
  }
}
```

#### 1.4 运行后端

```bash
cd src/AccountBook.Api
dotnet restore
dotnet run
```

后端启动后访问：`https://localhost:5001/swagger`

### 2. 前端设置

#### 2.1 安装依赖

```bash
cd frontend
npm install
```

#### 2.2 配置 API 地址

编辑 `frontend/utils/api.js`：

```javascript
const BASE_URL = 'https://localhost:5001/api'; // 开发环境
// 或
const BASE_URL = 'https://your-api-domain.com/api'; // 生产环境
```

#### 2.3 运行前端

**使用 HBuilderX：**
1. 使用 HBuilderX 打开 `frontend` 目录
2. 运行 -> 运行到小程序模拟器 -> 微信开发者工具

**使用命令行：**
```bash
npm run dev:mp-weixin
```

#### 2.4 在微信开发者工具中打开

构建完成后，在微信开发者工具中打开 `frontend/dist/dev/mp-weixin` 目录。

## 功能特性

### 后端 API

- ✅ 微信小程序登录（code2session）
- ✅ JWT Token 认证
- ✅ 账本管理（CRUD）
- ✅ 交易记录管理（CRUD）
- ✅ 分类管理（系统默认 + 用户自定义）
- ✅ 按日期范围查询
- ✅ 自动创建默认账本和分类

### 前端功能

- ✅ 微信授权登录
- ✅ 首页收支统计
- ✅ 快速记账（收入/支出）
- ✅ 多账本管理
- ✅ 数据统计（今天/本周/本月）
- ✅ 分类统计
- ✅ 生活化 UI 设计

## API 接口文档

启动后端后，访问 `https://localhost:5001/swagger` 查看完整的 API 文档。

### 主要接口

#### 认证
- `POST /api/auth/wechat-login` - 微信登录

#### 账本
- `GET /api/accountbooks` - 获取所有账本
- `POST /api/accountbooks` - 创建账本
- `PUT /api/accountbooks/{id}` - 更新账本
- `DELETE /api/accountbooks/{id}` - 删除账本
- `POST /api/accountbooks/{id}/set-default` - 设置默认账本

#### 交易记录
- `GET /api/transactions/account-book/{accountBookId}` - 获取账本交易记录
- `GET /api/transactions/account-book/{accountBookId}/date-range` - 按日期范围查询
- `POST /api/transactions` - 创建交易记录
- `PUT /api/transactions/{id}` - 更新交易记录
- `DELETE /api/transactions/{id}` - 删除交易记录

#### 分类
- `GET /api/categories?type=0` - 获取分类列表
- `POST /api/categories` - 创建分类
- `PUT /api/categories/{id}` - 更新分类
- `DELETE /api/categories/{id}` - 删除分类

## 数据库设计

### 主要表结构

- **Users**: 用户表
- **AccountBooks**: 账本表
- **Categories**: 分类表
- **Transactions**: 交易记录表

详细设计请参考 `src/AccountBook.Shared/Models/` 目录下的实体类。

## 开发指南

### 后端开发

1. **添加新 API**：
   - 在 `AccountBook.Core/Interfaces/` 定义接口
   - 在 `AccountBook.Core/Services/` 实现服务
   - 在 `AccountBook.Api/Controllers/` 创建控制器

2. **数据库迁移**：
   ```bash
   dotnet ef migrations add MigrationName --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api
   dotnet ef database update --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api
   ```

### 前端开发

1. **添加新页面**：
   - 在 `pages/` 目录创建页面
   - 在 `pages.json` 中注册页面

2. **API 调用**：
   - 在 `utils/api.js` 中添加 API 方法
   - 在页面中使用 `api.xxx.xxx()` 调用

3. **状态管理**：
   - 在 `store/index.js` 中添加状态和方法

## 部署

### 后端部署

1. 发布项目：
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. 部署到服务器（IIS / Docker / Azure）

3. 配置环境变量和连接字符串

### 前端部署

1. 构建生产版本：
   ```bash
   npm run build:mp-weixin
   ```

2. 在微信开发者工具中上传代码

3. 提交审核并发布

## 注意事项

1. **HTTPS**: 生产环境必须使用 HTTPS
2. **域名白名单**: 在微信公众平台配置服务器域名
3. **CORS**: 后端已配置允许跨域，生产环境建议限制域名
4. **Token 安全**: JWT Token 有效期 30 天，可根据需要调整
5. **金额精度**: 数据库以分为单位存储，避免浮点数精度问题

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发者。
