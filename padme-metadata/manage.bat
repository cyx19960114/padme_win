@echo off
echo ================================
echo PADME Metadata Service 管理工具
echo ================================

if "%1"=="" goto menu
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
goto menu

:menu
echo.
echo 可用命令:
echo   manage.bat start    - 启动服务
echo   manage.bat stop     - 停止服务
echo   manage.bat restart  - 重启服务
echo   manage.bat logs     - 查看日志
echo   manage.bat status   - 查看状态
echo   manage.bat clean    - 清理数据
echo.
goto end

:start
echo 启动Metadata Service...
docker-compose up -d
goto end

:stop
echo 停止Metadata Service...
docker-compose down
goto end

:restart
echo 重启Metadata Service...
docker-compose restart
goto end

:logs
echo Metadata Service日志:
docker-compose logs -f
goto end

:status
echo Metadata Service状态:
docker-compose ps
echo.
echo 容器详细信息:
docker-compose logs --tail 10
goto end

:clean
echo 警告: 这将删除所有数据!
set /p confirm=确认删除? (y/N): 
if /i "%confirm%"=="y" (
    echo 清理所有数据...
    docker-compose down -v
    docker rmi padme-metadata:local
    echo 清理完成
) else (
    echo 取消清理
)
goto end

:end
pause
