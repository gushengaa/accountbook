#!/bin/bash
# 构建并启动 AccountBook API
# 用法：在 /opt/accountbook 目录下执行 bash deploy/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

COMPOSE_FILE="docker-compose.yml"

if [ ! -f .env ]; then
  echo "错误：未找到 .env 文件"
  echo "请先执行：cp .env.example .env 并填写配置"
  exit 1
fi

echo "==> 执行数据库迁移..."
bash deploy/migrate-db.sh || echo "警告：迁移脚本失败，请手动执行 deploy/migrate-db.sh"

echo "==> 构建并启动容器..."
docker compose -f "$COMPOSE_FILE" up -d --build

echo "==> 等待服务启动..."
sleep 8

echo "==> 检查容器状态..."
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "==> 本机健康检查..."
if curl -sf http://127.0.0.1:8080/accountbook/health > /dev/null; then
  echo "API 实例 8080 运行正常"
else
  echo "警告：8080 健康检查未通过"
fi

if curl -sf http://127.0.0.1:8081/accountbook/health > /dev/null; then
  echo "API 实例 8081 运行正常"
else
  echo "警告：8081 健康检查未通过"
fi

echo ""
echo "部署完成。对外地址：https://www.planor.cn/accountbook/api"
