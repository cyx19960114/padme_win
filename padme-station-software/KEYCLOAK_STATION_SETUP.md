# 🔐 PADME Station Software Keycloak配置指南

## 📋 **需要创建的Keycloak客户端**

PADME Station Software需要在Keycloak中配置一个客户端来支持用户认证。

### **Keycloak客户端配置信息**

| 配置项 | 值 |
|--------|-----|
| **客户端ID** | `pht-station` |
| **客户端类型** | `confidential` |
| **认证** | 启用 |
| **标准流程** | 启用 |
| **重定向URI** | `http://localhost:3030/*` |

## 🛠️ **创建Station客户端步骤**

### **步骤1: 登录Keycloak管理控制台**
```
访问: http://localhost:8090
用户名: admin
密码: admin
```

### **步骤2: 选择PHT Realm**
- 确保选择的是 `pht` realm（不是master）

### **步骤3: 创建新客户端**
1. 点击 **"Clients"** 菜单
2. 点击 **"Create client"** 按钮
3. 填写客户端信息：
   - **Client type**: `OpenID Connect`
   - **Client ID**: `pht-station`
   - **Name**: `PHT Station Software`
   - **Description**: `PADME Station Software web interface`

### **步骤4: 配置客户端设置**

#### **Settings标签页**:
```yaml
General Settings:
  - Client ID: pht-station
  - Name: PHT Station Software  
  - Description: PADME Station Software web interface
  - Always display in console: OFF

Access Settings:
  - Root URL: http://localhost:3030
  - Home URL: http://localhost:3030
  - Valid redirect URIs: http://localhost:3030/*
  - Valid post logout redirect URIs: http://localhost:3030/*
  - Web origins: http://localhost:3030

Capability config:
  - Client authentication: ON
  - Authorization: OFF
  - Standard flow: ON
  - Implicit flow: OFF
  - Direct access grants: ON
  - Service accounts roles: ON

Login Settings:
  - Login theme: (empty)
  - Consent required: OFF
  - Display on consent screen: OFF
```

### **步骤5: 获取客户端密钥**
1. 转到 **"Credentials"** 标签页
2. 复制 **"Client secret"** 值
3. 记下这个密钥，需要在Station配置中使用

### **步骤6: 配置角色（可选）**
1. 转到 **"Roles"** 标签页
2. 创建Station相关角色：
   - `station-admin`: 管理员权限
   - `station-user`: 普通用户权限

## 🔧 **Station Software配置**

### **环境变量配置**

需要在`docker-compose.yml`中配置以下Keycloak相关环境变量：

```yaml
environment:
  # Keycloak认证配置
  - KC_AUTH_SERVER_URL=http://localhost:8090
  - KC_PUBLIC_KEY_URL=http://localhost:8090/realms/pht/protocol/openid-connect/certs
  - REACT_APP_KC_AUTH_SERVER_URL=http://localhost:8090
  
  # 其他认证配置
  - AUTH_SERVER_ADDRESS=localhost
  - AUTH_SERVER_PORT=8090
```

### **Keycloak客户端连接测试**

可以通过以下URL测试Keycloak配置：

```bash
# 测试Keycloak realm配置
http://localhost:8090/realms/pht/.well-known/openid_connect_configuration

# 测试客户端公钥
http://localhost:8090/realms/pht/protocol/openid-connect/certs
```

## 🎯 **认证流程**

1. **用户访问**: 用户访问 `http://localhost:3030`
2. **重定向登录**: 应用重定向到Keycloak登录页面
3. **用户认证**: 用户在Keycloak中输入凭据
4. **返回应用**: Keycloak验证成功后返回Station应用
5. **获取Token**: 应用获取访问令牌和身份信息
6. **访问资源**: 使用Token访问Station功能

## 🔒 **安全配置建议**

### **客户端安全**:
- ✅ 使用`confidential`客户端类型
- ✅ 启用客户端认证
- ✅ 配置正确的重定向URI
- ✅ 启用标准流程（Authorization Code Flow）

### **网络安全**:
- ⚠️ 本地开发使用HTTP（生产环境应使用HTTPS）
- ✅ 限制Web origins到特定域名
- ✅ 配置适当的CORS策略

## ❗ **常见问题排查**

### **问题1: 重定向URI不匹配**
```
错误: Invalid redirect_uri
解决: 确保Keycloak客户端配置中的重定向URI包含 http://localhost:3030/*
```

### **问题2: 客户端认证失败**
```
错误: Invalid client credentials
解决: 检查客户端密钥是否正确配置在Station环境变量中
```

### **问题3: CORS错误**
```
错误: Cross-Origin Request Blocked
解决: 在Keycloak客户端配置中添加 http://localhost:3030 到Web origins
```

### **问题4: 无法访问Station**
```
错误: Cannot GET /
解决: 检查React frontend是否正确构建和部署
```

## 📋 **配置检查清单**

### **Keycloak客户端配置**:
- [ ] 客户端ID: `pht-station`
- [ ] 客户端类型: `confidential`
- [ ] 客户端认证: 启用
- [ ] 标准流程: 启用
- [ ] 重定向URI: `http://localhost:3030/*`
- [ ] Web origins: `http://localhost:3030`
- [ ] 客户端密钥: 已获取

### **Station Software配置**:
- [ ] Keycloak URL配置正确
- [ ] 客户端密钥配置正确
- [ ] React frontend构建成功
- [ ] Docker容器运行正常

### **网络连接**:
- [ ] Keycloak服务运行在8090端口
- [ ] Station服务运行在3030端口
- [ ] 两个服务可以相互访问

## 🎉 **配置完成后**

当所有配置完成后，你应该能够：

1. **访问Station**: `http://localhost:3030`
2. **自动重定向**: 应用自动重定向到Keycloak登录
3. **用户登录**: 使用Keycloak用户凭据登录
4. **访问功能**: 登录后访问Station的所有功能

Station Software提供了完整的边缘客户端功能，包括：
- 🐳 Docker容器管理
- 🚂 PHT Train执行
- 📊 监控和日志
- 🔐 Vault密钥管理
- 📈 Federated Learning任务

**现在可以开始使用PADME Station Software进行边缘计算和联邦学习任务了！** 🚀
