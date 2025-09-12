@echo off
echo PADME Keycloak 快速设置向导
echo ============================
echo.
echo 此脚本将帮助您完成Keycloak的初始设置
echo 包括：创建realm、配置客户端、创建用户
echo.
pause

echo 1. 检查Keycloak服务状态...
docker-compose ps | findstr keycloak
if %errorlevel% neq 0 (
    echo 错误: Keycloak服务未运行
    echo 请先运行: deploy.bat
    pause
    exit /b 1
)

echo.
echo 2. 等待Keycloak完全启动...
echo 正在检查健康状态...
:wait_loop
docker exec keycloak-keycloak-1 curl -s http://localhost:8080/auth/health 2>nul | findstr "UP" >nul
if %errorlevel% neq 0 (
    echo 等待中...
    timeout /t 5 /nobreak > nul
    goto wait_loop
)
echo Keycloak已准备就绪！

echo.
echo 3. 设置完成后的访问信息：
echo.
echo 管理控制台: http://localhost:8090/auth/admin
echo 管理员用户名: admin
echo 管理员密码: admin_password_2024
echo.
echo 下一步手动操作:
echo.
echo [1] 创建 PHT Realm:
echo     - 访问 http://localhost:8090/auth/admin
echo     - 使用管理员凭据登录
echo     - 点击左上角 "Master" -> "Create Realm"
echo     - Realm name: pht
echo     - 点击 "Create"
echo.
echo [2] 创建客户端应用:
echo     - 在 pht realm 中，转到 "Clients"
echo     - 点击 "Create client"
echo     - Client ID: central-service
echo     - Client type: OpenID Connect
echo     - 启用 "Client authentication"
echo     - 设置 Valid redirect URIs: http://localhost:3000/*
echo.
echo [3] 创建测试用户:
echo     - 转到 "Users" -> "Add user"
echo     - Username: testuser
echo     - 保存后设置密码: testpassword
echo.
echo 4. 验证设置...
echo 如果需要验证配置，可以运行: test-keycloak.bat
echo.

echo.
echo ================================
echo Keycloak基础设置完成！
echo ================================
echo.
echo 重要信息:
echo 1. 管理控制台: http://localhost:8090/auth/admin
echo 2. 用户名: admin / 密码: admin_password_2024
echo 3. 需要手动创建 'pht' realm
echo.
echo 数据库信息:
echo - PostgreSQL端口: localhost:5433
echo - 用户名: postgres
echo - 密码: keycloak_local_password_2024
echo.
echo 其他操作:
echo - 管理工具: manage.bat
echo - 连接测试: test-keycloak.bat
echo - 查看日志: docker-compose logs -f
echo.

echo 正在打开管理控制台...
start http://localhost:8090/auth/admin

pause
