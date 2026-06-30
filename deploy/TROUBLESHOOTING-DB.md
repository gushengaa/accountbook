# PostgreSQL 连接被拒绝：pg_hba.conf 排错

## 错误含义

```
no pg_hba.conf entry for host "120.136.158.66", user "postgres", database "AccountBook", no encryption
```

表示：**客户端 IP `120.136.158.66`** 访问服务器 **`124.222.233.110:5432`** 时，PostgreSQL 的访问控制列表里没有允许这条规则。

---

## 先判断你的场景

### 场景 A：API 在服务器 Docker 里跑（生产，推荐）

`.env` 必须用 Docker 内部服务名，**不要用公网 IP**：

```env
DB_CONNECTION=Host=postgres;Port=5432;Database=AccountBook;Username=postgres;Password=你的密码;Timezone=UTC
```

然后重启：

```bash
cd /opt/accountbook
docker compose down
docker compose up -d --build
docker compose logs -f api
```

API 与数据库在同一 Docker 网络内，不经过公网，也不会触发 `pg_hba` 对外 IP 限制。

---

### 场景 B：本机开发（dotnet run），连远程库 124.222.233.110

你本机公网 IP 是 `120.136.158.66`（与截图一致），需要在**服务器上的 PostgreSQL** 放行该 IP。

#### B1. 数据库在 Docker 容器里

**1）若 5432 只绑定了 127.0.0.1（当前 docker-compose 默认）**

外网无法直连，本机开发请用 **SSH 隧道**（推荐）：

```powershell
# 在你本机 Windows PowerShell 执行
ssh -L 5432:127.0.0.1:5432 root@124.222.233.110
```

保持该窗口不关，本机连接串改为：

```
Host=localhost;Port=5432;Database=AccountBook;Username=postgres;Password=你的密码;Timezone=UTC
```

**2）若必须从外网直连 5432**（不推荐生产）

修改 `docker-compose.yml` 中 postgres 端口为 `"5432:5432"`，并在服务器执行：

```bash
docker exec -it accountbook-postgres sh -c "echo 'hostnossl AccountBook postgres 120.136.158.66/32 scram-sha-256' >> /var/lib/postgresql/data/pg_hba.conf"
docker exec -it accountbook-postgres psql -U postgres -c "SELECT pg_reload_conf();"
```

腾讯云安全组还需临时放行 **5432**（仅你的 IP `120.136.158.66/32`）。

#### B2. 数据库是 Windows 原生安装的 PostgreSQL

在服务器 `124.222.233.110` 上编辑：

`C:\Program Files\PostgreSQL\16\data\pg_hba.conf`

末尾添加：

```
hostnossl  AccountBook  postgres  120.136.158.66/32  scram-sha-256
```

确认 `postgresql.conf` 中：

```
listen_addresses = '*'
```

重启 PostgreSQL 服务，并在腾讯云安全组放行 5432（建议仅你的 IP）。

---

## 本机 appsettings.json 注意

当前 `appsettings.json` 写的是 `Host=124.222.233.110`，本机 `dotnet run` 会走公网连库。

开发环境建议：

- 用 `appsettings.Development.json` 写 `Host=localhost`（配合 SSH 隧道）
- 或本机装 PostgreSQL 做开发库
- **不要把生产库密码提交到 Git**

---

## 快速自检

在服务器上：

```bash
# Docker 内 API 能否连库
docker compose exec api curl -sf http://localhost:8080/accountbook/swagger/index.html

# 数据库是否健康
docker compose exec postgres pg_isready -U postgres -d AccountBook

# 查看 API 用的连接串（密码会显示，注意环境）
docker compose exec api printenv ConnectionStrings__DefaultConnection
```

在本机：

```powershell
# 测试能否连上 5432（若未开公网 5432 会失败，正常）
Test-NetConnection 124.222.233.110 -Port 5432
```

---

## 总结

| 运行位置 | 连接串 Host | 是否需要改 pg_hba |
|----------|-------------|-------------------|
| 服务器 Docker API | `postgres` | 否 |
| 本机开发 + SSH 隧道 | `localhost` | 否 |
| 本机开发 + 公网直连 | `124.222.233.110` | **是**，需放行 `120.136.158.66` |
