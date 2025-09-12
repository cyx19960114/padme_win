@echo off
echo PADME 反向代理连接测试
echo ========================
echo.

echo 1. 检查Docker服务状态...
docker-compose ps
echo.

echo 2. 测试HTTP连接 (端口80)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost' -TimeoutSec 5 -UseBasicParsing; Write-Host 'HTTP连接成功 - 状态码:' $response.StatusCode } catch { Write-Host 'HTTP连接失败:' $_.Exception.Message }"
echo.

echo 3. 测试HTTPS连接 (端口443)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://localhost' -TimeoutSec 5 -UseBasicParsing -SkipCertificateCheck; Write-Host 'HTTPS连接成功 - 状态码:' $response.StatusCode } catch { Write-Host 'HTTPS连接失败:' $_.Exception.Message }"
echo.

echo 4. 检查端口监听状态...
netstat -an | findstr ":80 " | findstr "LISTENING"
netstat -an | findstr ":443 " | findstr "LISTENING"
echo.

echo 5. 查看最近的代理日志...
echo 代理服务日志:
docker-compose logs --tail=5 reverse_proxy
echo.
echo 证书服务日志:
docker-compose logs --tail=5 reverse_proxy_certs
echo.

echo 测试完成！
echo.
echo 如果所有测试都通过，你的反向代理已经成功部署。
echo 你现在可以：
echo   1. 在浏览器中访问 http://localhost 或 https://localhost
echo   2. 添加后端服务到 proxynet 网络
echo   3. 配置 VIRTUAL_HOST 环境变量来路由流量
echo.
pause
