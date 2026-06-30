@echo off
chcp 65001 >nul
setlocal

REM ============================================
REM  记账 API 快速启动
REM  用法:
REM    start-api.bat          优先启动 release 目录（生产）
REM    start-api.bat dev      从源码启动（Development）
REM    start-api.bat prod     从 release 目录启动（Production）
REM ============================================

set "ROOT=%~dp0"
set "MODE=%~1"
if /I "%MODE%"=="" set "MODE=prod"
if /I "%MODE%"=="release" set "MODE=prod"

if /I "%MODE%"=="dev" goto :DEV
if /I "%MODE%"=="prod" goto :PROD

echo 未知参数: %MODE%
echo 用法: start-api.bat [dev^|prod]
pause
exit /b 1

:PROD
set "API_DIR=%ROOT%release"
set "ASPNETCORE_ENVIRONMENT=Production"
set "ASPNETCORE_URLS=http://0.0.0.0:5000"
set "PathBase=/accountbook"
goto :RUN

:DEV
set "API_DIR=%ROOT%src\AccountBook.Api"
set "ASPNETCORE_ENVIRONMENT=Development"
set "ASPNETCORE_URLS=http://0.0.0.0:5000"
set "PathBase="
goto :RUN_DEV

:RUN
if not exist "%API_DIR%\AccountBook.Api.dll" (
    echo [错误] 未找到 %API_DIR%\AccountBook.Api.dll
    echo 请先发布: cd src\AccountBook.Api ^&^& dotnet publish -c Release -o ..\..\release
    pause
    exit /b 1
)
cd /d "%API_DIR%"
call :PRINT_INFO
dotnet AccountBook.Api.dll
goto :END

:RUN_DEV
if not exist "%API_DIR%\AccountBook.Api.csproj" (
    echo [错误] 未找到项目: %API_DIR%
    pause
    exit /b 1
)
cd /d "%API_DIR%"
call :PRINT_INFO_DEV
dotnet run --urls "%ASPNETCORE_URLS%"
goto :END

:PRINT_INFO
echo ============================================
echo  模式: %ASPNETCORE_ENVIRONMENT%
echo  目录: %API_DIR%
echo  监听: %ASPNETCORE_URLS%  （所有网卡）
echo.
echo  【重要】IIS 已停止时，不能用 www.planor.cn 访问！
echo  请在服务器本机浏览器打开:
echo    http://localhost:5000/accountbook/swagger
echo    http://localhost:5000/accountbook/api/...
echo.
echo  外网临时测试需放行 TCP 5000 并访问:
echo    http://124.222.233.110:5000/accountbook/swagger
echo  小程序仍依赖 IIS+HTTPS，控制台模式仅供排查日志
echo.
echo  按 Ctrl+C 停止，然后重新启动 IIS 站点
echo ============================================
goto :eof

:PRINT_INFO_DEV
echo ============================================
echo  模式: %ASPNETCORE_ENVIRONMENT%
echo  目录: %API_DIR%
echo  监听: %ASPNETCORE_URLS%
echo  Swagger: http://localhost:5000/swagger
echo  按 Ctrl+C 停止
echo ============================================
goto :eof

:END
if errorlevel 1 (
    echo.
    echo [启动失败] 常见原因:
    echo   1. 未安装 .NET 9 运行时 - 运行: dotnet --list-runtimes
    echo   2. 5000 端口被占用 - 运行: netstat -ano ^| findstr :5000
    echo   3. 数据库连不上 - 检查 appsettings.json
    pause
)
endlocal
