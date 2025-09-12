@echo off
echo ========================================
echo PADME Playground 管理脚本
echo ========================================

:menu
echo.
echo 请选择操作：
echo 1. 启动所有服务
echo 2. 停止所有服务
echo 3. 重启所有服务
echo 4. 查看服务状态
echo 5. 查看服务日志
echo 6. 重新构建镜像
echo 7. 清理所有容器和镜像
echo 8. 退出
echo.
set /p choice="请输入选择 (1-8): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto build
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto exit
echo 无效选择，请重新输入
goto menu

:start
echo 启动所有服务...
docker-compose up -d
goto menu

:stop
echo 停止所有服务...
docker-compose down
goto menu

:restart
echo 重启所有服务...
docker-compose restart
goto menu

:status
echo 查看服务状态...
docker-compose ps
goto menu

:logs
echo 查看服务日志...
docker-compose logs --tail=50
goto menu

:build
echo 重新构建镜像...
docker-compose build --no-cache
goto menu

:clean
echo 警告: 这将删除所有Playground相关的容器、镜像和数据！
set /p confirm="确认继续？(y/N): "
if /i "%confirm%"=="y" (
    docker-compose down -v
    docker rmi padme-playground-backend:local 2>nul
    docker rmi padme-playground-frontend:local 2>nul
    docker rmi padme-playground-dind:local 2>nul
    docker rmi padme-playground-blazegraph:local 2>nul
    echo 清理完成
) else (
    echo 取消清理操作
)
goto menu

:exit
echo 退出管理脚本
pause
exit
