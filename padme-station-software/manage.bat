@echo off
echo ======================================
echo PADME Station Software 管理脚本
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
echo [7] 重新构建应用镜像
echo [8] Docker管理
echo [9] 数据库管理
echo [10] 清理所有数据
echo [0] 退出
echo.
set /p choice=请输入选择 (0-10): 

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart_all
if "%choice%"=="4" goto restart_single
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto start
if "%choice%"=="7" goto rebuild
if "%choice%"=="8" goto docker_mgmt
if "%choice%"=="9" goto database
if "%choice%"=="10" goto cleanup
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
docker volume ls | findstr pht
goto menu

:logs
echo.
echo 请选择查看哪个服务的日志:
echo [1] 所有服务
echo [2] Station Web (pht-web)
echo [3] MongoDB
echo [4] Docker-in-Docker (dind)
echo [5] Vault
echo [6] Metadata服务
set /p log_choice=请选择: 

if "%log_choice%"=="1" (
    echo 📋 所有服务日志 (按Ctrl+C退出):
    docker-compose logs -f
) else if "%log_choice%"=="2" (
    echo 📋 Station Web日志 (按Ctrl+C退出):
    docker-compose logs -f pht-web
) else if "%log_choice%"=="3" (
    echo 📋 MongoDB日志 (按Ctrl+C退出):
    docker-compose logs -f mongo
) else if "%log_choice%"=="4" (
    echo 📋 Docker-in-Docker日志 (按Ctrl+C退出):
    docker-compose logs -f dind
) else if "%log_choice%"=="5" (
    echo 📋 Vault日志 (按Ctrl+C退出):
    docker-compose logs -f vault
) else if "%log_choice%"=="6" (
    echo 📋 Metadata服务日志 (按Ctrl+C退出):
    docker-compose logs -f metadata
) else (
    echo 无效选择
)
goto menu

:restart_all
echo.
echo 🔄 重启所有Station Software服务...
docker-compose restart
echo ✅ 所有服务重启完成
goto menu

:restart_single
echo.
echo 请选择要重启的服务:
echo [1] Station Web (pht-web)
echo [2] MongoDB
echo [3] Docker-in-Docker (dind)
echo [4] Vault
echo [5] Metadata服务
set /p restart_choice=请选择: 

if "%restart_choice%"=="1" (
    echo 🔄 重启Station Web服务...
    docker-compose restart pht-web
    echo ✅ Station Web服务重启完成
) else if "%restart_choice%"=="2" (
    echo 🔄 重启MongoDB服务...
    docker-compose restart mongo
    echo ✅ MongoDB服务重启完成
) else if "%restart_choice%"=="3" (
    echo 🔄 重启Docker-in-Docker服务...
    docker-compose restart dind
    echo ✅ DinD服务重启完成
) else if "%restart_choice%"=="4" (
    echo 🔄 重启Vault服务...
    docker-compose restart vault
    echo ✅ Vault服务重启完成
) else if "%restart_choice%"=="5" (
    echo 🔄 重启Metadata服务...
    docker-compose restart metadata
    echo ✅ Metadata服务重启完成
) else (
    echo 无效选择
)
goto menu

:stop
echo.
echo 🛑 停止Station Software服务...
docker-compose down
echo ✅ 服务已停止
goto menu

:start
echo.
echo 🚀 启动Station Software服务...
docker-compose up -d
echo ✅ 服务已启动
echo 📱 Station Web: http://localhost:3030
echo 📱 Vault: http://localhost:8201
echo 📱 Metadata: http://localhost:9988
goto menu

:rebuild
echo.
echo 🔨 重新构建Station Software镜像...
docker-compose down pht-web
echo 📦 构建新镜像...
docker build -f Dockerfile.local -t padme-station-software:local .
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    goto menu
)
echo 🚀 启动更新后的服务...
docker-compose up -d pht-web
echo ✅ 重新构建完成
goto menu

