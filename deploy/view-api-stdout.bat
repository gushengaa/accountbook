@echo off
chcp 65001 >nul
setlocal

REM IIS stdout 日志（需在 web.config 中 stdoutLogEnabled="true"）
set "API_DIR=%~1"
if "%API_DIR%"=="" set "API_DIR=%~dp0"

set "LOG_DIR=%API_DIR%\logs"
if not exist "%LOG_DIR%" (
    echo [错误] 未找到 logs 目录: %LOG_DIR%
    pause
    exit /b 1
)

echo ============================================
echo  IIS stdout 日志
echo  目录: %LOG_DIR%
echo  按 Ctrl+C 退出
echo ============================================
echo.

powershell -NoProfile -Command ^
  "Get-ChildItem '%LOG_DIR%\stdout*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Get-Content $_.FullName -Wait -Tail 50 -Encoding UTF8 }"

if errorlevel 1 (
    echo [提示] 没有 stdout 日志文件
    echo 请在 web.config 设置 stdoutLogEnabled="true" 并回收应用程序池
)
pause
endlocal
