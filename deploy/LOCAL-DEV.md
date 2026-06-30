# 本机调试 + 云服务器数据库

| 项目 | 值 |
|------|-----|
| 云服务器 | `124.222.233.110` |
| 本机公网 IP | `120.136.158.66`（若连不上，到 https://ip.cn 查最新 IP） |

---

## 当前情况：SSH 不可用，用直连

本机测试：**22 端口拒绝连接**（服务器未开 SSH 或未放行安全组），SSH 隧道用不了。

**5432 端口可通**，改用 **公网直连 PostgreSQL**，并在服务器 `pg_hba.conf` 放行本机 IP。

---

## 第一步：在服务器上放行本机 IP（只需做一次）

### 方式 A：服务器是 Windows（RDP 登录）

1. 远程桌面登录 `124.222.233.110`
2. 将 `deploy\fix-pg-hba-windows.ps1` 复制到服务器
3. 管理员 PowerShell 执行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
cd C:\path\to\script
# 若本机 IP 变了，先编辑脚本里的 $ClientIp
.\fix-pg-hba-windows.ps1
```

### 方式 B：服务器是 Linux + Docker PostgreSQL

```bash
docker exec -it accountbook-postgres sh -c "echo 'hostnossl AccountBook postgres 120.136.158.66/32 scram-sha-256' >> /var/lib/postgresql/data/pg_hba.conf"
docker exec -it accountbook-postgres psql -U postgres -c "SELECT pg_reload_conf();"
```

且 `docker-compose.yml` 中 postgres 端口需为 `"5432:5432"`（若仅 `127.0.0.1:5432` 则外网连不上）。

### 腾讯云安全组

确认 **5432** 已放行（建议来源填本机 IP `120.136.158.66/32`，不要对全网开放）。

---

## 第二步：本机启动 API

```powershell
cd f:\AI记账\src\AccountBook.Api
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run
```

`appsettings.Development.json` 已配置：

```
Host=124.222.233.110;...;SSL Mode=Disable
```

浏览器：`https://localhost:5001/swagger`

---

## 备选：修好 SSH 后用隧道（更安全）

在服务器上启用 SSH 后，可改回隧道方式，无需开放 5432 公网。

**Windows Server 开启 OpenSSH：**

```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
New-NetFirewallRule -Name sshd -DisplayName 'OpenSSH Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
```

腾讯云安全组放行 **22**，本机再执行 `.\deploy\dev-tunnel.ps1`。

---

## 常见错误

| 错误 | 处理 |
|------|------|
| `no pg_hba.conf entry for host "x.x.x.x"` | 在服务器运行 `fix-pg-hba-windows.ps1`，IP 改成 `x.x.x.x` |
| SSH `Connection refused` | 22 未开，用上面直连方案或开启 OpenSSH |
| `password authentication failed` | 检查 `appsettings.Development.json` 密码 |
| 本机 IP 变了（家用宽带） | 重新查 IP，更新 `pg_hba.conf` 对应行 |
