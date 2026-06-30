#!/bin/bash
# 从 SQL 备份恢复 PostgreSQL
# 用法：bash deploy/restore-db.sh backups/accountbook_20260101_120000.sql.gz
#       bash deploy/restore-db.sh backups/accountbook.sql   # 未压缩的 .sql 也可

set -e

if [ -z "$1" ]; then
  echo "用法: bash deploy/restore-db.sh <备份文件.sql 或 .sql.gz>"
  exit 1
fi

BACKUP="$1"
if [ ! -f "$BACKUP" ]; then
  echo "错误：文件不存在 $BACKUP"
  exit 1
fi

echo "警告：将覆盖当前 AccountBook 数据库，10 秒后继续（Ctrl+C 取消）..."
sleep 10

echo "==> 恢复数据库..."
if [[ "$BACKUP" == *.gz ]]; then
  gunzip -c "$BACKUP" | docker exec -i accountbook-postgres psql -U postgres -d AccountBook
else
  docker exec -i accountbook-postgres psql -U postgres -d AccountBook < "$BACKUP"
fi

echo "恢复完成"
