@echo off
echo Starting PADME Keycloak Deployment...
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

REM 切换到keycloak目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 检查proxynet网络是否存在
docker network inspect proxynet >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating proxynet network...
    docker network create proxynet
) else (
    echo proxynet network already exists
)

REM 停止并删除现有容器（如果存在）
echo Stopping existing containers...
docker-compose down 2>nul

REM 构建并启动服务
echo Building and starting Keycloak services...
docker-compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo Keycloak deployment completed successfully!
    echo.
    echo Keycloak is now running on:
    echo   - HTTP:  http://localhost:8090
    echo   - Admin Console: http://localhost:8090/auth/admin
    echo.
    echo Default admin credentials:
    echo   Username: admin
    echo   Password: admin_password_2024
    echo.
    echo Database (PostgreSQL):
    echo   Host: localhost:5433
    echo   Username: postgres
    echo   Password: keycloak_local_password_2024
    echo.
    echo IMPORTANT: Wait 2-3 minutes for services to fully start
    echo Then access: http://localhost:8090/auth
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
