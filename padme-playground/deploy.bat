@echo off
echo ========================================
echo PADME Playground 部署脚本
echo ========================================

echo.
echo 1. 加载环境变量...
if exist local.env (
    echo 已找到 local.env 文件
) else (
    echo 警告: 未找到 local.env 文件，将使用默认配置
)

echo.
echo 2. 检查网络...
docker network ls | findstr proxynet
if errorlevel 1 (
    echo 创建 proxynet 网络...
    docker network create proxynet
) else (
    echo proxynet 网络已存在
)

echo.
echo 3. 构建所有服务镜像...
docker-compose build

echo.
echo 4. 启动服务...
docker-compose up -d

echo.
echo 5. 检查服务状态...
timeout /t 10 /nobreak > nul
docker-compose ps

echo.
echo ========================================
echo PADME Playground 部署完成！
echo ========================================
echo.
echo 访问地址：
echo  - Frontend (Web界面): http://localhost:3003
echo  - Backend API:        http://localhost:3002
echo  - Blazegraph:         http://localhost:9998
echo.
echo 注意: 首次启动可能需要几分钟时间来初始化所有服务
echo.
pause
