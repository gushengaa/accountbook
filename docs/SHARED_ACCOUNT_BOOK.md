# 共享账本功能说明

## 功能概述

共享账本功能允许用户创建共享账本，邀请好友一起记账，适用于旅游、聚餐、活动等多人消费场景。

## 主要功能

### 1. 创建共享账本
- 设置账本名称和描述
- 设置预算金额（可选）
- 自动生成6位分享码

### 2. 分享账本
- 通过分享码邀请好友
- 分享码可复制分享
- 好友通过分享码加入

### 3. 成员管理
- 查看所有成员
- 创建者和管理员可以移除成员
- 成员可以退出账本

### 4. 记账功能
- 所有成员都可以记录支出
- 支持分类记账
- 记录备注和日期

### 5. 预算管理
- 行程开始前设置预算
- 实时显示预算进度
- 超支提醒

### 6. 统计功能
- 总支出统计
- 人均消费计算
- 分类支出统计（饼图）
- 预算剩余/超支显示

## 数据模型

### SharedAccountBook（共享账本）
- Id: 主键
- Name: 账本名称
- Description: 描述
- CreatorId: 创建者ID
- ShareCode: 分享码（6位）
- Budget: 预算金额（分）
- Status: 状态（0-进行中，1-已结束）
- CreatedAt/UpdatedAt: 时间戳

### AccountBookMember（账本成员）
- Id: 主键
- SharedAccountBookId: 共享账本ID
- UserId: 用户ID
- Role: 角色（0-成员，1-管理员）
- JoinedAt: 加入时间

### Transaction（交易记录）
- 支持普通账本和共享账本
- AccountBookId: 普通账本ID（可空）
- SharedAccountBookId: 共享账本ID（可空）

## API 接口

### 共享账本
- `POST /api/sharedaccountbooks` - 创建共享账本
- `GET /api/sharedaccountbooks` - 获取用户的共享账本列表
- `GET /api/sharedaccountbooks/{id}` - 获取共享账本详情
- `PUT /api/sharedaccountbooks/{id}` - 更新共享账本
- `DELETE /api/sharedaccountbooks/{id}` - 删除共享账本
- `POST /api/sharedaccountbooks/join` - 加入共享账本
- `POST /api/sharedaccountbooks/{id}/leave` - 退出共享账本
- `DELETE /api/sharedaccountbooks/{id}/members/{memberUserId}` - 移除成员
- `GET /api/sharedaccountbooks/{id}/statistics` - 获取统计信息

### 交易记录（支持共享账本）
- `GET /api/transactions/shared-account-book/{sharedAccountBookId}` - 获取共享账本交易记录
- `POST /api/transactions` - 创建交易记录（支持 sharedAccountBookId）

## 使用场景

### 旅游消费
1. 创建"2024年春节旅游"共享账本
2. 设置预算：5000元
3. 分享给同行好友
4. 每个人记录自己的支出
5. 行程结束后查看统计：
   - 总支出：4500元
   - 人均消费：1125元（4人）
   - 分类统计：交通30%、住宿40%、餐饮20%、其他10%

### 聚餐AA
1. 创建"周末聚餐"共享账本
2. 不设置预算
3. 分享给参与人员
4. 记录各项支出
5. 查看人均消费，方便AA结算

## 权限说明

- **创建者**：可以修改账本、删除账本、移除成员、结束账本
- **管理员**：可以修改账本、移除普通成员
- **普通成员**：可以记账、查看统计、退出账本

## 注意事项

1. 创建者不能退出账本，只能删除账本
2. 删除账本会同时删除所有相关数据
3. 分享码是6位字母数字组合，不区分大小写
4. 预算金额以元为单位，数据库存储为分
5. 统计只计算支出，不计算收入

## 前端页面

- `/pages/shared-account-books/shared-account-books` - 共享账本列表
- `/pages/create-shared-account-book/create-shared-account-book` - 创建共享账本
- `/pages/shared-account-book-detail/shared-account-book-detail` - 账本详情
- `/pages/shared-account-book-statistics/shared-account-book-statistics` - 统计页面
- `/pages/shared-account-book-members/shared-account-book-members` - 成员管理
- `/pages/shared-account-book-settings/shared-account-book-settings` - 账本设置

## 数据库迁移

需要创建新的数据库迁移来添加共享账本相关的表：

```bash
dotnet ef migrations add AddSharedAccountBook --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api
dotnet ef database update --project src/AccountBook.Infrastructure --startup-project src/AccountBook.Api
```










