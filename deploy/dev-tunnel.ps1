# 本机开发：通过 SSH 隧道连接云服务器数据库
# 用法：在 PowerShell 中执行 .\deploy\dev-tunnel.ps1
# 保持此窗口不要关闭，然后在另一个终端 dotnet run

$Server = "124.222.233.110"
$User = "root"
$LocalPort = 5432
$RemotePort = 5432

Write-Host "正在建立 SSH 隧道..." -ForegroundColor Cyan
Write-Host "  本机 localhost:${LocalPort}  ->  ${Server}:${RemotePort}" -ForegroundColor Gray
Write-Host ""
Write-Host "隧道建立后，在另一个终端执行：" -ForegroundColor Yellow
Write-Host "  cd src\AccountBook.Api" -ForegroundColor White
Write-Host "  `$env:ASPNETCORE_ENVIRONMENT='Development'" -ForegroundColor White
Write-Host "  dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 可断开隧道" -ForegroundColor Gray
Write-Host ""

ssh -N -L "${LocalPort}:127.0.0.1:${RemotePort}" "${User}@${Server}"
