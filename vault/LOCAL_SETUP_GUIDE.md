# PADME Vault 本地部署和设置指南

这是一个完全本地化的HashiCorp Vault部署方案，用于PADME生态系统中的密钥存储和加密服务。

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少1GB可用内存
- 端口8215需要空闲

## 快速开始

### Windows用户
双击运行 `deploy.bat` 脚本，或在命令行中执行：
```cmd
deploy.bat
```

### Linux/Mac用户
在终端中执行：
```bash
./deploy.sh
```

## 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤：

```bash
cd vault
docker-compose up -d --build
```

## 重要：Vault初始化和设置

**Vault部署后必须手动初始化！** 以下是完整的设置步骤：

### 1. 初始化Vault

部署完成后，执行以下命令进入Vault容器：

```bash
docker exec -it vault-vault-1 /bin/ash
```

初始化Vault（**重要：请保存输出的root token和unseal key！**）：

```bash
vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1
```

示例输出：
```
Unseal Key 1: abcd1234efgh5678ijkl9012mnop3456qrst7890
Initial Root Token: hvs.abcdefghijklmnopqrstuvwxyz123456
```

**⚠️ 警告：请将上述密钥安全保存，重启后需要使用！**

### 2. 解封Vault

```bash
vault operator unseal -tls-skip-verify
```
输入上一步获得的Unseal Key。

### 3. 登录到Vault

```bash
vault login -tls-skip-verify
```
输入上一步获得的Root Token。

### 4. 启用AppRole认证

```bash
vault auth enable -tls-skip-verify approle
```

### 5. 为Central Service配置Vault

创建密钥存储引擎：
```bash
vault secrets enable -tls-skip-verify -version=2 -path=public_key kv-v2
vault secrets enable -tls-skip-verify transit
```

创建策略文件 `/tmp/centralservice.hcl`：
```bash
cat > /tmp/centralservice.hcl << 'EOF'
path "public_key/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}
path "transit/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}
EOF
```

创建策略：
```bash
vault policy write -tls-skip-verify centralservice /tmp/centralservice.hcl
```

创建AppRole：
```bash
vault write -tls-skip-verify auth/approle/role/centralservice \
    bind_secret_id=true \
    token_policies="centralservice" \
    secret_id_ttl=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0
```

获取role-id和secret-id（**保存这些值，其他服务需要使用**）：
```bash
vault read -tls-skip-verify auth/approle/role/centralservice/role-id
vault write -f -tls-skip-verify auth/approle/role/centralservice/secret-id
```

### 6. 为Train Creator/Store配置Vault（可选）

如果需要Train Creator或Train Store服务：

```bash
vault secrets enable -tls-skip-verify -version=2 -path=gitlab kv-v2

cat > /tmp/train-creator.hcl << 'EOF'
path "gitlab/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}
EOF

vault policy write -tls-skip-verify train-creator /tmp/train-creator.hcl

vault write -tls-skip-verify auth/approle/role/train-creator \
    bind_secret_id=true \
    token_policies="train-creator" \
    secret_id_ttl=0 \
    token_ttl=0 \
    token_max_ttl=0 \
    secret_id_num_uses=0

vault read -tls-skip-verify auth/approle/role/train-creator/role-id
vault write -f -tls-skip-verify auth/approle/role/train-creator/secret-id
```

## 访问Vault Web UI

Vault Web界面可以通过以下地址访问：
- **https://localhost:8215**

由于使用自签名证书，浏览器会显示安全警告，这是正常的。请点击"高级"并继续访问。

### 登录Web UI
1. 选择"Token"登录方式
2. 输入初始化时获得的Root Token
3. 点击"Sign in"

## 管理命令

### 查看容器状态
```bash
docker-compose ps
```

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 重新解封Vault（重启后需要）
```bash
docker exec -it vault-vault-1 /bin/ash
vault operator unseal -tls-skip-verify
# 输入unseal key
```

## 自动化解封脚本

创建一个自动解封脚本 `unseal.bat`（Windows）：

```batch
@echo off
echo Unsealing Vault...
set /p UNSEAL_KEY=Please enter your unseal key: 
docker exec -it vault-vault-1 vault operator unseal -tls-skip-verify %UNSEAL_KEY%
echo Vault unsealed!
pause
```

或 `unseal.sh`（Linux/Mac）：

```bash
#!/bin/bash
echo "Unsealing Vault..."
read -s -p "Please enter your unseal key: " UNSEAL_KEY
echo
docker exec -it vault-vault-1 vault operator unseal -tls-skip-verify $UNSEAL_KEY
echo "Vault unsealed!"
```

## 故障排除

### 1. Vault sealed状态
如果看到"Vault is sealed"错误：
```bash
docker exec -it vault-vault-1 vault operator unseal -tls-skip-verify
```

### 2. 证书错误
浏览器证书警告是正常的，因为使用自签名证书。

### 3. 容器无法启动
```bash
# 查看详细错误
docker-compose logs vault

# 检查端口占用
netstat -ano | findstr :8215
```

### 4. 忘记Token或Key
如果忘记了root token或unseal key，需要：
1. 停止容器：`docker-compose down`
2. 删除数据卷：`docker volume rm vault_vault-data`
3. 重新部署并初始化

## 安全注意事项

⚠️ **生产环境警告**：
- 本配置适用于本地开发和测试
- 生产环境请：
  - 使用多个unseal key（增加key-shares参数）
  - 配置真实的TLS证书
  - 限制网络访问
  - 定期备份数据
  - 使用更安全的认证方式

## 与其他PADME服务集成

配置完成后，其他PADME服务可以通过以下方式连接到Vault：

```yaml
environment:
  VAULT_ADDR: "https://vault:8200"
  VAULT_ROLE_ID: "your-role-id"
  VAULT_SECRET_ID: "your-secret-id"
networks:
  - vaultnet
```

并将证书卷挂载到客户端服务：
```yaml
volumes:
  - vault-certs-client:/vault/certs:ro
```

## 本地化修改说明

与原始版本相比，本地化版本进行了以下修改：

1. **端口绑定**: 改为本地访问，无需SSH隧道
2. **TLS配置**: 添加localhost和127.0.0.1到SAN
3. **网络配置**: 使用bridge驱动的本地网络
4. **自动化脚本**: 提供Windows和Linux的部署脚本
5. **简化访问**: 直接通过浏览器访问Web UI
