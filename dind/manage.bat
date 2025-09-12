@echo off
:menu
echo.
echo PADME Docker-in-Docker 管理工具
echo ===============================
echo 1. 启动DinD
echo 2. 停止DinD
echo 3. 重启DinD
echo 4. 查看状态
echo 5. 查看日志
echo 6. 连接到DinD
echo 7. 测试DinD连接
echo 8. 清理DinD环境
echo 9. 进入DinD容器
echo 0. 退出
echo.
set /p choice=请选择操作 (0-9): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto connect
if "%choice%"=="7" goto test
if "%choice%"=="8" goto cleanup
if "%choice%"=="9" goto shell
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:start
echo 启动DinD服务...
docker-compose up -d
echo 等待服务启动完成...
timeout /t 30 /nobreak > nul
goto menu

:stop
echo 停止DinD服务...
docker-compose down
goto menu

:restart
echo 重启DinD服务...
docker-compose restart
echo 等待服务重启完成...
timeout /t 20 /nobreak > nul
goto menu

:status
echo DinD服务状态:
docker-compose ps
echo.
echo 健康检查:
docker-compose exec dind docker info 2>nul && echo "DinD守护进程: 运行正常" || echo "DinD守护进程: 未运行或有问题"
goto menu

:logs
echo 选择查看日志:
echo 1. 实时日志
echo 2. 最近100行
echo 3. 最近10分钟
set /p log_choice=请选择 (1-3): 
if "%log_choice%"=="1" docker-compose logs -f dind
if "%log_choice%"=="2" docker-compose logs --tail=100 dind
if "%log_choice%"=="3" docker-compose logs --since=10m dind
goto menu

:connect
echo 设置连接到DinD的环境变量...
echo.
echo 请在当前会话中执行以下命令:
echo.
echo PowerShell:
echo $env:DOCKER_HOST="tcp://localhost:2376"
echo $env:DOCKER_TLS_VERIFY="1"
echo $env:DOCKER_CERT_PATH="./certs/client"
echo.
echo CMD:
echo set DOCKER_HOST=tcp://localhost:2376
echo set DOCKER_TLS_VERIFY=1
echo set DOCKER_CERT_PATH=./certs/client
echo.
echo 设置后可以直接使用docker命令连接到DinD
goto menu

:test
echo 测试DinD连接...
echo.
echo 测试1: 基本连接
docker -H tcp://localhost:2375 info >nul 2>&1 && echo "非安全连接: 成功" || echo "非安全连接: 失败"
echo.
echo 测试2: 运行测试容器
docker -H tcp://localhost:2375 run --rm hello-world
echo.
echo 测试3: 检查DNS解析
docker -H tcp://localhost:2375 run --rm alpine nslookup google.com
goto menu

:cleanup
echo DinD环境清理选项:
echo 1. 清理未使用的镜像
echo 2. 清理所有停止的容器
echo 3. 完全清理 (危险!)
echo 4. 取消
set /p cleanup_choice=请选择 (1-4): 
if "%cleanup_choice%"=="1" docker -H tcp://localhost:2375 image prune -af
if "%cleanup_choice%"=="2" docker -H tcp://localhost:2375 container prune -f
if "%cleanup_choice%"=="3" docker -H tcp://localhost:2375 system prune -af --volumes
if "%cleanup_choice%"=="4" goto menu
goto menu

:shell
echo 进入DinD容器...
echo 在容器内可以直接使用docker命令
docker-compose exec dind sh
goto menu

:exit
echo 退出管理工具
pause
exit
