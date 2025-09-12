@echo off
echo ======================================
echo PADME Storehouse Platform 管理脚本
echo ======================================

:menu
echo.
echo 请选择操作:
echo [1] 查看服务状态
echo [2] 查看服务日志
echo [3] 重启服务
echo [4] 停止服务
echo [5] 启动服务
echo [6] 重新构建镜像
echo [7] 重置数据
echo [8] 清理所有数据
echo [0] 退出
echo.
set /p choice=请输入选择 (0-8): 

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto start
if "%choice%"=="6" goto rebuild
if "%choice%"=="7" goto reset
if "%choice%"=="8" goto cleanup
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
docker volume ls | findstr storehouse
goto menu

:logs
echo.
echo 📋 Storehouse日志 (按Ctrl+C退出):
docker-compose logs -f storehouse
goto menu

:restart
echo.
echo 🔄 重启Storehouse服务...
docker-compose restart storehouse
echo ✅ 服务重启完成
goto menu

:stop
echo.
echo 🛑 停止Storehouse服务...
docker-compose down
echo ✅ 服务已停止
goto menu

:start
echo.
echo 🚀 启动Storehouse服务...
docker-compose up -d
echo ✅ 服务已启动
echo 📱 Storehouse: http://localhost:5001
goto menu

:rebuild
echo.
echo 🔨 重新构建Docker镜像...
docker-compose down
echo 📦 构建新镜像...
docker build -t padme-storehouse:local .
if %errorlevel% neq 0 (
    echo ❌ 镜像构建失败
    goto menu
)
echo 🚀 启动更新后的服务...
docker-compose up -d
echo ✅ 重新构建完成
goto menu

:reset
echo.
echo ⚠️  警告: 这将重置Storehouse所有数据!
set /p confirm=确认重置Storehouse数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  重置Storehouse数据...
    docker-compose down
    docker volume rm padme-storehouse-platform_storehouse-data 2>nul
    docker volume rm padme-storehouse-platform_storehouse-cache 2>nul
    rmdir /s /q src\api\data 2>nul
    mkdir src\api\data 2>nul
    mkdir src\api\data\uploads 2>nul
    mkdir src\api\data\tmp 2>nul
    echo ✅ Storehouse数据重置完成
    echo 💡 下次启动将创建全新的Storehouse实例
) else (
    echo ❌ 取消重置操作
)
goto menu

:cleanup
echo.
echo ⚠️  警告: 这将删除所有Storehouse相关数据!
set /p confirm=确认删除所有数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  清理Storehouse数据...
    docker-compose down -v
    docker volume rm padme-storehouse-platform_storehouse-data 2>nul
    docker volume rm padme-storehouse-platform_storehouse-cache 2>nul
    docker rmi padme-storehouse:local 2>nul
    rmdir /s /q src\api\data 2>nul
    echo ✅ 清理完成
) else (
    echo ❌ 取消清理操作
)
goto menu

:exit
echo.
echo 👋 退出Storehouse管理脚本
echo.
exit /b 0
