@echo off
echo PADME Vault 连接测试
echo ====================
echo.

echo 1. 检查Docker服务状态...
docker-compose ps
echo.

echo 2. 测试HTTPS连接 (端口8215)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://localhost:8215/v1/sys/health' -TimeoutSec 5 -UseBasicParsing -SkipCertificateCheck; Write-Host 'HTTPS连接成功 - 状态码:' $response.StatusCode } catch { Write-Host 'HTTPS连接失败:' $_.Exception.Message }"
echo.

echo 3. 检查端口监听状态...
netstat -an | findstr ":8215 " | findstr "LISTENING"
echo.

echo 4. 检查Vault容器内部状态...
docker exec vault-vault-1 vault status -tls-skip-verify 2>nul
if %errorlevel% equ 0 (
    echo Vault状态正常
) else (
    echo Vault可能未初始化或处于sealed状态
    echo 这是正常的，需要运行初始化和解封步骤
)
echo.

echo 5. 查看最近的Vault日志...
docker-compose logs --tail=10 vault
echo.

echo 测试完成！
echo.
echo 如果连接测试通过，你的Vault已经成功部署。
echo.
echo 下一步：
echo   1. 如果是首次部署，运行 quick-setup.bat 进行初始化
echo   2. 访问 Web UI: https://localhost:8215
echo   3. 使用 manage.bat 进行日常管理
echo.
pause
