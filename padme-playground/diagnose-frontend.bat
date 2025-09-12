@echo off
echo ========================================
echo PADME Playground 前端问题诊断
echo ========================================

echo.
echo 1. 检查服务状态...
docker-compose ps

echo.
echo 2. 检查前端日志...
echo 最近的前端访问日志：
docker-compose logs frontend --tail 5

echo.
echo 3. 检查后端连通性...
echo 测试后端API:
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3002' -UseBasicParsing).StatusCode } catch { 'Error: ' + $_.Exception.Message }"

echo.
echo 4. 检查Keycloak连通性...
echo 测试Keycloak:
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:8090' -UseBasicParsing).StatusCode } catch { 'Error: ' + $_.Exception.Message }"

echo.
echo 5. 重启前端服务（可能修复问题）...
echo 重启前端容器...
docker-compose restart frontend

echo.
echo 等待10秒让服务重新启动...
timeout /t 10 /nobreak > nul

echo.
echo 6. 再次测试前端...
echo 测试前端:
powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3003' -UseBasicParsing).StatusCode } catch { 'Error: ' + $_.Exception.Message }"

echo.
echo ========================================
echo 诊断完成！
echo ========================================
echo.
echo 现在请：
echo 1. 确认在Keycloak中已保存playground客户端配置
echo 2. 清除浏览器缓存（Ctrl+Shift+Del）
echo 3. 刷新 http://localhost:3003 页面
echo 4. 检查浏览器控制台是否还有错误
echo.
pause
