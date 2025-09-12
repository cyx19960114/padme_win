@echo off
echo ======================================
echo PADME Train Depot 管理脚本
echo ======================================

:menu
echo.
echo 请选择操作:
echo [1] 查看服务状态
echo [2] 查看服务日志
echo [3] 重启服务
echo [4] 停止服务
echo [5] 启动服务
echo [6] 查看GitLab初始密码
echo [7] 重置GitLab数据
echo [8] 清理所有数据
echo [0] 退出
echo.
set /p choice=请输入选择 (0-8): 

if "%choice%"=="1" goto status
if "%choice%"=="2" goto logs
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto start
if "%choice%"=="6" goto password
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
docker volume ls | findstr train-depot
goto menu

:logs
echo.
echo 📋 GitLab日志 (按Ctrl+C退出):
docker-compose logs -f gitlab
goto menu

:restart
echo.
echo 🔄 重启Train Depot服务...
docker-compose restart gitlab
echo ✅ 服务重启完成
echo ⚠️  请等待5-10分钟GitLab完全启动
goto menu

:stop
echo.
echo 🛑 停止Train Depot服务...
docker-compose down
echo ✅ 服务已停止
goto menu

:start
echo.
echo 🚀 启动Train Depot服务...
docker-compose up -d
echo ✅ 服务已启动
echo 📱 GitLab: http://depot.localhost:8091
echo 📱 Registry: http://registry.localhost:8092
echo ⚠️  请等待5-10分钟GitLab完全启动
goto menu

:password
echo.
echo 🔑 GitLab root用户初始密码:
echo 预设密码: padme123456
echo.
echo 或者查看容器内自动生成的密码:
docker-compose exec gitlab cat /etc/gitlab/initial_root_password 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  容器未运行或密码文件不存在
    echo 使用预设密码: padme123456
)
goto menu

:reset
echo.
echo ⚠️  警告: 这将重置GitLab所有数据!
set /p confirm=确认重置GitLab数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  重置GitLab数据...
    docker-compose down
    docker volume rm train-depot_train-depot-config 2>nul
    docker volume rm train-depot_train-depot-logs 2>nul
    docker volume rm train-depot_train-depot-data 2>nul
    echo ✅ GitLab数据重置完成
    echo 💡 下次启动将创建全新的GitLab实例
) else (
    echo ❌ 取消重置操作
)
goto menu

:cleanup
echo.
echo ⚠️  警告: 这将删除所有Train Depot数据!
set /p confirm=确认删除所有数据? (y/N): 
if /i "%confirm%"=="y" (
    echo 🗑️  清理Train Depot数据...
    docker-compose down -v
    docker volume rm train-depot_train-depot-config 2>nul
    docker volume rm train-depot_train-depot-logs 2>nul
    docker volume rm train-depot_train-depot-data 2>nul
    docker rmi gitlab/gitlab-ce:15.6.2-ce.0 2>nul
    rmdir /s /q data 2>nul
    echo ✅ 清理完成
) else (
    echo ❌ 取消清理操作
)
goto menu

:exit
echo.
echo 👋 退出Train Depot管理脚本
echo.
exit /b 0
