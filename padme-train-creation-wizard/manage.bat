@echo off
echo ======================================
echo PADME Train Creator 管理脚本
echo ======================================

:menu
echo.
echo 请选择操作:
echo [1] 查看服务状态
echo [2] 查看服务日志
echo [3] 重启服务
echo [4] 停止服务
echo [5] 启动服务
echo [6] 重新构建并启动
echo [7] 清理所有数据
echo [0] 退出
echo.
set /p choice=请输入选择 (0-7): 

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto start
if "%choice%"=="6" goto rebuild
if "%choice%"=="7" goto cleanup
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
docker volume ls | findstr train-creator
goto menu

:logs
echo.
echo 📋 服务日志 (按Ctrl+C退出):
docker-compose logs -f traincreator
goto menu

:restart
echo.
echo 🔄 重启Train Creator服务...
docker-compose restart traincreator
echo ✅ 服务重启完成
goto menu

:stop
echo.
echo 🛑 停止Train Creator服务...
docker-compose down
echo ✅ 服务已停止
goto menu

:start
echo.
echo 🚀 启动Train Creator服务...
docker-compose up -d
echo ✅ 服务已启动
echo 📱 访问: http://localhost:5000
goto menu

:rebuild
echo.
echo 🔨 重新构建并启动服务...
docker-compose down
docker-compose build
docker-compose up -d
echo ✅ 重新构建完成
echo 📱 访问: http://localhost:5000
goto menu

:cleanup
echo.
echo ⚠️  警告: 这将删除所有Train Creator数据!
set /p confirm=确认删除所有数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  清理Train Creator数据...
    docker-compose down -v
    docker volume rm train-creator-data 2>nul
    docker rmi padme-train-creator:local 2>nul
    echo ✅ 清理完成
) else (
    echo ❌ 取消清理操作
)
goto menu

:exit
echo.
echo 👋 退出Train Creator管理脚本
echo.
exit /b 0
