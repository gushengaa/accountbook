@echo off
chcp 65001 >nul
setlocal

REM ============================================
REM  服务器专用：控制台启动 API（调试日志）
REM  使用前请先在 IIS 中停止对应站点
REM
REM  用法:
REM    start-api-server.bat
REM    start-api-server.bat "C:\inetpub\wwwroot\accountbook"
REM ============================================

set "API_DIR=%~1"
if "%API_DIR%"=="" set "API_DIR=%~dp0"

if not exist "%API_DIR%\AccountBook.Api.dll" (
    echo [错误] 未找到 AccountBook.Api.dll
    echo 当前目录: %API_DIR%
    echo.
    echo 示例:
    echo   start-api-server.bat "C:\inetpub\wwwroot\accountbook"
    pause
    exit /b 1
)

cd /d "%API_DIR%"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://0.0.0.0:5000
set PathBase=/accountbook

echo ============================================
echo  记账 API - 服务器控制台模式
echo  目录: %API_DIR%
echo  监听: http://0.0.0.0:5000
echo.
echo  【本机访问 - 在服务器上打开浏览器】
echo    http://localhost:5000/accountbook/swagger
echo.
echo  【不要用】https://www.planor.cn/... 
echo    IIS 停止后域名不会转到本进程
echo.
echo  排查完按 Ctrl+C 停止，再在 IIS 里启动站点
echo ============================================
echo.

dotnet AccountBook.Api.dll

if errorlevel 1 (
    echo.
    echo [启动失败] 检查: dotnet --list-runtimes
    echo 端口占用: netstat -ano ^| findstr :5000
    pause
)
endlocal
