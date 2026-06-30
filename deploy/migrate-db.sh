#!/bin/bash
# 独立执行数据库迁移（部署前运行，避免多实例并发 Migrate）
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "==> 执行 EF Core 数据库迁移..."
dotnet ef database update \
  --project src/AccountBook.Infrastructure/AccountBook.Infrastructure.csproj \
  --startup-project src/AccountBook.Api/AccountBook.Api.csproj

echo "==> 迁移完成"
