@echo off
echo Starting PADME Docker-in-Docker (DinD) Deployment...
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

REM 切换到dind目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 停止并删除现有容器（如果存在）
echo Stopping existing containers...
docker-compose down 2>nul

REM 构建并启动服务
echo Building and starting Docker-in-Docker service...
docker-compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo DinD deployment completed successfully!
    echo.
    echo Docker-in-Docker is now running on:
    echo   - Secure API:   https://localhost:2376
    echo   - Insecure API: http://localhost:2375
    echo.
    echo Features:
    echo   - DNS resolution fix for containers
    echo   - Daily Docker cleanup (7-day retention)
    echo   - Custom bridge network (172.31.0.1/24)
    echo   - Embedded dnsmasq for DNS forwarding
    echo.
    echo IMPORTANT: Wait 30-60 seconds for service to fully start
    echo.
    echo To connect from host: 
    echo   export DOCKER_HOST=tcp://localhost:2376
    echo   export DOCKER_TLS_VERIFY=1
    echo   export DOCKER_CERT_PATH=./certs/client
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