:docker_mgmt
echo.
echo 🐳 Docker管理:
echo [1] 查看DinD内部容器
echo [2] 清理DinD内部镜像
echo [3] 查看DinD状态
echo [4] 重置DinD环境
set /p docker_choice=请选择: 

if "%docker_choice%"=="1" (
    echo 📋 DinD内部容器:
    docker-compose exec dind docker ps -a
) else if "%docker_choice%"=="2" (
    echo 🗑️  清理DinD内部镜像...
    docker-compose exec dind docker system prune -f
    echo ✅ DinD内部镜像清理完成
) else if "%docker_choice%"=="3" (
    echo 📊 DinD状态:
    docker-compose exec dind docker info
) else if "%docker_choice%"=="4" (
    echo.
    echo ⚠️  警告: 这将重置整个DinD环境!
    set /p confirm=确认重置DinD环境? (y/N): 
    if /i "%confirm%"=="y" (
        echo 🗑️  重置DinD环境...
        docker-compose down dind
        docker volume rm padme-station-software_pht-dind-data 2>nul
        docker volume rm padme-station-software_pht-dind-certs-ca 2>nul
        docker volume rm padme-station-software_pht-dind-certs-client 2>nul
        docker-compose up -d dind
        echo ✅ DinD环境重置完成
    ) else (
        echo ❌ 取消重置操作
    )
) else (
    echo 无效选择
)
goto menu

:database
echo.
echo 📊 数据库管理:
echo [1] 连接MongoDB
echo [2] 查看数据库状态
echo [3] 重置数据库数据
echo [4] 备份数据库
set /p db_choice=请选择: 

if "%db_choice%"=="1" (
    echo 🔌 连接到MongoDB...
    docker-compose exec mongo mongosh -u admin -p admin123456 --authenticationDatabase admin
) else if "%db_choice%"=="2" (
    echo 📊 数据库状态:
    docker-compose exec mongo mongosh -u admin -p admin123456 --authenticationDatabase admin --eval "db.runCommand({connectionStatus:1})"
    echo.
    echo 数据库大小:
    docker-compose exec mongo mongosh -u admin -p admin123456 --authenticationDatabase admin --eval "db.stats()"
) else if "%db_choice%"=="3" (
    echo.
    echo ⚠️  警告: 这将删除所有Station数据!
    set /p confirm=确认重置数据库? (y/N): 
    if /i "%confirm%"=="y" (
        echo 🗑️  重置数据库数据...
        docker-compose exec mongo mongosh -u admin -p admin123456 --authenticationDatabase admin --eval "db.dropDatabase()"
        echo ✅ 数据库重置完成
    ) else (
        echo ❌ 取消重置操作
    )
) else if "%db_choice%"=="4" (
    echo 💾 备份数据库...
    docker-compose exec mongo mongodump --username admin --password admin123456 --authenticationDatabase admin --out /backup
    echo ✅ 数据库备份完成
) else (
    echo 无效选择
)
goto menu

:cleanup
echo.
echo ⚠️  警告: 这将删除所有Station Software相关数据!
set /p confirm=确认删除所有数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  清理Station Software数据...
    docker-compose down -v
    docker volume rm padme-station-software_pht-mongo-data 2>nul
    docker volume rm padme-station-software_pht-dind-data 2>nul
    docker volume rm padme-station-software_pht-dind-certs-ca 2>nul
    docker volume rm padme-station-software_pht-dind-certs-client 2>nul
    docker volume rm padme-station-software_pht-vault-data 2>nul
    docker volume rm padme-station-software_pht-web-lockfile-vol 2>nul
    docker rmi padme-station-software:local 2>nul
    rmdir /s /q data 2>nul
    echo ✅ 清理完成
) else (
    echo ❌ 取消清理操作
)
goto menu

:exit
echo.
echo 👋 退出Station Software管理脚本
echo.
exit /b 0
