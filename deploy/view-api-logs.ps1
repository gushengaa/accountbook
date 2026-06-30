param(
    [string]$ApiDir = ""
)

$ErrorActionPreference = "Stop"

function Normalize-Dir([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $PSScriptRoot
    }
    $Path = $Path.Trim().Trim('"').Trim("'")
    $Path = $Path -replace "[`r`n]", ""
    return $Path.TrimEnd('\')
}

$ApiDir = Normalize-Dir $ApiDir
if ([string]::IsNullOrWhiteSpace($ApiDir)) {
    $ApiDir = $PSScriptRoot
}

$dllPath = Join-Path $ApiDir "AccountBook.Api.dll"
if (-not (Test-Path -LiteralPath $dllPath)) {
    $releaseDll = Join-Path $ApiDir "release\AccountBook.Api.dll"
    if (Test-Path -LiteralPath $releaseDll) {
        $ApiDir = Join-Path $ApiDir "release"
        $dllPath = $releaseDll
    } else {
        Write-Host "[ERROR] AccountBook.Api.dll not found under: $ApiDir" -ForegroundColor Red
        exit 1
    }
}

$logDir = Join-Path $ApiDir "logs"
if (-not (Test-Path -LiteralPath $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Get-LatestLogFile {
    param([string]$Dir, [string]$Filter)
    Get-ChildItem -LiteralPath $Dir -Filter $Filter -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
}

$serilogFile = Get-LatestLogFile $logDir "log-*.txt"
$stdoutFile  = Get-LatestLogFile $logDir "stdout*"

if (-not $serilogFile) {
    $today = Get-Date -Format "yyyyMMdd"
    $newLog = Join-Path $logDir "log-$today.txt"
    $serilogFile = Get-Item (New-Item -LiteralPath $newLog -ItemType File -Force)
}

Write-Host "============================================"
Write-Host " API live log (IIS can stay running)"
Write-Host " Dir     : $ApiDir"
Write-Host " Serilog : $($serilogFile.FullName)"
if ($stdoutFile) { Write-Host " Stdout  : $($stdoutFile.FullName)" }
Write-Host " Press Ctrl+C to exit"
Write-Host "============================================"
Write-Host ""

function Tail-FileShared {
    param([string]$Path, [string]$Label)

    if (-not (Test-Path -LiteralPath $Path)) { return }

    Write-Host ">>> watching: $Label" -ForegroundColor Cyan

    $fs = [System.IO.File]::Open(
        $Path,
        [System.IO.FileMode]::Open,
        [System.IO.FileAccess]::Read,
        [System.IO.FileShare]::ReadWrite)

    $reader = New-Object System.IO.StreamReader($fs, [System.Text.Encoding]::UTF8)
    $reader.BaseStream.Seek(0, [System.IO.SeekOrigin]::End) | Out-Null

    while ($true) {
        $line = $reader.ReadLine()
        if ($null -ne $line) {
            Write-Host $line
        } else {
            Start-Sleep -Milliseconds 400
        }
    }
}

try {
    Tail-FileShared -Path $serilogFile.FullName -Label "serilog"
}
catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checklist:"
    Write-Host "  1. Visit https://www.planor.cn/accountbook/swagger"
    Write-Host "  2. Grant IIS app pool write access to the logs folder"
    Write-Host "  3. Update appsettings.json (shared:true) and recycle app pool"
    exit 1
}
