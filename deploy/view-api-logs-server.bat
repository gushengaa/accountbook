@echo off
REM Copy view-api-logs.ps1 and this bat to C:\inetpub\API\accountbook

set "API_DIR=%~dp0"
set "API_DIR=%API_DIR:~0,-1%"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0view-api-logs.ps1" -ApiDir "%API_DIR%"
if errorlevel 1 pause
