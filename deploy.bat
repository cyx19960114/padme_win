@echo off
echo Starting PADME Central Service Deployment...
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

REM 切换到central service目录
cd /d "%~dp0"

echo Current directory: %CD%
echo.

REM 检查依赖服务是否运行
echo Checking dependency services...

REM 检查proxynet网络
docker network inspect proxynet >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating proxynet network...
    docker network create proxynet
) else (
    echo ✓ proxynet network exists
)

REM 检查vaultnet网络
docker network inspect vaultnet >nul 2>&1
if %errorlevel% neq 0 (
    echo Creating vaultnet network...
    docker network create vaultnet
) else (
    echo ✓ vaultnet network exists
)

echo.
echo Checking PADME services status...

REM 检查Vault是否运行
curl -f -s http://localhost:8215/v1/sys/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Vault service is running
) else (
    echo ⚠ Warning: Vault service not detected at localhost:8215
    echo   Please ensure Vault is running before using Central Service
)

REM 检查Keycloak是否运行
curl -f -s http://localhost:8090/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Keycloak service is running
) else (
    echo ⚠ Warning: Keycloak service not detected at localhost:8090
    echo   Please ensure Keycloak is running before using Central Service
)

REM 检查Harbor是否运行
curl -f -s http://localhost:8080/ >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Harbor service is running
) else (
    echo ⚠ Warning: Harbor service not detected at localhost:8080
    echo   Please ensure Harbor is running before using Central Service
)

echo.
echo Building Central Service Docker image...
docker build -t padme-central-service:local .

if %errorlevel% neq 0 (
    echo Failed to build Central Service image
    pause
    exit /b 1
)

echo.
echo Starting Central Service and dependencies...
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo Central Service deployment completed successfully!
    echo.
    echo Central Service is now running on:
    echo   - Web UI: http://localhost:3000
    echo   - API Endpoint: http://localhost:3000/api
    echo.
    echo Dependency Services:
    echo   - PostgreSQL: localhost:5434
    echo   - MinIO: localhost:9000 (Console: localhost:9001)
    echo   - DinD: Internal container network
    echo.
    echo Database credentials:
    echo   Username: postgres
    echo   Password: central_postgres_password_2024
    echo   Database: postgres
    echo.
    echo MinIO credentials:
    echo   Username: centralservice
    echo   Password: minio_password_2024
    echo.
    echo Integration with PADME services:
    echo   - Harbor: localhost:8080 (admin/Harbor12345)
    echo   - Keycloak: localhost:8090 (admin/admin_password_2024)
    echo   - Vault: localhost:8215
    echo.
    echo IMPORTANT NEXT STEPS:
    echo 1. Configure Keycloak clients (run setup-keycloak.bat)
    echo 2. Configure Vault authentication
    echo 3. Access Central Service at: http://localhost:3000
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop:     docker-compose down
    echo.
) else (
    echo.
    echo Deployment failed!
    echo Please check the error messages above.
    echo.
    echo Common issues:
    echo - Ensure all dependency services are running
    echo - Check if ports 3000, 5434, 9000, 9001 are available
    echo - Verify Docker has sufficient resources
    echo.
)

pause
