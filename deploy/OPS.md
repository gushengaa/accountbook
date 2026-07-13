# 日常运维手册

| 项目 | 值 |
|------|-----|
| 服务器 IP | `124.222.233.110` |
| 域名 | `www.planor.cn` |
| API 地址 | `https://www.planor.cn/accountbook/api` |
| 部署目录 | `/opt/accountbook` |

部署指南见 **[DEPLOY.md](./DEPLOY.md)**，数据库排错见 **[TROUBLESHOOTING-DB.md](./TROUBLESHOOTING-DB.md)**。

以下命令默认先进入项目目录：

```bash
cd /opt/accountbook
```

---

## 一、健康检查（建议每周）

### 容器状态

```bash
sudo docker compose ps
```

正常应看到 `accountbook-api`、`accountbook-postgres` 均为 **running**。

### API 可用性

```bash
curl -I http://127.0.0.1:8080/accountbook/swagger/index.html
curl -I https://www.planor.cn/accountbook/swagger/index.html
```

### 最近日志

```bash
sudo docker compose logs --tail=50 api
sudo docker compose logs --tail=20 postgres
```

持续跟踪（`Ctrl+C` 退出）：

```bash
sudo docker compose logs -f api
```

### 磁盘空间

```bash
df -h
sudo docker system df
```

建议系统盘至少保留 **20%** 空闲。

---

## 二、发布更新

### 用项目脚本（推荐）

```bash
cd /opt/accountbook
git pull                    # 若使用 Git
bash deploy/deploy.sh
```

### 在本机 PowerShell 上传代码
# 上传整个项目到服务器（会覆盖 /opt/accountbook 下对应文件）
scp -r "f:\AI记账\*" ubuntu@124.222.233.110:/opt/accountbook/
若只想传后端（改 API 时更快）：

scp -r "f:\AI记账\src" ubuntu@124.222.233.110:/opt/accountbook/
scp -r "f:\AI记账\deploy" ubuntu@124.222.233.110:/opt/accountbook/
scp "f:\AI记账\docker-compose.yml" ubuntu@124.222.233.110:/opt/accountbook/
scp "f:\AI记账\Dockerfile" ubuntu@124.222.233.110:/opt/accountbook/
注意：不要覆盖服务器上的 .env（里面有密码、密钥）。首次部署才需要配 .env。

脚本会：构建镜像 → 启动容器 → 本机健康检查。

### 手动构建

```bash
sudo docker compose up -d --build
```

### 修改 `.env` 后（微信、JWT、数据库密码等）

**不要用 `restart`**，必须重建容器：

```bash
sudo docker compose up -d --force-recreate
```

若修改了数据库密码，还需在 PostgreSQL 内同步：

```bash
sudo docker exec -it accountbook-postgres psql -U postgres -d AccountBook \
  -c "ALTER USER postgres WITH PASSWORD '你的新密码';"
```

并确保 `.env` 中 `POSTGRES_PASSWORD` 与 `DB_CONNECTION` 里的 `Password` **完全一致**。

密码含 `@`、`*` 等特殊字符时，`DB_CONNECTION` 中建议用单引号包裹：

```env
DB_CONNECTION=Host=postgres;Port=5432;Database=AccountBook;Username=postgres;Password='your@pass*';Timezone=UTC
```

---

## 三、数据库备份与恢复

### 手动备份

```bash
bash deploy/backup-db.sh
```

输出：`backups/accountbook_YYYYMMDD_HHMMSS.sql.gz`

### 定时备份（每天凌晨 3 点）

```bash
crontab -e
```

添加：

```cron
0 3 * * * cd /opt/accountbook && bash deploy/backup-db.sh >> /var/log/accountbook-backup.log 2>&1
```

### 下载备份到本机（Windows PowerShell）

```powershell
scp ubuntu@124.222.233.110:/opt/accountbook/backups/accountbook_*.sql.gz D:\backup\
```

### 从 `.sql.gz` 恢复（会覆盖当前数据）

```bash
bash deploy/restore-db.sh backups/accountbook_20260101_120000.sql.gz
sudo docker compose restart api
```

### 从 Windows 导出的 `.dump` 恢复

```bash
sudo docker exec -i accountbook-postgres pg_restore \
  -U postgres -d AccountBook \
  --clean --if-exists \
  < backups/AccountBook.dump
sudo docker compose restart api
```

---

## 四、重启与停止

| 操作 | 命令 |
|------|------|
| 重启 API | `sudo docker compose restart api` |
| 重启数据库 | `sudo docker compose restart postgres` |
| 重启全部 | `sudo docker compose restart` |
| 停止全部 | `sudo docker compose down` |
| 启动全部 | `sudo docker compose up -d` |

> `restart` 不会重新加载 `.env`；改配置请用 `up -d --force-recreate`。

---

## 五、HTTPS 证书

Let's Encrypt 证书约 90 天有效，Certbot 会自动续期。

```bash
sudo certbot renew --dry-run      # 测试续期
sudo certbot certificates         # 查看到期时间
```

手动续期（一般不需要）：

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 六、Nginx

```bash
sudo nginx -t                     # 测试配置
sudo systemctl reload nginx       # 重载
sudo systemctl status nginx       # 状态
```

站点配置：`/etc/nginx/sites-available/planor.cn`  
项目模板：`deploy/nginx/planor.cn.conf`

---

## 七、数据库排查

```bash
# 进入 psql
sudo docker exec -it accountbook-postgres psql -U postgres -d AccountBook

# API 实际连接串
sudo docker compose exec api printenv ConnectionStrings__DefaultConnection

# 数据库就绪
sudo docker compose exec postgres pg_isready -U postgres -d AccountBook
```

psql 常用命令：

```sql
\dt
SELECT COUNT(*) FROM "Users";
\q
```

---

## 八、常见问题速查

| 现象 | 处理 |
|------|------|
| 小程序「无效的 appid」 | 检查 `.env` 中 `WECHAT_*` → `up -d --force-recreate api` |
| `password authentication failed` | `POSTGRES_PASSWORD` 与 `DB_CONNECTION` 密码一致 + `ALTER USER` |
| 改 `.env` 不生效 | 用 `--force-recreate`，不要只用 `restart` |
| 502 / 站点打不开 | `docker compose ps` → `logs api` → `systemctl status nginx` |
| 磁盘满 | 清理旧备份；谨慎使用 `docker system prune` |
| 证书过期 | `certbot renew` + `reload nginx` |

---

## 九、安全建议

1. 安全组仅开放 **22、80、443**，不对公网开放 5432、8080
2. `.env` 不要提交 Git：`chmod 600 .env`
3. 备份至少保留一份在本机或对象存储
4. 定期系统更新：`sudo apt update && sudo apt upgrade -y`

---

## 十、命令速查卡

```bash
cd /opt/accountbook

sudo docker compose ps                              # 状态
sudo docker compose logs -f api                     # 日志
bash deploy/deploy.sh                               # 发布
sudo docker compose up -d --force-recreate          # 改 .env 后
bash deploy/backup-db.sh                            # 备份
curl -I https://www.planor.cn/accountbook/swagger/index.html
```
