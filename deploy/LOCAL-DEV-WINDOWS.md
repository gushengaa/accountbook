# 本机调试（服务器仍是 Windows）

| 项目 | 值 |
|------|-----|
| 云服务器 | `124.222.233.110`（Windows Server） |
| 本机公网 IP | `120.136.158.66`（变了请到 https://ip.cn 查看） |
| 登录方式 | 远程桌面 RDP（不是 SSH） |

SSH 隧道在 Windows 服务器上通常不可用，请用 **公网直连 5432 + pg_hba 放行本机 IP**。

---

## 一、腾讯云安全组

[安全组入站规则](https://console.cloud.tencent.com/vpc/security-group) 添加：

| 端口 | 来源 | 说明 |
|------|------|------|
| 3389 | 你的 IP | 远程桌面 |
| 5432 | `120.136.158.66/32` | 本机连 PostgreSQL（IP 变了要改） |

---

## 二、远程桌面登录服务器

本机 Win+R → `mstsc` → 计算机填 `124.222.233.110` → 用管理员账号登录。

---

## 三、在服务器上放行本机 IP

### 方法 1：运行脚本（推荐）

1. 把本机 `f:\AI记账\deploy\fix-pg-hba-windows.ps1` 复制到服务器（QQ/微信/网盘均可）
2. 服务器上 **右键 PowerShell → 以管理员身份运行**：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
cd C:\Users\Administrator\Desktop   # 改成脚本所在目录
# 若本机 IP 不是 120.136.158.66，先用记事本改脚本第一行 $ClientIp
.\fix-pg-hba-windows.ps1
```

看到「已写入 pg_hba.conf」「已重启服务」即成功。

### 方法 2：手动改（脚本找不到 PostgreSQL 时）

1. 找到文件（常见路径）：
   `C:\Program Files\PostgreSQL\16\data\pg_hba.conf`
2. 用记事本 **以管理员打开**，在末尾加一行：

```
hostnossl  AccountBook  postgres  120.136.158.66/32  scram-sha-256
```

3. 同目录 `postgresql.conf` 确认有：

```
listen_addresses = '*'
```

4. Win+R → `services.msc` → 找到 `postgresql-x64-16`（版本号可能不同）→ **重新启动**

---

## 四、本机启动 API

```powershell
cd f:\AI记账\src\AccountBook.Api
$env:ASPNETCORE_ENVIRONMENT="Development"
dotnet run
```

浏览器打开：`https://localhost:5001/swagger`

连接串在 `appsettings.Development.json`：

```
Host=124.222.233.110;Port=5432;Database=AccountBook;...;SSL Mode=Disable
```

---

## 五、验证数据库能否连通

本机 PowerShell：

```powershell
Test-NetConnection 124.222.233.110 -Port 5432
```

`TcpTestSucceeded : True` 表示端口通。

---

## 六、常见错误

### `no pg_hba.conf entry for host "120.136.158.66"`

服务器上 **第三节** 没做或 IP 写错。查本机最新 IP 后重跑脚本。

### `password authentication failed`

`appsettings.Development.json` 里密码与服务器 PostgreSQL 密码不一致。  
在服务器 pgAdmin 或 psql 里确认 postgres 用户密码。

### `Connection refused` / 5432 不通

- 检查 PostgreSQL 服务是否在运行（`services.msc`）
- 检查腾讯云安全组是否放行 5432
- 检查 Windows 防火墙是否拦截 5432：

```powershell
# 在服务器管理员 PowerShell 执行
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

### 本机 IP 经常变（家用宽带）

每次连不上时到 https://ip.cn 查 IP，更新 `pg_hba.conf` 对应行并重启 PostgreSQL，或临时写成网段（安全性较低）：

```
hostnossl  AccountBook  postgres  120.136.0.0/16  scram-sha-256
```

---

## 七、以后换成 Linux + Docker

见 [DEPLOY.md](./DEPLOY.md)。届时 API 与数据库都在服务器 Docker 内，本机开发可再考虑 SSH 隧道。
