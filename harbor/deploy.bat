@echo off
echo Starting PADME Harbor Container Registry Deployment...
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

REM 切换到harbor目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 检查Harbor安装包
if not exist "harbor" (
    echo Harbor installation package not found!
    echo.
    echo Please run download-harbor.bat first to download Harbor
    echo Or manually download Harbor from: https://github.com/goharbor/harbor/releases
    echo.
    pause
    exit /b 1
)

REM 检查proxynet网络是否存在
docker network inspect proxynet >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating proxynet network...
    docker network create proxynet
) else (
    echo proxynet network already exists
)

REM 复制配置文件
echo Copying Harbor configuration...
copy harbor.yml harbor\harbor.yml

REM 切换到harbor目录并运行安装
echo Preparing Harbor installation...
cd harbor
bash prepare

if %errorlevel% neq 0 (
    echo Failed to prepare Harbor installation
    pause
    exit /b 1
)

echo Starting Harbor services...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo Harbor deployment completed successfully!
    echo.
    echo Harbor is now running on:
    echo   - Web UI: http://localhost:8080
    echo   - Registry: localhost:8080 (Docker registry)
    echo.
    echo Default admin credentials:
    echo   Username: admin
    echo   Password: Harbor12345
    echo.
    echo Database credentials:
    echo   PostgreSQL Password: root123
    echo.
    echo IMPORTANT: 
    echo 1. Change the admin password after first login
    echo 2. Wait 2-3 minutes for all services to fully start
    echo 3. Access Harbor at: http://localhost:8080
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
