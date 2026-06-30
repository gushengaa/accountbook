# 在【云服务器 124.222.233.110】上以管理员 PowerShell 运行
# 用途：允许本机开发电脑通过公网连接 PostgreSQL
# 用法：先修改 $ClientIp，再执行：
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\fix-pg-hba.ps1

$ClientIp = "120.136.158.66"   # 本机公网 IP，若变化请到 https://ip.cn 查看后修改
$DbName = "AccountBook"
$DbUser = "postgres"

# 自动查找 PostgreSQL 数据目录
$pgVersions = @(17, 16, 15, 14, 13)
$dataDir = $null
foreach ($v in $pgVersions) {
    $candidate = "C:\Program Files\PostgreSQL\$v\data"
    if (Test-Path "$candidate\pg_hba.conf") {
        $dataDir = $candidate
        break
    }
}

if (-not $dataDir) {
    Write-Host "错误：未找到 PostgreSQL data 目录，请手动指定 pg_hba.conf 路径" -ForegroundColor Red
    exit 1
}

$pgHba = Join-Path $dataDir "pg_hba.conf"
$pgConf = Join-Path $dataDir "postgresql.conf"
$entry = "hostnossl`t$DbName`t$DbUser`t${ClientIp}/32`tscram-sha-256"

Write-Host "数据目录: $dataDir"
Write-Host "添加规则: $entry"

$content = Get-Content $pgHba -Raw
if ($content -match [regex]::Escape($ClientIp)) {
    Write-Host "该 IP 已存在，跳过" -ForegroundColor Yellow
} else {
    Add-Content -Path $pgHba -Value ""
    Add-Content -Path $pgHba -Value "# AccountBook local dev - added by fix-pg-hba.ps1"
    Add-Content -Path $pgHba -Value $entry
    Write-Host "已写入 pg_hba.conf" -ForegroundColor Green
}

# 确保监听所有地址
$confLines = Get-Content $pgConf
if ($confLines -notmatch "^\s*listen_addresses\s*=\s*'\*'") {
  $updated = $false
  $newLines = foreach ($line in $confLines) {
    if ($line -match "^\s*#?\s*listen_addresses") {
      $updated = $true
      "listen_addresses = '*'"
    } else { $line }
  }
  if (-not $updated) { $newLines += "listen_addresses = '*'" }
  Set-Content -Path $pgConf -Value $newLines
  Write-Host "已设置 listen_addresses = '*'" -ForegroundColor Green
}

# 重启 PostgreSQL 服务
$svc = Get-Service -Name "postgresql*" | Select-Object -First 1
if ($svc) {
    Restart-Service $svc.Name
    Write-Host "已重启服务: $($svc.Name)" -ForegroundColor Green
} else {
    Write-Host "请手动重启 PostgreSQL 服务" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "完成。本机连接串示例：" -ForegroundColor Cyan
Write-Host "Host=124.222.233.110;Port=5432;Database=AccountBook;Username=postgres;Password=你的密码;Timezone=UTC;SSL Mode=Disable"
