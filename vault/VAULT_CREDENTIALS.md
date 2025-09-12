# PADME Vault 凭据记录

**⚠️ 重要：请妥善保存以下凭据信息！**

## 初始化信息

### Unseal Key（解封密钥）
```
iCrClfzZvEwzJnqs46Fl+VhHAgWrf3d4biXSLM3zKig=
```

### Root Token（根令牌）
```
hvs.X5tK3wS0UBB3ukB7stGvm2sM
```

## 使用说明

### 重启后解封Vault
每次重启容器后，需要使用以下命令解封：
```bash
docker exec vault-vault-1 vault operator unseal -tls-skip-verify iCrClfzZvEwzJnqs46Fl+VhHAgWrf3d4biXSLM3zKig=
```

### 登录Vault
```bash
docker exec -it vault-vault-1 vault login -tls-skip-verify hvs.X5tK3wS0UBB3ukB7stGvm2sM
```

### Web UI访问
- URL: https://localhost:8215
- 登录方式: Token
- Token: `hvs.X5tK3wS0UBB3ukB7stGvm2sM`

## 服务配置凭据

运行完整的Central Service配置后，将在此处记录role-id和secret-id等信息。

### Central Service
- Role ID: （运行setup后获得）
- Secret ID: （运行setup后获得）

### Train Creator/Store
- Role ID: （运行setup后获得）
- Secret ID: （运行setup后获得）

---

**安全提醒**：
- 请将此文件保存在安全位置
- 不要将凭据提交到版本控制系统
- 定期轮换密钥和令牌
- 在生产环境中使用更强的安全措施
