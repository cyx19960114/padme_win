@echo off
echo ======================================
echo PADME Train Depot 本地部署脚本
echo ======================================

echo.
echo [1/5] 检查Docker服务状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请确保Docker Desktop正在运行
    pause
    exit /b 1
)
echo ✅ Docker服务正常

echo.
echo [2/5] 检查网络...
docker network ls | findstr padme-network >nul
if %errorlevel% neq 0 (
    echo 🔗 创建padme-network网络...
    docker network create padme-network
) else (
    echo ✅ padme-network网络已存在
)

echo.
echo [3/5] 创建数据目录...
if not exist "data" (
    mkdir data
    mkdir data\config
    mkdir data\logs
    mkdir data\data
    echo ✅ 数据目录创建完成
) else (
    echo ✅ 数据目录已存在
)

echo.
echo [4/5] 启动Train Depot GitLab...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Train Depot启动失败
    pause
    exit /b 1
)

echo.
echo [5/5] 等待GitLab启动...
echo 📦 GitLab正在初始化，这可能需要几分钟时间...
echo 请耐心等待...

timeout /t 30 /nobreak >nul

echo.
echo ======================================
echo 🎉 Train Depot部署启动中！
echo ======================================
echo.
echo 📋 服务信息:
echo   • GitLab Web: http://depot.localhost:8091
echo   • GitLab Registry: http://registry.localhost:8092
echo   • 管理员用户: root
echo   • 管理员密码: padme123456
echo.
echo 🔧 下一步操作:
echo   1. 等待GitLab完全启动（5-10分钟）
echo   2. 访问 http://depot.localhost:8091
echo   3. 使用 root / padme123456 登录
echo   4. 参考 KEYCLOAK_DEPOT_SETUP.md 配置Keycloak集成
echo.
echo 📊 查看服务状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f gitlab
echo 🛑 停止服务: docker-compose down
echo.
echo ⚠️  注意: GitLab首次启动需要5-10分钟进行初始化
echo    请耐心等待后再访问Web界面
echo.
pause
