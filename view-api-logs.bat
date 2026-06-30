@echo off
setlocal EnableDelayedExpansion

REM Tail API logs while IIS keeps running (handles Serilog file lock)

set "API_DIR=%~1"
if not defined API_DIR set "API_DIR=%~dp0"
if "!API_DIR:~-1!"=="\" set "API_DIR=!API_DIR:~0,-1!"

set "PS1=%~dp0deploy\view-api-logs.ps1"
if not exist "!PS1!" set "PS1=%~dp0view-api-logs.ps1"
if not exist "!PS1!" (
    echo [ERROR] view-api-logs.ps1 not found
    pause
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "!PS1!" -ApiDir "!API_DIR!"
set "EC=!ERRORLEVEL!"
if not "!EC!"=="0" pause
exit /b !EC!
