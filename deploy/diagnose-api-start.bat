@echo off
setlocal EnableDelayedExpansion

REM Run in C:\inetpub\API\accountbook to see why IIS returns 500.30

set "API_DIR=%~1"
if not defined API_DIR set "API_DIR=%~dp0"
if "!API_DIR:~-1!"=="\" set "API_DIR=!API_DIR:~0,-1!"

cd /d "!API_DIR!"

echo ============================================
echo  API startup diagnose
echo  Dir: !API_DIR!
echo ============================================
echo.

echo [1] .NET runtimes:
dotnet --list-runtimes
echo.

echo [2] Need Microsoft.AspNetCore.App 9.x for this project
echo.

if not exist "!API_DIR!\AccountBook.Api.dll" (
    echo [ERROR] AccountBook.Api.dll not found
    pause
    exit /b 1
)

echo [3] Starting API in console (same as IIS would)...
echo     Watch for red error below. Ctrl+C to stop.
echo.

set ASPNETCORE_ENVIRONMENT=Production
dotnet "!API_DIR!\AccountBook.Api.dll"

echo.
echo Exit code: !ERRORLEVEL!
echo.
echo If failed above, common causes:
echo   - Missing .NET 9 Hosting Bundle
echo   - Database connection failed on startup
echo   - appsettings.json JSON syntax error
echo.
echo Also check: !API_DIR!\logs\stdout*.log
pause
