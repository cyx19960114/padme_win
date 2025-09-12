@echo off
echo Starting PADME Reverse Proxy Deployment...
echo.

REM 检查Docker是否运行
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not running
    echo Please install Docker Desktop and make sure it's running
    pause
    exit /b 1
)

echo Docker detected, proceeding with deployment...
echo.

REM 切换到proxy目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 创建proxynet网络（如果不存在）
echo Creating proxynet network...
docker network create proxynet 2>nul
if %errorlevel% equ 0 (
    echo Created proxynet network successfully
) else (
    echo proxynet network already exists or error occurred
)
echo.

REM 停止并删除现有容器（如果存在）
echo Stopping existing containers...
docker-compose down 2>nul

REM 构建并启动服务
echo Building and starting reverse proxy services...
docker-compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo Deployment completed successfully!
    echo.
    echo The reverse proxy is now running on:
    echo   - HTTP:  http://localhost:80
    echo   - HTTPS: https://localhost:443
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop:     docker-compose down
    echo.
) else (
    echo.
    echo Deployment failed!
    echo Please check the error messages above.
    echo.
)

pause
