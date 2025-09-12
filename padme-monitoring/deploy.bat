@echo off
echo ======================================
echo PADME Monitoring 本地部署脚本
echo ======================================

echo.
echo [1/8] 检查Docker服务状态...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未启动
    echo 请确保Docker Desktop正在运行
    pause
    exit /b 1
)
echo ✅ Docker服务正常

echo.
echo [2/8] 检查网络...
docker network ls | findstr padme-network >nul
if %errorlevel% neq 0 (
    echo 🔗 创建padme-network网络...
    docker network create padme-network
) else (
    echo ✅ padme-network网络已存在
)

echo.
echo [3/8] 构建后端Docker镜像...
echo 📦 正在构建padme-monitoring-backend:local镜像...
docker build -t padme-monitoring-backend:local ./backend
if %errorlevel% neq 0 (
    echo ❌ 后端镜像构建失败
    pause
    exit /b 1
)
echo ✅ 后端镜像构建完成

echo.
echo [4/8] 构建前端Docker镜像...
echo 📦 正在构建padme-monitoring-frontend:local镜像...
docker build -t padme-monitoring-frontend:local ^
  --build-arg FRONTEND_API_URL=http://localhost:8001 ^
  --build-arg FRONTEND_KEYCLOAK_SERVER_URL=http://localhost:8090 ^
  --build-arg FRONTEND_KEYCLOAK_REALM=pht ^
  --build-arg FRONTEND_KEYCLOAK_CLIENT_ID=monitoring-frontend ^
  ./frontend
if %errorlevel% neq 0 (
    echo ❌ 前端镜像构建失败
    pause
    exit /b 1
)
echo ✅ 前端镜像构建完成

echo.
echo [5/8] 创建数据目录...
if not exist "data" (
    mkdir data
    echo ✅ 数据目录创建完成
) else (
    echo ✅ 数据目录已存在
)

echo.
echo [6/8] 启动PostgreSQL和Redis...
docker-compose up -d postgres-db redis
if %errorlevel% neq 0 (
    echo ❌ 数据库服务启动失败
    pause
    exit /b 1
)
echo ✅ 数据库服务启动完成

echo.
echo [7/8] 等待数据库就绪...
echo 📦 等待PostgreSQL初始化完成...
timeout /t 30 /nobreak >nul

echo.
echo [8/8] 启动应用服务...
docker-compose up -d backend frontend
if %errorlevel% neq 0 (
    echo ❌ 应用服务启动失败
    pause
    exit /b 1
)

echo.
echo ======================================
echo 🎉 PADME Monitoring部署完成！
echo ======================================
echo.
echo 📋 服务信息:
echo   • Frontend: http://localhost:5174
echo   • Backend API: http://localhost:8001
echo   • Backend Docs: http://localhost:8001/docs
echo   • PostgreSQL: localhost:5432 (内部)
echo   • Redis: localhost:6379 (内部)
echo.
echo 🔧 依赖服务:
echo   • Keycloak: http://localhost:8090 (必须运行)
echo.
echo 🔧 下一步操作:
echo   1. 确保Keycloak正在运行
echo   2. 访问 http://localhost:5174
echo   3. 参考 KEYCLOAK_MONITORING_SETUP.md 配置Keycloak集成
echo   4. 使用Keycloak用户登录监控面板
echo.
echo 📊 查看服务状态: docker-compose ps
echo 📋 查看日志: docker-compose logs -f
echo 🛑 停止服务: docker-compose down
echo.
echo ⚠️  注意: 
echo    - 首次启动可能需要几分钟初始化数据库
echo    - 需要Keycloak服务正常运行才能完全功能
echo    - 后端健康检查可能需要一些时间生效
echo.
pause
