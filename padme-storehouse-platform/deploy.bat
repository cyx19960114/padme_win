@echo off
echo ======================================
echo PADME Storehouse Platform 本地部署脚本
echo ======================================

echo.
echo [1/6] 检查Docker服务状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请确保Docker Desktop正在运行
    pause
    exit /b 1
)
echo ✅ Docker服务正常

echo.
echo [2/6] 检查网络...
docker network ls | findstr padme-network >nul
if %errorlevel% neq 0 (
    echo 🔗 创建padme-network网络...
    docker network create padme-network
) else (
    echo ✅ padme-network网络已存在
)

echo.
echo [3/6] 构建Storehouse Docker镜像...
echo 📦 正在构建padme-storehouse:local镜像...
docker build -t padme-storehouse:local .
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)
echo ✅ 镜像构建完成

echo.
echo [4/6] 创建数据目录...
if not exist "src\api\data" (
    mkdir src\api\data
    mkdir src\api\data\uploads
    mkdir src\api\data\tmp
    echo ✅ 数据目录创建完成
) else (
    echo ✅ 数据目录已存在
)

echo.
echo [5/6] 启动Storehouse Platform...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Storehouse启动失败
    pause
    exit /b 1
)

echo.
echo [6/6] 等待服务启动...
echo 📦 Storehouse正在启动，这可能需要几分钟时间...
timeout /t 15 /nobreak >nul

echo.
echo ======================================
echo 🎉 Storehouse Platform部署完成！
echo ======================================
echo.
echo 📋 服务信息:
echo   • Storehouse Web: http://localhost:5001
echo   • API端点: http://localhost:5001/storehouse/api
echo   • 依赖服务:
echo     - Keycloak: http://localhost:8090 (必须运行)
echo     - Train Depot: http://localhost:8091 (必须运行)
echo     - Vault: http://localhost:8200 (可选)
echo.
echo 🔧 下一步操作:
echo   1. 确保Keycloak和Train Depot正在运行
echo   2. 访问 http://localhost:5001
echo   3. 参考 KEYCLOAK_STOREHOUSE_SETUP.md 配置Keycloak集成
echo   4. 在Train Depot中创建相应的项目和组
echo.
echo 📊 查看服务状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f storehouse
echo 🛑 停止服务: docker-compose down
echo.
echo ⚠️  注意: Storehouse需要Keycloak和Train Depot正常运行才能完全功能
echo.
pause
