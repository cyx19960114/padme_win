@echo off
echo ======================================
echo PADME Train Creator 本地部署脚本
echo ======================================

echo.
echo [1/4] 检查Docker服务状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请确保Docker Desktop正在运行
    pause
    exit /b 1
)
echo ✅ Docker服务正常

echo.
echo [2/4] 检查网络...
docker network ls | findstr padme-network >nul
if %errorlevel% neq 0 (
    echo 🔗 创建padme-network网络...
    docker network create padme-network
) else (
    echo ✅ padme-network网络已存在
)

echo.
echo [3/4] 构建Train Creator镜像...
docker-compose build
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)
echo ✅ 镜像构建成功

echo.
echo [4/4] 启动Train Creator服务...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
)

echo.
echo ======================================
echo 🎉 Train Creator部署成功！
echo ======================================
echo.
echo 📋 服务信息:
echo   • Train Creator Web: http://localhost:5000
echo   • API接口: http://localhost:5000/api/
echo.
echo 🔧 下一步操作:
echo   1. 访问 http://localhost:8090 配置Keycloak客户端
echo   2. 参考 KEYCLOAK_TRAIN_CREATOR_SETUP.md 进行配置
echo   3. 访问 http://localhost:5000 测试Train Creator
echo.
echo 📊 查看服务状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f traincreator
echo 🛑 停止服务: docker-compose down
echo.
pause
