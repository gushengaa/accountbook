# 记账小程序 - 前端

基于 uni-app 开发的记账微信小程序前端。

## 技术栈

- **框架**: uni-app (Vue 3)
- **状态管理**: Vuex
- **UI风格**: 生活化、渐变色彩

## 项目结构

```
frontend/
├── pages/              # 页面
│   ├── index/          # 首页
│   ├── add-transaction/# 记账页
│   ├── statistics/     # 统计页
│   ├── account-books/  # 账本页
│   ├── profile/         # 我的
│   └── login/          # 登录页
├── utils/              # 工具函数
│   ├── api.js          # API 请求封装
│   └── util.js         # 通用工具函数
├── store/              # 状态管理
│   └── index.js        # Vuex store
├── static/             # 静态资源
├── App.vue             # 应用入口
├── main.js             # 主入口文件
├── pages.json          # 页面配置
└── manifest.json       # 应用配置
```

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置 API 地址

编辑 `utils/api.js`，修改 `BASE_URL`：

```javascript
const BASE_URL = 'https://your-api-domain.com/api'; // 生产环境API地址
```

### 3. 运行项目

#### 使用 HBuilderX

1. 使用 HBuilderX 打开 `frontend` 目录
2. 运行 -> 运行到小程序模拟器 -> 微信开发者工具

#### 使用命令行

```bash
# 开发环境
npm run dev:mp-weixin

# 生产构建
npm run build:mp-weixin
```

### 4. 在微信开发者工具中打开

构建完成后，在微信开发者工具中打开 `frontend/dist/dev/mp-weixin` 目录。

## 功能说明

### 1. 登录
- 微信授权登录
- 自动保存 Token 和用户信息

### 2. 首页
- 显示本月收支统计
- 快捷记账入口
- 最近交易记录

### 3. 记账
- 支持收入和支出
- 分类选择
- 金额输入
- 备注和日期

### 4. 统计
- 按时间范围统计（今天/本周/本月）
- 分类统计
- 收支对比

### 5. 账本管理
- 多账本支持
- 创建、切换账本
- 设置默认账本

## 页面说明

### 登录页 (`pages/login/login.vue`)
- 微信快速登录
- 自动获取用户信息（可选）

### 首页 (`pages/index/index.vue`)
- 收支统计卡片
- 快捷操作按钮
- 最近交易列表

### 记账页 (`pages/add-transaction/add-transaction.vue`)
- 类型选择（收入/支出）
- 金额输入
- 分类选择
- 备注和日期

### 统计页 (`pages/statistics/statistics.vue`)
- 时间范围选择
- 收支统计
- 分类占比

### 账本页 (`pages/account-books/account-books.vue`)
- 账本列表
- 创建新账本
- 切换账本

### 我的 (`pages/profile/profile.vue`)
- 用户信息
- 功能入口
- 退出登录

## 状态管理

使用 Vuex 管理全局状态：

- `token`: 登录 Token
- `userInfo`: 用户信息
- `currentAccountBook`: 当前账本
- `accountBooks`: 账本列表

## API 接口

所有 API 请求封装在 `utils/api.js` 中：

- `api.auth.wechatLogin()` - 微信登录
- `api.accountBooks.*` - 账本相关
- `api.transactions.*` - 交易记录相关
- `api.categories.*` - 分类相关

## UI 设计

- **主色调**: 渐变色（#FF6B6B 到 #FF8E8E）
- **风格**: 生活化、圆角卡片、柔和阴影
- **图标**: Emoji 图标
- **布局**: 卡片式布局，清晰层次

## 注意事项

1. **API 地址**: 开发时需要配置正确的后端 API 地址
2. **微信配置**: 需要在微信公众平台配置小程序 AppId
3. **HTTPS**: 生产环境必须使用 HTTPS
4. **域名白名单**: 需要在微信公众平台配置服务器域名

## 开发建议

1. **图片资源**: 将图片放在 `static` 目录
2. **样式**: 使用 SCSS 变量统一管理颜色和尺寸
3. **错误处理**: API 请求已统一处理错误和 Token 过期
4. **性能优化**: 使用防抖和节流优化用户交互

## 部署

1. 构建生产版本：`npm run build:mp-weixin`
2. 在微信开发者工具中上传代码
3. 提交审核
4. 发布上线



