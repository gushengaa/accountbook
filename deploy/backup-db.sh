#!/bin/bash
# PostgreSQL 备份（Docker 容器 accountbook-postgres）
# 用法：bash deploy/backup-db.sh
# 备份文件：./backups/accountbook_YYYYMMDD_HHMMSS.sql.gz

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/accountbook_${TIMESTAMP}.sql.gz"

echo "==> 备份到 $FILE ..."
docker exec accountbook-postgres pg_dump -U postgres AccountBook | gzip > "$FILE"

echo "备份完成：$FILE ($(du -h "$FILE" | cut -f1))"
