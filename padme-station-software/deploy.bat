@echo off
echo ======================================
echo PADME Station Software 本地部署脚本
echo ======================================

echo.
echo [1/7] 检查Docker服务状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请确保Docker Desktop正在运行
    pause
    exit /b 1
)
echo ✅ Docker服务正常

echo.
echo [2/7] 检查网络...
docker network ls | findstr padme-network >nul
if %errorlevel% neq 0 (
    echo 🔗 创建padme-network网络...
    docker network create padme-network
) else (
    echo ✅ padme-network网络已存在
)

echo.
echo [3/7] 构建Station Software Docker镜像...
echo 📦 正在构建padme-station-software:local镜像...
docker build -f Dockerfile.local -t padme-station-software:local .
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)
echo ✅ 镜像构建完成

echo.
echo [4/7] 创建数据目录...
if not exist "data" (
    mkdir data
    mkdir data\mongo
    mkdir data\vault
    mkdir data\dind
    echo ✅ 数据目录创建完成
) else (
    echo ✅ 数据目录已存在
)

echo.
echo [5/7] 启动基础服务...
echo 📦 启动MongoDB, Docker-in-Docker, Vault...
docker-compose up -d mongo dind vault metadata
if %errorlevel% neq 0 (
    echo ❌ 基础服务启动失败
    pause
    exit /b 1
)
echo ✅ 基础服务启动完成

echo.
echo [6/7] 等待基础服务就绪...
echo 📦 等待服务初始化完成...
timeout /t 45 /nobreak >nul

echo.
echo [7/7] 启动Station Software...
docker-compose up -d pht-web
if %errorlevel% neq 0 (
    echo ❌ Station Software启动失败
    pause
    exit /b 1
)

echo.
echo ======================================
echo 🎉 PADME Station Software部署完成！
echo ======================================
echo.
echo 📋 服务信息:
echo   • Station Web界面: http://localhost:3030
echo   • MongoDB: localhost:27017 (内部)
echo   • Vault: http://localhost:8201
echo   • Metadata服务: http://localhost:9988
echo   • Docker-in-Docker: 内部TLS (2376)
echo.
echo 🔧 依赖服务:
echo   • Keycloak: http://localhost:8090 (必须运行)
echo   • Harbor: http://localhost:8080 (推荐运行)
echo   • Train Depot: http://localhost:8091 (推荐运行)
echo.
echo 🔧 下一步操作:
echo   1. 确保Keycloak服务正在运行
echo   2. 访问 http://localhost:3030
echo   3. 使用Keycloak用户登录Station
echo   4. 配置Docker镜像仓库连接
echo.
echo 📊 查看服务状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f pht-web
echo 🛑 停止服务: docker-compose down
echo.
echo ⚠️  注意: 
echo    - Station Software首次启动可能需要几分钟
echo    - 需要Keycloak服务运行才能登录
echo    - Docker-in-Docker需要特权模式运行
echo    - 所有train执行都在隔离的Docker环境中
echo.
pause
