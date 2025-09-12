@echo off
echo Starting PADME Vault Deployment...
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

REM 切换到vault目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 停止并删除现有容器（如果存在）
echo Stopping existing containers...
docker-compose down 2>nul

REM 构建并启动服务
echo Building and starting Vault service...
docker-compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo Vault deployment completed successfully!
    echo.
    echo Vault is now running on:
    echo   - HTTPS: https://localhost:8215
    echo.
    echo IMPORTANT: You need to initialize and unseal Vault manually.
    echo Use the setup guide: LOCAL_SETUP_GUIDE.md
    echo.
    echo Quick setup commands:
    echo   docker exec -it vault-vault-1 /bin/ash
    echo   vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1
    echo   vault operator unseal -tls-skip-verify
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
