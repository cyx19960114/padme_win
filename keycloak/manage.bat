@echo off
:menu
echo.
echo PADME Keycloak 管理工具
echo =======================
echo 1. 启动Keycloak
echo 2. 停止Keycloak
echo 3. 重启Keycloak
echo 4. 查看状态
echo 5. 查看日志
echo 6. 数据库管理
echo 7. 备份数据库
echo 8. 进入Keycloak容器
echo 9. 测试连接
echo 0. 退出
echo.
set /p choice=请选择操作 (0-9): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto database
if "%choice%"=="7" goto backup
if "%choice%"=="8" goto shell
if "%choice%"=="9" goto test
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:start
echo 启动Keycloak服务...
docker-compose up -d
echo 等待服务启动完成...
timeout /t 10 /nobreak > nul
goto menu

:stop
echo 停止Keycloak服务...
docker-compose down
goto menu

:restart
echo 重启Keycloak服务...
docker-compose restart
echo 等待服务重启完成...
timeout /t 15 /nobreak > nul
goto menu

:status
echo Keycloak服务状态:
docker-compose ps
goto menu

:logs
echo 选择查看日志:
echo 1. 所有服务
echo 2. Keycloak
echo 3. PostgreSQL
set /p log_choice=请选择 (1-3): 
if "%log_choice%"=="1" docker-compose logs -f
if "%log_choice%"=="2" docker-compose logs -f keycloak
if "%log_choice%"=="3" docker-compose logs -f postgres_keycloak
goto menu

:database
echo 数据库管理选项:
echo 1. 连接到数据库
echo 2. 查看数据库状态
echo 3. 重启数据库
set /p db_choice=请选择 (1-3): 
if "%db_choice%"=="1" docker exec -it keycloak-postgres_keycloak-1 psql -U postgres
if "%db_choice%"=="2" docker exec keycloak-postgres_keycloak-1 psql -U postgres -c "SELECT version();"
if "%db_choice%"=="3" docker-compose restart postgres_keycloak
goto menu

:backup
echo 备份数据库...
set backup_file=keycloak_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%.sql
docker exec keycloak-postgres_keycloak-1 pg_dump -U postgres postgres > %backup_file%
echo 数据库已备份到: %backup_file%
goto menu

:shell
echo 进入Keycloak容器...
echo 在容器内可以执行kc.sh等命令
docker exec -it keycloak-keycloak-1 /bin/bash
goto menu

:test
echo 测试Keycloak连接...
echo 测试HTTP端口:
curl -s -o nul -w "Keycloak Status: %%{http_code}\n" http://localhost:8090/auth || echo "连接失败"
echo.
echo 测试数据库连接:
docker exec keycloak-postgres_keycloak-1 psql -U postgres -c "SELECT 'Database OK';" 2>nul || echo "数据库连接失败"
echo.
echo 检查服务健康状态:
docker exec keycloak-keycloak-1 curl -s http://localhost:8080/auth/health 2>nul | findstr "UP" && echo "Keycloak健康检查通过" || echo "Keycloak可能未完全启动"
goto menu

:exit
echo 退出管理工具
pause
exit
