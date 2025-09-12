@echo off
echo PADME Keycloak 连接测试
echo ========================
echo.

echo 1. 检查Docker服务状态...
docker-compose ps
echo.

echo 2. 测试HTTP连接 (端口8090)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8090/auth' -TimeoutSec 10 -UseBasicParsing; Write-Host 'HTTP连接成功 - 状态码:' $response.StatusCode } catch { Write-Host 'HTTP连接失败:' $_.Exception.Message }"
echo.

echo 3. 测试管理控制台...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8090/auth/admin' -TimeoutSec 10 -UseBasicParsing; Write-Host '管理控制台连接成功 - 状态码:' $response.StatusCode } catch { Write-Host '管理控制台连接失败:' $_.Exception.Message }"
echo.

echo 4. 检查端口监听状态...
echo Keycloak端口 (8090):
netstat -an | findstr ":8090 " | findstr "LISTENING"
echo PostgreSQL端口 (5433):
netstat -an | findstr ":5433 " | findstr "LISTENING"
echo.

echo 5. 检查数据库连接...
docker exec keycloak-postgres_keycloak-1 psql -U postgres -c "SELECT 'Database connection OK' as status;" 2>nul || echo "数据库连接失败"
echo.

echo 6. 检查Keycloak健康状态...
docker exec keycloak-keycloak-1 curl -s http://localhost:8080/auth/health 2>nul | findstr "UP" && echo "Keycloak健康检查: 通过" || echo "Keycloak健康检查: 失败或未启动"
echo.

echo 7. 查看最近的日志...
echo === Keycloak日志 ===
docker-compose logs --tail=5 keycloak
echo.
echo === PostgreSQL日志 ===
docker-compose logs --tail=5 postgres_keycloak
echo.

echo 测试完成！
echo.
echo 如果所有测试都通过，你的Keycloak已经成功部署。
echo.
echo 访问信息:
echo   - 主页: http://localhost:8090/auth
echo   - 管理控制台: http://localhost:8090/auth/admin
echo   - 管理员用户名: admin
echo   - 管理员密码: admin_password_2024
echo.
echo 下一步:
echo   1. 访问管理控制台创建 'pht' realm
echo   2. 配置客户端应用
echo   3. 创建用户和角色
echo   4. 使用 manage.bat 进行日常管理
echo.
pause
