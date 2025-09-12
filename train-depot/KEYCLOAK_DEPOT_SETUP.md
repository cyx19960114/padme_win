# 🔐 Keycloak Train Depot 客户端配置指南

## 📋 **配置要求**

为PADME Train Depot (GitLab)创建Keycloak客户端，用于OIDC单点登录集成。

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
- **Client ID**: `depot`
- **Name**: `PADME Train Depot`
- **Description**: `PADME Train Depot GitLab Instance`

#### **Capability config**:
- ✅ **Client authentication**: `ON` (机密客户端)
- ✅ **Authorization**: `OFF`
- ✅ **Standard flow**: `ON` (授权码流)
- ❌ **Direct access grants**: `OFF`
- ❌ **Implicit flow**: `OFF`
- ❌ **Service accounts roles**: `OFF`

### 5. **访问设置**
#### **Access Settings**:
- **Root URL**: `http://depot.localhost:8091`
- **Home URL**: `http://depot.localhost:8091`
- **Valid redirect URIs**: 
  ```
  http://depot.localhost:8091/users/auth/openid_connect/callback
  ```
- **Valid post logout redirect URIs**:
  ```
  http://depot.localhost:8091/*
  ```
- **Web origins**:
  ```
  http://depot.localhost:8091
  ```

### 6. **获取客户端密钥**
#### **Credentials 标签**:
- 点击 **"Credentials"** 标签
- 复制 **"Client secret"** 值
- 记录该密钥，稍后需要用于GitLab配置

### 7. **高级设置**
#### **Advanced Settings**:
- **Access Token Lifespan**: `5 Minutes` (默认)
- **Client Session Idle**: `30 Minutes`
- **Client Session Max**: `12 Hours`

### 8. **保存配置**
- 点击 **"Save"** 按钮保存所有设置

## 🔧 **更新GitLab配置**

如果您的客户端密钥与默认值不同，需要更新GitLab配置：

### **修改docker-compose.yml**:
```yaml
# 在 GITLAB_OMNIBUS_CONFIG 中更新密钥
client_options: {
  identifier: "depot",
  secret: "您的实际客户端密钥",
  redirect_uri: "http://depot.localhost:8091/users/auth/openid_connect/callback"
}
```

### **重启GitLab服务**:
```bash
docker-compose restart gitlab
```

## 👤 **创建Train Depot用户**

### 1. **在Keycloak中创建用户**
- 进入 **"Users"** → **"Add user"**
- **Username**: `depot-user`
- **Email**: `depot@localhost`
- **First Name**: `Depot`
- **Last Name**: `User`
- 点击 **"Create"**

### 2. **设置用户密码**
- 进入新创建用户的 **"Credentials"** 标签
- 设置密码：`depot123456`
- 取消勾选 **"Temporary"**
- 点击 **"Set Password"**

### 3. **配置用户属性**
- 在 **"Details"** 标签中
- 设置 **"Email Verified"**: `ON`
- 设置 **"Enabled"**: `ON`

## ✅ **验证配置**

### **检查客户端信息**：
- **Client ID**: `depot`
- **Client Type**: `OpenID Connect`
- **Access Type**: `confidential`
- **Valid Redirect URIs**: `http://depot.localhost:8091/users/auth/openid_connect/callback`
- **Web Origins**: `http://depot.localhost:8091`

### **测试登录流程**：
1. 访问 `http://depot.localhost:8091`
2. 点击 **"Keycloak"** 登录按钮
3. 使用创建的用户账号登录
4. 确认能够重定向回GitLab并成功登录

## 🔗 **Harbor集成配置**

### **在Harbor中配置OIDC**：
1. 访问 `http://localhost:8080`
2. 以admin身份登录
3. 进入 **"Administration"** → **"Configuration"** → **"Authentication"**
4. 选择 **"OIDC"** 认证方式
5. 配置OIDC设置：
   - **OIDC Provider Name**: `Keycloak`
   - **OIDC Provider Endpoint**: `https://localhost:8090/realms/pht`
   - **OIDC Client ID**: `harbor`
   - **OIDC Client Secret**: `[Harbor客户端密钥]`
   - **OIDC Scope**: `openid,profile,email`

## 📝 **重要说明**

1. **端口配置**: 确保所有URL中的端口号与实际服务端口一致
2. **协议**: 在本地开发环境中使用HTTP（生产环境应使用HTTPS）
3. **Realm选择**: 必须在"pht" realm中创建客户端
4. **客户端类型**: Train Depot需要机密客户端（confidential client）

## 🎯 **完成确认**

配置完成后，Train Depot应该能够：
- ✅ 通过Keycloak进行单点登录
- ✅ 用户可以使用Keycloak账号登录GitLab
- ✅ 自动创建GitLab用户账号
- ✅ 与Harbor进行集成认证

**配置完成！** 🎉
