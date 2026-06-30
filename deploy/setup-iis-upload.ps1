# Run as Administrator on the server
# Usage:
#   powershell -ExecutionPolicy Bypass -File setup-iis-upload.ps1 -ApiDir "C:\inetpub\API\accountbook" -AppPoolName "YourAppPoolName"

param(
    [string]$ApiDir = "C:\inetpub\API\accountbook",
    [string]$AppPoolName = ""
)

$ErrorActionPreference = "Stop"

Write-Host "Unlocking IIS upload settings..." -ForegroundColor Cyan
& "$env:windir\system32\inetsrv\appcmd.exe" unlock config -section:system.webServer/serverRuntime
& "$env:windir\system32\inetsrv\appcmd.exe" unlock config -section:system.webServer/security/requestFiltering

if (-not $AppPoolName) {
    Write-Host ""
    Write-Host "App pool name not specified. List site app pools:" -ForegroundColor Yellow
    & "$env:windir\system32\inetsrv\appcmd.exe" list apppool
    Write-Host ""
    $AppPoolName = Read-Host "Enter application pool name for accountbook"
}

$tempDir = Join-Path $ApiDir "temp"
$logsDir = Join-Path $ApiDir "logs"

foreach ($dir in @($tempDir, $logsDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$identity = "IIS AppPool\$AppPoolName"
Write-Host "Granting Modify to $identity on:" -ForegroundColor Cyan
Write-Host "  $tempDir"
Write-Host "  $logsDir"

foreach ($dir in @($tempDir, $logsDir)) {
    $acl = Get-Acl $dir
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $identity, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($rule)
  # Also grant IIS_IUSRS for in-process edge cases
    $iusrs = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "IIS_IUSRS", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($iusrs)
    Set-Acl $dir $acl
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "1. Ensure web.config has ASPNETCORE_TEMP=.\temp (included in publish output)"
Write-Host "2. Recycle app pool: $AppPoolName"
Write-Host "   appcmd recycle apppool /apppool.name:$AppPoolName"
Write-Host "3. Retry image upload"
