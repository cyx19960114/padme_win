# 🔐 Keycloak Monitoring 客户端配置指南

## 📋 **配置要求**

为PADME Monitoring系统创建Keycloak客户端，包括前端和后端两个客户端。

## 🚀 **配置步骤**

### 1. **访问Keycloak管理控制台**
- 打开浏览器访问：`http://localhost:8090`
- 使用管理员账号登录（admin / admin）

### 2. **选择正确的Realm**
- 在左上角下拉菜单中选择 **"pht"** realm
- 确保您在正确的realm中操作

## 🔧 **后端客户端配置**

### 3. **创建后端客户端**
- 在左侧菜单中点击 **"Clients"**
- 点击 **"Create client"** 按钮

#### **后端客户端设置**:
```yaml
General Settings:
- Client type: OpenID Connect
- Client ID: monitoring-backend
- Name: PADME Monitoring Backend
- Description: PADME Monitoring Backend API

Capability config:
- Client authentication: ON (机密客户端)
- Authorization: OFF
- Standard flow: ON
- Direct access grants: ON
- Implicit flow: OFF
- Service accounts roles: ON

Access Settings:
- Root URL: http://localhost:8001
- Home URL: http://localhost:8001
- Valid redirect URIs: http://localhost:8001/*
- Valid post logout redirect URIs: http://localhost:8001/*
- Web origins: http://localhost:8001
```

#### **获取后端客户端密钥**:
- 点击 **"Credentials"** 标签
- 复制 **"Client secret"** 值
- 记录该密钥：`monitoring-backend-secret`

## 🖥️ **前端客户端配置**

### 4. **创建前端客户端**
- 再次点击 **"Create client"** 按钮创建第二个客户端

#### **前端客户端设置**:
```yaml
General Settings:
- Client type: OpenID Connect
- Client ID: monitoring-frontend
- Name: PADME Monitoring Frontend
- Description: PADME Monitoring Web Interface

Capability config:
- Client authentication: OFF (公开客户端)
- Authorization: OFF
- Standard flow: ON
- Direct access grants: OFF
- Implicit flow: OFF
- Service accounts roles: OFF

Access Settings:
- Root URL: http://localhost:5174
- Home URL: http://localhost:5174
- Valid redirect URIs: http://localhost:5174/*
- Valid post logout redirect URIs: http://localhost:5174/*
- Web origins: http://localhost:5174
```

## 👤 **创建监控用户**

### 5. **在Keycloak中创建用户**
- 进入 **"Users"** → **"Add user"**
- **Username**: `monitoring-user`
- **Email**: `monitoring@localhost`
- **First Name**: `Monitoring`
- **Last Name**: `User`
- 点击 **"Create"**

### 6. **设置用户密码**
- 进入新创建用户的 **"Credentials"** 标签
- 设置密码：`monitoring123456`
- 取消勾选 **"Temporary"**
- 点击 **"Set Password"**

### 7. **配置用户属性**
- 在 **"Details"** 标签中
- 设置 **"Email Verified"**: `ON`
- 设置 **"Enabled"**: `ON`

## 🔄 **更新应用配置**

### 8. **更新后端密钥**（如果与默认值不同）

如果您的后端客户端密钥与默认值不同，需要更新配置：

#### **修改docker-compose.yml**:
```yaml
environment:
  KEYCLOAK_CLIENT_SECRET: "您的实际后端客户端密钥"
```

#### **修改local.env**:
```bash
KEYCLOAK_CLIENT_SECRET=您的实际后端客户端密钥
```

### 9. **重启服务**:
```bash
docker-compose restart backend
```

## ✅ **验证配置**

### **检查后端客户端信息**：
- **Client ID**: `monitoring-backend`
- **Client Type**: `OpenID Connect`
- **Access Type**: `confidential`
- **Service Accounts**: `enabled`
- **Valid Redirect URIs**: `http://localhost:8001/*`

### **检查前端客户端信息**：
- **Client ID**: `monitoring-frontend`
- **Client Type**: `OpenID Connect`
- **Access Type**: `public`
- **Standard Flow**: `enabled`
- **Valid Redirect URIs**: `http://localhost:5174/*`

## 🧪 **测试登录流程**

### **测试步骤**：
1. 访问 `http://localhost:5174`
2. 应该重定向到Keycloak登录页面
3. 使用创建的用户账号登录：
   - 用户名：`monitoring-user`
   - 密码：`monitoring123456`
4. 登录后应该重定向回监控面板
5. 确认能够看到监控数据和仪表板

## 🔗 **API认证测试**

### **测试后端API**：
1. 访问 `http://localhost:8001/docs`
2. 查看Swagger API文档
3. 尝试调用需要认证的API端点
4. 确认JWT token验证正常工作

## 📊 **监控系统功能**

配置完成后，监控系统应该能够：

### **✅ 用户认证功能**：
- 通过Keycloak进行单点登录
- JWT token验证
- 用户会话管理
- 安全的API访问

### **✅ 监控功能**：
- PHT训练监控
- 站点状态监控
- 作业执行监控
- 实时指标展示
- 系统资源监控

### **✅ 数据管理**：
- PostgreSQL数据持久化
- Redis缓存
- 实时数据更新
- 历史数据查询

## 🛠️ **故障排除**

### **常见问题**：

#### **1. 前端无法登录**：
- **症状**: 登录后无法重定向或显示错误
- **解决**: 检查前端客户端的重定向URI配置

#### **2. 后端API认证失败**：
- **症状**: API调用返回401错误
- **解决**: 检查后端客户端密钥和配置

#### **3. Token验证失败**：
- **症状**: 无法访问受保护的API端点
- **解决**: 确认Keycloak服务器URL和realm配置正确

### **调试日志**：
```bash
# 查看后端认证相关日志
docker-compose logs backend | findstr -i keycloak
docker-compose logs backend | findstr -i auth
docker-compose logs backend | findstr -i token

# 查看前端日志
docker-compose logs frontend
```

## 🎯 **配置完成确认**

配置完成后，监控系统应该能够：
- ✅ 前端通过Keycloak进行用户认证
- ✅ 后端API进行JWT token验证
- ✅ 用户登录后查看监控面板
- ✅ 显示PHT训练、站点和作业数据
- ✅ 实时指标更新和历史数据查询

## 📝 **重要说明**

### **1. 客户端类型**：
- **后端**: 机密客户端，用于API认证
- **前端**: 公开客户端，用于用户登录

### **2. 安全配置**：
- 后端使用客户端密钥进行认证
- 前端使用授权码流进行登录
- 所有API调用需要有效的JWT token

### **3. 网络配置**：
- 后端监听端口：8001
- 前端监听端口：5174
- 数据库和Redis为内部网络访问

**配置完成！** 🎉

**现在您可以使用PADME Monitoring系统来监控PHT训练、站点和作业的运行状态了！**
