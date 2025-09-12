# 🔐 Keycloak Train Creator 客户端配置指南

## 📋 **配置要求**

为PADME Train Creator创建Keycloak客户端，用于用户身份验证和授权。

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
- **Client ID**: `train-creator`
- **Name**: `PADME Train Creator`
- **Description**: `PADME Train Creator Web Application`

#### **Capability config**:
- ✅ **Client authentication**: `OFF` (公共客户端)
- ✅ **Authorization**: `OFF`
- ✅ **Standard flow**: `ON` (授权码流)
- ✅ **Direct access grants**: `ON` (资源所有者密码凭证)
- ❌ **Implicit flow**: `OFF`
- ❌ **Service accounts roles**: `OFF`

### 5. **访问设置**
#### **Access Settings**:
- **Root URL**: `http://localhost:5000`
- **Home URL**: `http://localhost:5000`
- **Valid redirect URIs**: 
  ```
  http://localhost:5000/*
  ```
- **Valid post logout redirect URIs**:
  ```
  http://localhost:5000/*
  ```
- **Web origins**:
  ```
  http://localhost:5000
  ```

### 6. **高级设置**
#### **Advanced**:
- **Access Token Lifespan**: `5 Minutes` (默认)
- **Client Session Idle**: `30 Minutes`
- **Client Session Max**: `12 Hours`

### 7. **保存配置**
- 点击 **"Save"** 按钮保存所有设置

## ✅ **验证配置**

### **检查客户端信息**：
- **Client ID**: `train-creator`
- **Access Type**: `public`
- **Valid Redirect URIs**: `http://localhost:5000/*`
- **Web Origins**: `http://localhost:5000`

### **获取配置信息**：
- **Realm**: `pht`
- **Auth Server URL**: `http://localhost:8090`
- **Client ID**: `train-creator`
- **UserInfo URL**: `http://localhost:8090/realms/pht/protocol/openid-connect/userinfo`

## 🔧 **应用配置**

Train Creator应用将使用以下环境变量：

```bash
KC_REALM=pht
KC_URL=http://localhost:8090
KC_CLIENT_ID=train-creator
KC_USERINFO_URL=http://localhost:8090/realms/pht/protocol/openid-connect/userinfo
```

## 📝 **注意事项**

1. **端口配置**: 确保所有URL中的端口号与实际服务端口一致
2. **协议**: 在本地开发环境中使用HTTP（生产环境应使用HTTPS）
3. **Realm选择**: 必须在"pht" realm中创建客户端
4. **重定向URI**: 必须包含通配符`/*`以支持应用内的所有路由

## 🎯 **完成确认**

配置完成后，Train Creator应该能够：
- ✅ 重定向用户到Keycloak进行登录
- ✅ 接收授权码并交换访问令牌
- ✅ 验证用户身份
- ✅ 访问用户信息

**配置完成！** 🎉
