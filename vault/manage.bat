@echo off
:menu
echo.
echo PADME Vault 管理工具
echo ====================
echo 1. 启动Vault
echo 2. 停止Vault
echo 3. 重启Vault
echo 4. 查看状态
echo 5. 查看日志
echo 6. 解封Vault
echo 7. 进入Vault容器
echo 8. 测试连接
echo 9. 初始化新Vault
echo 0. 退出
echo.
set /p choice=请选择操作 (0-9): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto unseal
if "%choice%"=="7" goto shell
if "%choice%"=="8" goto test
if "%choice%"=="9" goto init
if "%choice%"=="0" goto exit
echo 无效选择，请重试
goto menu

:start
echo 启动Vault服务...
docker-compose up -d
goto menu

:stop
echo 停止Vault服务...
docker-compose down
goto menu

:restart
echo 重启Vault服务...
docker-compose restart
goto menu

:status
echo Vault服务状态:
docker-compose ps
goto menu

:logs
echo 查看日志 (按Ctrl+C退出):
docker-compose logs -f
goto menu

:unseal
echo 解封Vault...
echo 如果Vault显示sealed状态，请使用此选项
set /p unseal_key=请输入unseal key: 
docker exec -it vault-vault-1 vault operator unseal -tls-skip-verify %unseal_key%
goto menu

:shell
echo 进入Vault容器...
echo 在容器内可以执行vault命令
docker exec -it vault-vault-1 /bin/ash
goto menu

:test
echo 测试Vault连接...
echo 测试HTTPS端口:
curl -s -k -o nul -w "Vault Status: %%{http_code}\n" https://localhost:8215/v1/sys/health || echo "连接失败"
echo.
echo 测试Vault状态:
docker exec vault-vault-1 vault status -tls-skip-verify 2>nul || echo "Vault可能未初始化或已sealed"
goto menu

:init
echo 初始化新Vault实例...
echo 警告: 这将创建新的root token和unseal key
echo 请确保已备份当前配置
pause
echo.
echo 正在初始化...
docker exec -it vault-vault-1 vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1
echo.
echo 请保存上述输出的token和key!
goto menu

:exit
echo 退出管理工具
pause
exit
