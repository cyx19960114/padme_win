@echo off
echo ================================
echo PADME Metadata Service 本地部署
echo ================================

echo.
echo 1. 检查Docker是否运行...
docker version >nul 2>&1
if errorlevel 1 (
    echo 错误: Docker未运行，请先启动Docker Desktop
    pause
    exit /b 1
)

echo ✓ Docker正在运行

echo.
echo 2. 检查proxynet网络...
docker network inspect proxynet >nul 2>&1
if errorlevel 1 (
    echo 创建proxynet网络...
    docker network create proxynet
) else (
    echo ✓ proxynet网络已存在
)

echo.
echo 3. 构建Metadata Service镜像...
docker-compose build

echo.
echo 4. 启动服务...
docker-compose up -d

echo.
echo 5. 等待服务启动...
timeout /t 30 /nobreak

echo.
echo 6. 检查服务状态...
docker-compose ps

echo.
echo ================================
echo 部署完成！
echo ================================
echo.
echo 访问信息:
echo - Metadata Service: http://localhost:3001
echo - GraphDB PostgreSQL: localhost:5435 (postgres/metadata_graph_password_2024)
echo - Management PostgreSQL: localhost:5436 (postgres/metadata_mgmt_password_2024)
echo.
echo 日志查看: docker-compose logs
echo 停止服务: docker-compose down
echo.
pause
