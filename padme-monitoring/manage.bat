@echo off
echo ======================================
echo PADME Monitoring 管理脚本
echo ======================================

:menu
echo.
echo 请选择操作:
echo [1] 查看服务状态
echo [2] 查看服务日志
echo [3] 重启所有服务
echo [4] 重启单个服务
echo [5] 停止服务
echo [6] 启动服务
echo [7] 重新构建镜像
echo [8] 数据库管理
echo [9] 清理所有数据
echo [0] 退出
echo.
set /p choice=请输入选择 (0-9): 

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart_all
if "%choice%"=="4" goto restart_single
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto start
if "%choice%"=="7" goto rebuild
if "%choice%"=="8" goto database
if "%choice%"=="9" goto cleanup
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:status
echo.
echo 📊 服务状态:
docker-compose ps
echo.
echo 🌐 网络状态:
docker network ls | findstr padme
echo.
echo 💾 数据卷状态:
docker volume ls | findstr monitoring
goto menu

:logs
echo.
echo 请选择查看哪个服务的日志:
echo [1] 所有服务
echo [2] 后端 (Backend)
echo [3] 前端 (Frontend)
echo [4] 数据库 (PostgreSQL)
echo [5] Redis
set /p log_choice=请选择: 

if "%log_choice%"=="1" (
    echo 📋 所有服务日志 (按Ctrl+C退出):
    docker-compose logs -f
) else if "%log_choice%"=="2" (
    echo 📋 后端日志 (按Ctrl+C退出):
    docker-compose logs -f backend
) else if "%log_choice%"=="3" (
    echo 📋 前端日志 (按Ctrl+C退出):
    docker-compose logs -f frontend
) else if "%log_choice%"=="4" (
    echo 📋 数据库日志 (按Ctrl+C退出):
    docker-compose logs -f postgres-db
) else if "%log_choice%"=="5" (
    echo 📋 Redis日志 (按Ctrl+C退出):
    docker-compose logs -f redis
) else (
    echo 无效选择
)
goto menu

:restart_all
echo.
echo 🔄 重启所有Monitoring服务...
docker-compose restart
echo ✅ 所有服务重启完成
goto menu

:restart_single
echo.
echo 请选择要重启的服务:
echo [1] 后端 (Backend)
echo [2] 前端 (Frontend)
echo [3] 数据库 (PostgreSQL)
echo [4] Redis
set /p restart_choice=请选择: 

if "%restart_choice%"=="1" (
    echo 🔄 重启后端服务...
    docker-compose restart backend
    echo ✅ 后端服务重启完成
) else if "%restart_choice%"=="2" (
    echo 🔄 重启前端服务...
    docker-compose restart frontend
    echo ✅ 前端服务重启完成
) else if "%restart_choice%"=="3" (
    echo 🔄 重启数据库服务...
    docker-compose restart postgres-db
    echo ✅ 数据库服务重启完成
) else if "%restart_choice%"=="4" (
    echo 🔄 重启Redis服务...
    docker-compose restart redis
    echo ✅ Redis服务重启完成
) else (
    echo 无效选择
)
goto menu

:stop
echo.
echo 🛑 停止Monitoring服务...
docker-compose down
echo ✅ 服务已停止
goto menu

:start
echo.
echo 🚀 启动Monitoring服务...
docker-compose up -d
echo ✅ 服务已启动
echo 📱 Frontend: http://localhost:5174
echo 📱 Backend: http://localhost:8001
echo 📱 API Docs: http://localhost:8001/docs
goto menu

:rebuild
echo.
echo 请选择要重新构建的镜像:
echo [1] 后端镜像
echo [2] 前端镜像
echo [3] 所有镜像
set /p build_choice=请选择: 

if "%build_choice%"=="1" (
    echo 🔨 重新构建后端镜像...
    docker-compose down backend
    docker build -t padme-monitoring-backend:local ./backend
    if %errorlevel% neq 0 (
        echo ❌ 后端镜像构建失败
        goto menu
    )
    docker-compose up -d backend
    echo ✅ 后端镜像重新构建完成
) else if "%build_choice%"=="2" (
    echo 🔨 重新构建前端镜像...
    docker-compose down frontend
    docker build -t padme-monitoring-frontend:local --build-arg FRONTEND_API_URL=http://localhost:8001 --build-arg FRONTEND_KEYCLOAK_SERVER_URL=http://localhost:8090 --build-arg FRONTEND_KEYCLOAK_REALM=pht --build-arg FRONTEND_KEYCLOAK_CLIENT_ID=monitoring-frontend ./frontend
    if %errorlevel% neq 0 (
        echo ❌ 前端镜像构建失败
        goto menu
    )
    docker-compose up -d frontend
    echo ✅ 前端镜像重新构建完成
) else if "%build_choice%"=="3" (
    echo 🔨 重新构建所有镜像...
    docker-compose down
    docker build -t padme-monitoring-backend:local ./backend
    docker build -t padme-monitoring-frontend:local --build-arg FRONTEND_API_URL=http://localhost:8001 --build-arg FRONTEND_KEYCLOAK_SERVER_URL=http://localhost:8090 --build-arg FRONTEND_KEYCLOAK_REALM=pht --build-arg FRONTEND_KEYCLOAK_CLIENT_ID=monitoring-frontend ./frontend
    if %errorlevel% neq 0 (
        echo ❌ 镜像构建失败
        goto menu
    )
    docker-compose up -d
    echo ✅ 所有镜像重新构建完成
) else (
    echo 无效选择
)
goto menu

:database
echo.
echo 📊 数据库管理:
echo [1] 连接数据库
echo [2] 查看数据库状态
echo [3] 重置数据库数据
echo [4] 备份数据库
set /p db_choice=请选择: 

if "%db_choice%"=="1" (
    echo 🔌 连接到PostgreSQL数据库...
    docker-compose exec postgres-db psql -U monitor -d pht_monitoring
) else if "%db_choice%"=="2" (
    echo 📊 数据库状态:
    docker-compose exec postgres-db pg_isready -U monitor -d pht_monitoring
    echo.
    echo 数据库大小:
    docker-compose exec postgres-db psql -U monitor -d pht_monitoring -c "\l"
) else if "%db_choice%"=="3" (
    echo.
    echo ⚠️  警告: 这将删除所有监控数据!
    set /p confirm=确认重置数据库? (y/N): 
    if /i "%confirm%"=="y" (
        echo 🗑️  重置数据库数据...
        docker-compose exec postgres-db psql -U monitor -d pht_monitoring -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        echo ✅ 数据库重置完成
    ) else (
        echo ❌ 取消重置操作
    )
) else if "%db_choice%"=="4" (
    echo 💾 备份数据库...
    docker-compose exec postgres-db pg_dump -U monitor pht_monitoring > monitoring_backup_%date:~0,4%%date:~5,2%%date:~8,2%.sql
    echo ✅ 数据库备份完成
) else (
    echo 无效选择
)
goto menu

:cleanup
echo.
echo ⚠️  警告: 这将删除所有Monitoring相关数据!
set /p confirm=确认删除所有数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  清理Monitoring数据...
    docker-compose down -v
    docker volume rm padme-monitoring_monitoring-db-data 2>nul
    docker rmi padme-monitoring-backend:local 2>nul
    docker rmi padme-monitoring-frontend:local 2>nul
    rmdir /s /q data 2>nul
    echo ✅ 清理完成
) else (
    echo ❌ 取消清理操作
)
goto menu

:exit
echo.
echo 👋 退出Monitoring管理脚本
echo.
exit /b 0
