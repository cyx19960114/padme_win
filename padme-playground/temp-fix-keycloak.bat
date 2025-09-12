@echo off
echo ========================================
echo PADME Playground Keycloak 紧急修复
echo ========================================

echo.
echo 检测到白屏问题，这是Keycloak配置问题。
echo.
echo 修复方法：
echo 1. 访问 http://localhost:8090/admin
echo 2. 登录 (admin/admin_password_2024)
echo 3. 进入 pht域 → Clients → playground → Settings
echo 4. 向下滚动找到并设置：
echo    Valid redirect URIs: http://localhost:3003/*
echo    Valid post logout redirect URIs: http://localhost:3003/*
echo    Web origins: http://localhost:3003
echo 5. 点击Save保存
echo 6. 刷新Playground页面
echo.

echo 按任意键检查服务状态...
pause > nul

echo.
echo 检查Docker服务状态：
docker-compose ps

echo.
echo 检查前端服务日志：
docker-compose logs frontend --tail 5

echo.
echo 如果问题仍然存在，请查看 IMMEDIATE_FIX.md 文件获取详细指导
echo.
pause
