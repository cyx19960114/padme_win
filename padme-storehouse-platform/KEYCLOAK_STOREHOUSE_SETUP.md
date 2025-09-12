# 🔐 Keycloak Storehouse 客户端配置指南

## 📋 **配置要求**

为PADME Storehouse Platform创建Keycloak客户端，用于用户认证和授权。

## 🚀 **配置步骤**

### 1. **访问Keycloak管理控制台**
- 打开浏览器访问：`http://localhost:8090`
- 使用管理员账号登录（admin / admin）

### 2. **选择正确的Realm**
- 在左上角下拉菜单中选择 **"pht"** realm
- 确保您在正确的realm中操作

### 3. **创建新的客户端**
- 在左侧菜单中点击 **"Clients"**
- 点击 **"Create client"** 按钮

### 4. **基本客户端设置**
#### **General Settings**:
- **Client type**: `OpenID Connect`
- **Client ID**: `storehouse`
- **Name**: `PADME Storehouse Platform`
- **Description**: `PADME Train Storehouse Platform`

#### **Capability config**:
- ❌ **Client authentication**: `OFF` (公开客户端)
- ❌ **Authorization**: `OFF`
- ✅ **Standard flow**: `ON` (授权码流)
- ❌ **Direct access grants**: `OFF`
- ❌ **Implicit flow**: `OFF`
- ❌ **Service accounts roles**: `OFF`

### 5. **访问设置**
#### **Access Settings**:
- **Root URL**: `http://localhost:5001`
- **Home URL**: `http://localhost:5001`
- **Valid redirect URIs**: 
  ```
  http://localhost:5001/*
  ```
- **Valid post logout redirect URIs**:
  ```
  http://localhost:5001/*
  ```
- **Web origins**:
  ```
  http://localhost:5001
  ```

### 6. **高级设置**
#### **Advanced Settings**:
- **Access Token Lifespan**: `5 Minutes` (默认)
- **Client Session Idle**: `30 Minutes`
- **Client Session Max**: `12 Hours`

### 7. **保存配置**
- 点击 **"Save"** 按钮保存所有设置

## 👤 **创建Storehouse用户**

### 1. **在Keycloak中创建用户**
- 进入 **"Users"** → **"Add user"**
- **Username**: `storehouse-user`
- **Email**: `storehouse@localhost`
- **First Name**: `Storehouse`
- **Last Name**: `User`
- 点击 **"Create"**

### 2. **设置用户密码**
- 进入新创建用户的 **"Credentials"** 标签
- 设置密码：`storehouse123456`
- 取消勾选 **"Temporary"**
- 点击 **"Set Password"**

### 3. **配置用户属性**
- 在 **"Details"** 标签中
- 设置 **"Email Verified"**: `ON`
- 设置 **"Enabled"**: `ON`

## ✅ **验证配置**

### **检查客户端信息**：
- **Client ID**: `storehouse`
- **Client Type**: `OpenID Connect`
- **Access Type**: `public`
- **Valid Redirect URIs**: `http://localhost:5001/*`
- **Web Origins**: `http://localhost:5001`

### **测试登录流程**：
1. 访问 `http://localhost:5001`
2. 使用Keycloak认证登录
3. 使用创建的用户账号登录
4. 确认能够正常访问Storehouse平台

## 🔗 **GitLab Train Depot集成**

### **在Train Depot中创建必要的项目**：

#### **1. 创建PADME组**：
1. 访问 `http://localhost:8091`
2. 以admin身份登录
3. 创建新组：**"padme"**
4. 设置组可见性为 **"Internal"**

#### **2. 创建训练仓库项目**：
在padme组下创建以下项目：
- **项目名**: `padme-train-depot`
- **项目ID**: 记录创建后的项目ID (例如: 1)
- **描述**: `PADME Train Storage Repository`

#### **3. 创建联邦训练仓库项目**：
在padme组下创建以下项目：
- **项目名**: `padme-federated-train-depot`  
- **项目ID**: 记录创建后的项目ID (例如: 2)
- **描述**: `PADME Federated Train Storage Repository`

### **更新Storehouse配置**：
如果项目ID与默认值不同，需要更新`docker-compose.yml`：
```yaml
environment:
  GITLAB_GROUP_ID: "实际的组ID"
  GITLAB_STORE_ID: "padme-train-depot的项目ID"
  GITLAB_FEDERATED_STORE_ID: "padme-federated-train-depot的项目ID"
```

## 🔑 **API认证配置**

### **Token验证**：
Storehouse使用Keycloak的userinfo端点验证API token：
- **UserInfo URL**: `http://localhost:8090/realms/pht/protocol/openid-connect/userinfo`
- **认证方式**: Bearer Token
- **Token来源**: Keycloak访问令牌

### **API访问**：
- **API Base URL**: `http://localhost:5001/storehouse/api`
- **认证头**: `Authorization: Bearer <access_token>`
- **获取Token**: 通过Keycloak登录流程

## 📝 **重要说明**

### **1. 客户端类型**：
- Storehouse使用 **公开客户端** (public client)
- 不需要客户端密钥
- 适合前端应用和单页应用

### **2. 重定向URI**：
- 使用通配符 `/*` 允许所有子路径
- 确保与应用的实际路由匹配
- 本地开发使用HTTP协议

### **3. 依赖服务**：
- **Keycloak**: 用户认证和授权
- **Train Depot (GitLab)**: 训练算法仓库
- **Vault**: 密钥管理 (可选，开发模式可跳过)

## 🧪 **测试步骤**

### **1. 基础连接测试**：
```bash
# 测试Storehouse应用
curl http://localhost:5001

# 测试API端点 (需要认证)
curl -H "Authorization: Bearer <token>" http://localhost:5001/storehouse/api
```

### **2. Keycloak集成测试**：
1. 访问Storehouse首页
2. 进行Keycloak登录
3. 验证用户信息显示
4. 测试API调用

### **3. GitLab集成测试**：
1. 确认能够查看训练仓库
2. 测试分支列表获取
3. 验证训练算法展示

## 🛠️ **故障排除**

### **常见问题**：

#### **1. 认证失败**：
- **症状**: 无法登录或Token验证失败
- **解决**: 检查客户端配置和重定向URI

#### **2. API访问被拒绝**：
- **症状**: 401 Unauthorized错误
- **解决**: 确认Token有效性和API认证配置

#### **3. GitLab连接失败**：
- **症状**: 无法获取仓库信息
- **解决**: 检查GitLab URL和项目ID配置

### **调试日志**：
```bash
# 查看Storehouse详细日志
docker-compose logs -f storehouse

# 检查认证相关日志
docker-compose logs storehouse | grep -i auth
docker-compose logs storehouse | grep -i keycloak
docker-compose logs storehouse | grep -i token
```

## 🎯 **完成确认**

配置完成后，Storehouse应该能够：
- ✅ 通过Keycloak进行用户认证
- ✅ 显示用户登录状态
- ✅ 访问GitLab训练仓库
- ✅ 展示训练算法列表
- ✅ 提供API服务

**配置完成！** 🎉

**现在您可以使用PADME Storehouse Platform来浏览和管理训练算法了！**
