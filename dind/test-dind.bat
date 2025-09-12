@echo off
echo PADME Docker-in-Docker 连接测试
echo =================================
echo.

echo 1. 检查Docker服务状态...
docker-compose ps
echo.

echo 2. 测试DinD端口连接...
echo 测试端口2375 (非安全):
powershell -Command "try { $response = (New-Object System.Net.Sockets.TcpClient).Connect('localhost', 2375); Write-Host '端口2375: 开放' } catch { Write-Host '端口2375: 关闭或无响应' }"

echo 测试端口2376 (安全):
powershell -Command "try { $response = (New-Object System.Net.Sockets.TcpClient).Connect('localhost', 2376); Write-Host '端口2376: 开放' } catch { Write-Host '端口2376: 关闭或无响应' }"
echo.

echo 3. 检查端口监听状态...
echo Docker API端口:
netstat -an | findstr ":2375 " | findstr "LISTENING"
netstat -an | findstr ":2376 " | findstr "LISTENING"
echo.

echo 4. 测试Docker API连接...
echo 非安全连接测试:
docker -H tcp://localhost:2375 version --format "Client: {{.Client.Version}}, Server: {{.Server.Version}}" 2>nul || echo "连接失败"
echo.

echo 5. 测试容器运行...
echo 运行hello-world容器:
docker -H tcp://localhost:2375 run --rm hello-world 2>nul && echo "容器运行: 成功" || echo "容器运行: 失败"
echo.

echo 6. 测试DNS解析...
echo DNS解析测试:
docker -H tcp://localhost:2375 run --rm alpine nslookup google.com 2>nul | findstr "Address" && echo "DNS解析: 成功" || echo "DNS解析: 失败"
echo.

echo 7. 检查DinD内部状态...
echo dnsmasq进程:
docker-compose exec dind ps aux 2>nul | findstr dnsmasq && echo "dnsmasq: 运行中" || echo "dnsmasq: 未运行"

echo Docker守护进程:
docker-compose exec dind docker info 2>nul | findstr "Server Version" && echo "Docker守护进程: 正常" || echo "Docker守护进程: 异常"
echo.

echo 8. 查看最近的日志...
echo === DinD服务日志 ===
docker-compose logs --tail=10 dind
echo.

echo 测试完成！
echo.
echo 如果所有测试都通过，你的DinD已经成功部署。
echo.
echo 连接信息:
echo   - 非安全API: docker -H tcp://localhost:2375 [命令]
echo   - 安全API:   需要配置TLS证书
echo.
echo 使用示例:
echo   docker -H tcp://localhost:2375 ps
echo   docker -H tcp://localhost:2375 run --rm nginx
echo   docker -H tcp://localhost:2375 build -t myapp .
echo.
echo 管理工具: manage.bat
echo.
pause
