# 腾讯云 Linux + Docker 部署指南

| 项目 | 值 |
|------|-----|
| 云厂商 | 腾讯云 |
| 服务器 IP | `124.222.233.110` |
| 域名 | `www.planor.cn` |
| API 地址 | `https://www.planor.cn/accountbook/api` |
| 部署目录 | `/opt/accountbook` |
| 数据库 | **本机 Docker PostgreSQL**（与 API 同服务器） |

---

## ⚠️ 重装系统前：先备份数据库

数据库也在本机上，**重装 Ubuntu 会清空系统盘**，务必先导出数据。

### 若当前仍是 Windows + IIS + 本机 PostgreSQL

在 **重装前** 于 Windows 服务器上执行（按实际安装路径调整）：

```powershell
# 示例：PostgreSQL 默认安装路径
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d AccountBook -F c -f C:\backup\AccountBook.dump
```

将 `AccountBook.dump` 下载到本机保存。

### 若数据在旧 IP（如 118.89.134.117）

在能访问该库的机器上：

```bash
pg_dump -h 118.89.134.117 -U postgres -d AccountBook | gzip > accountbook_backup.sql.gz
```

---

## 一、腾讯云控制台

### 1. 重装系统

1. [腾讯云 CVM 控制台](https://console.cloud.tencent.com/cvm)
2. 实例 → **更多** → **重装系统**
3. 选择 **Ubuntu Server 24.04 LTS 64位**
4. 设置 root 密码或 SSH 密钥

### 2. 安全组（入站规则）

| 端口 | 说明 |
|------|------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

**不要**放行 8080、5432。API 经 Nginx 访问；数据库仅 Docker 内网 + 本机 127.0.0.1。

### 3. DNS

| 记录 | 类型 | 值 |
|------|------|-----|
| `www` | A | `124.222.233.110` |
| `@` | A | `124.222.233.110`（可选） |

---

## 二、SSH 登录

```bash
ssh root@124.222.233.110
```

---

## 三、初始化服务器

```bash
cd /opt/accountbook
sudo bash deploy/setup-server.sh
```

---

## 四、上传代码

```powershell
# Windows 本机
scp -r f:\AI记账 root@124.222.233.110:/opt/accountbook
```

或 Git clone 到 `/opt/accountbook`。

---

## 五、配置 `.env`

```bash
cd /opt/accountbook
cp .env.example .env
nano .env
```

**重点**：`POSTGRES_PASSWORD` 与 `DB_CONNECTION` 里的 `Password` 必须一致。

```env
POSTGRES_PASSWORD=你的强密码
DB_CONNECTION=Host=postgres;Port=5432;Database=AccountBook;Username=postgres;Password=你的强密码;Timezone=UTC
JWT_KEY=你的JWT密钥
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
# OSS 等其余配置
```

---

## 六、部署 API + PostgreSQL

```bash
bash deploy/deploy.sh
```

会同时启动：

- `accountbook-api`（8080，PathBase `/accountbook`）
- `accountbook-postgres`（数据卷 `postgres_data`，持久化）

验证：

```bash
docker compose ps
curl http://127.0.0.1:8080/accountbook/swagger/index.html
```

---

## 七、恢复旧数据库（若有备份）

将备份文件上传到服务器，例如 `/opt/accountbook/backups/`：

```bash
# .sql.gz 文本备份
bash deploy/restore-db.sh backups/accountbook_backup.sql.gz

# 或 Windows 导出的 custom 格式 .dump
docker exec -i accountbook-postgres pg_restore -U postgres -d AccountBook --clean --if-exists < backups/AccountBook.dump
```

恢复后重启 API：

```bash
docker compose restart api
```

---

## 八、Nginx + HTTPS

```bash
sudo bash deploy/install-nginx.sh
sudo certbot --nginx -d www.planor.cn -d planor.cn
```

验证：

```bash
curl -I https://www.planor.cn/accountbook/swagger/index.html
```

---

## 九、日常运维

详见 **[OPS.md](./OPS.md)**（发布、备份、日志、证书、排错等）。

```bash
cd /opt/accountbook
git pull && bash deploy/deploy.sh    # 更新部署
bash deploy/backup-db.sh             # 数据库备份
docker compose logs -f api           # 查看日志
```

---

## 十、上线检查清单

- [ ] 重装前已备份旧库（如有历史数据）
- [ ] 安全组仅 22/80/443，未开放 5432、8080
- [ ] `.env` 中 `POSTGRES_PASSWORD` 与 `DB_CONNECTION` 密码一致
- [ ] `curl https://www.planor.cn/accountbook/swagger/index.html` 正常
- [ ] 小程序登录、记账功能正常
- [ ] 已配置 `deploy/backup-db.sh` 定时备份

---

## 十一、架构

```
微信小程序
    ↓ HTTPS
www.planor.cn:443
    ↓
Nginx + Let's Encrypt
    ↓ HTTP :8080
┌─────────────────────────────────────┐
│  Docker（124.222.233.110）           │
│  ├── accountbook-api                │
│  └── accountbook-postgres (volume)  │
└─────────────────────────────────────┘
    ↓
阿里云 OSS（图片）
```

---

## 十二、常见问题

详见 **[TROUBLESHOOTING-DB.md](./TROUBLESHOOTING-DB.md)**（`pg_hba.conf`、本机开发连远程库等）。

本机调试见 **[LOCAL-DEV-WINDOWS.md](./LOCAL-DEV-WINDOWS.md)**（当前服务器为 Windows + RDP + pg_hba）。

**Q：全新部署没有旧数据？**  
首次启动会跑 `DbInitializer` 初始化默认分类等；无用户/账本数据，需小程序重新注册或从备份恢复。

**Q：如何本机连库排查？**  
```bash
docker exec -it accountbook-postgres psql -U postgres -d AccountBook
```

**Q：仍想用外部数据库？**  
改用 `docker compose -f docker-compose.external-db.yml up -d --build`，并修改 `.env` 中 `DB_CONNECTION` 为外部地址。
