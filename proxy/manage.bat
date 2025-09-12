@echo off
:menu
echo.
echo PADME 反向代理管理工具
echo ========================
echo 1. 启动服务
echo 2. 停止服务
echo 3. 重启服务
echo 4. 查看状态
echo 5. 查看日志
echo 6. 测试连接
echo 7. 清理并重建
echo 8. 退出
echo.
set /p choice=请选择操作 (1-8): 

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto test
if "%choice%"=="7" goto rebuild
if "%choice%"=="8" goto exit
echo 无效选择，请重试
goto menu

:start
echo 启动反向代理服务...
docker-compose up -d
goto menu

:stop
echo 停止反向代理服务...
docker-compose down
goto menu

:restart
echo 重启反向代理服务...
docker-compose restart
goto menu

:status
echo 服务状态:
docker-compose ps
goto menu

:logs
echo 查看日志 (按Ctrl+C退出):
docker-compose logs -f
goto menu

:test
echo 测试连接...
echo 测试HTTP端口:
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost || echo "连接失败"
echo 测试HTTPS端口:
curl -s -o nul -w "HTTPS Status: %%{http_code}\n" https://localhost -k || echo "连接失败"
goto menu

:rebuild
echo 清理并重建服务...
docker-compose down
docker-compose up -d --build
goto menu

:exit
echo 退出管理工具
pause
exit
