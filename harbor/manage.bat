@echo off
:menu
echo.
echo PADME Harbor 管理工具
echo =====================
echo 1. 下载Harbor安装包
echo 2. 部署Harbor
echo 3. 启动Harbor
echo 4. 停止Harbor
echo 5. 重启Harbor
echo 6. 查看状态
echo 7. 查看日志
echo 8. 备份数据
echo 9. 清理系统
echo 0. 退出
echo.
set /p choice=请选择操作 (0-9): 

if "%choice%"=="1" goto download
if "%choice%"=="2" goto deploy
if "%choice%"=="3" goto start
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto restart
if "%choice%"=="6" goto status
if "%choice%"=="7" goto logs
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto cleanup
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:download
echo 下载Harbor安装包...
.\download-harbor.bat
goto menu

:deploy
echo 部署Harbor...
.\deploy.bat
goto menu

:start
echo 启动Harbor服务...
if not exist "harbor" (
    echo Error: Harbor目录不存在，请先下载Harbor安装包
    goto menu
)
cd harbor
docker-compose up -d
cd ..
echo Harbor服务已启动
goto menu

:stop
echo 停止Harbor服务...
if not exist "harbor" (
    echo Error: Harbor目录不存在
    goto menu
)
cd harbor
docker-compose down
cd ..
echo Harbor服务已停止
goto menu

:restart
echo 重启Harbor服务...
if not exist "harbor" (
    echo Error: Harbor目录不存在
    goto menu
)
cd harbor
docker-compose restart
cd ..
echo Harbor服务已重启
goto menu

:status
echo Harbor服务状态:
if not exist "harbor" (
    echo Error: Harbor目录不存在
    goto menu
)
cd harbor
docker-compose ps
cd ..
echo.
echo 访问信息:
echo - Web UI: http://localhost:8080
echo - 用户名: admin
echo - 密码: Harbor12345
goto menu

:logs
echo 选择查看日志:
echo 1. 所有服务
echo 2. Core服务
echo 3. Database
echo 4. Registry
echo 5. Portal
set /p log_choice=请选择 (1-5): 
if not exist "harbor" (
    echo Error: Harbor目录不存在
    goto menu
)
cd harbor
if "%log_choice%"=="1" docker-compose logs -f
if "%log_choice%"=="2" docker-compose logs -f harbor-core
if "%log_choice%"=="3" docker-compose logs -f harbor-db
if "%log_choice%"=="4" docker-compose logs -f registry
if "%log_choice%"=="5" docker-compose logs -f harbor-portal
cd ..
goto menu

:backup
echo 备份Harbor数据...
if not exist "harbor" (
    echo Error: Harbor目录不存在
    goto menu
)

set backup_dir=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
mkdir %backup_dir%

echo 备份数据库...
cd harbor
docker exec harbor-db pg_dumpall -c -U postgres > ../%backup_dir%/database_backup.sql
cd ..

echo 备份镜像数据...
if exist "data" (
    xcopy data %backup_dir%\data /E /I /Q
)

echo 备份配置文件...
copy harbor.yml %backup_dir%\
if exist "harbor\harbor.yml" (
    copy harbor\harbor.yml %backup_dir%\harbor_runtime.yml
)

echo 备份完成: %backup_dir%
goto menu

:cleanup
echo Harbor系统清理选项:
echo 1. 清理未使用的镜像
echo 2. 清理日志文件
echo 3. 完全重置 (危险!)
echo 4. 取消
set /p cleanup_choice=请选择 (1-4): 

if "%cleanup_choice%"=="1" (
    echo 清理未使用的镜像...
    docker system prune -f
)
if "%cleanup_choice%"=="2" (
    echo 清理日志文件...
    if exist "harbor" (
        cd harbor
        docker-compose exec harbor-core sh -c "find /var/log/harbor -name '*.log' -mtime +7 -delete"
        cd ..
    )
)
if "%cleanup_choice%"=="3" (
    echo 警告: 这将删除所有Harbor数据!
    set /p confirm=确认删除所有数据? (yes/no): 
    if "%confirm%"=="yes" (
        if exist "harbor" (
            cd harbor
            docker-compose down -v
            cd ..
        )
        if exist "data" rmdir /s /q data
        echo 完全重置完成
    )
)
if "%cleanup_choice%"=="4" goto menu
goto menu

:exit
echo 退出管理工具
pause
exit
