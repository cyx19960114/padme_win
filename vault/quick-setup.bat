@echo off
echo PADME Vault 快速设置脚本
echo =========================
echo.
echo 此脚本将帮助您完成Vault的初始设置
echo 包括：初始化、解封、配置认证和创建策略
echo.
pause

echo 1. 检查Vault容器状态...
docker-compose ps | findstr vault
if %errorlevel% neq 0 (
    echo 错误: Vault容器未运行
    echo 请先运行: deploy.bat
    pause
    exit /b 1
)

echo.
echo 2. 初始化Vault...
echo 请保存输出的token和key!
echo.
docker exec -it vault-vault-1 vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1

echo.
echo 请复制并保存上述信息！
echo.
set /p unseal_key=现在请输入Unseal Key: 
set /p root_token=请输入Root Token: 

echo.
echo 3. 解封Vault...
docker exec -it vault-vault-1 vault operator unseal -tls-skip-verify %unseal_key%

echo.
echo 4. 登录到Vault...
echo %root_token% | docker exec -i vault-vault-1 vault login -tls-skip-verify -

echo.
echo 5. 启用AppRole认证...
docker exec -it vault-vault-1 vault auth enable -tls-skip-verify approle

echo.
echo 6. 配置Central Service...
docker exec -it vault-vault-1 vault secrets enable -tls-skip-verify -version=2 -path=public_key kv-v2
docker exec -it vault-vault-1 vault secrets enable -tls-skip-verify transit

echo 创建centralservice策略...
docker exec -it vault-vault-1 sh -c "cat > /tmp/centralservice.hcl << 'EOF'
path \"public_key/*\" {
  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\"]
}
path \"transit/*\" {
  capabilities = [\"create\", \"read\", \"update\", \"patch\", \"delete\", \"list\"]
}
EOF"

docker exec -it vault-vault-1 vault policy write -tls-skip-verify centralservice /tmp/centralservice.hcl

docker exec -it vault-vault-1 vault write -tls-skip-verify auth/approle/role/centralservice bind_secret_id=true token_policies="centralservice" secret_id_ttl=0 token_ttl=0 token_max_ttl=0 secret_id_num_uses=0

echo.
echo 7. 获取Central Service凭据...
echo === Central Service Role ID ===
docker exec -it vault-vault-1 vault read -tls-skip-verify auth/approle/role/centralservice/role-id
echo.
echo === Central Service Secret ID ===
docker exec -it vault-vault-1 vault write -f -tls-skip-verify auth/approle/role/centralservice/secret-id

echo.
echo.
echo ================================
echo Vault设置完成！
echo ================================
echo.
echo 重要信息:
echo 1. Root Token: %root_token%
echo 2. Unseal Key: %unseal_key%
echo 3. Web UI: https://localhost:8215
echo.
echo 请将上述信息安全保存！
echo 重启后需要使用Unseal Key解封Vault
echo.
echo 其他操作:
echo - 管理工具: manage.bat
echo - 查看日志: docker-compose logs -f
echo - 进入容器: docker exec -it vault-vault-1 /bin/ash
echo.
pause
