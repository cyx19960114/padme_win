# PADME Playground Keycloak 设置指南

本文档描述如何为PADME Playground配置Keycloak客户端。

## 🔧 **前提条件**

在开始之前，请确保：
1. ✅ Keycloak服务已启动并可通过 `http://localhost:8090` 访问
2. ✅ 已有"pht"域（realm）
3. ✅ 具有Keycloak管理员权限

## 📋 **配置步骤**

### 1. **访问Keycloak管理控制台**

1. 打开浏览器，访问：`http://localhost:8090/admin`
2. 使用管理员凭据登录：
   - 用户名：`admin`
   - 密码：`admin_password_2024`

### 2. **选择正确的域**

1. 在左上角，确保选择了 **"pht"** 域
2. 如果当前是其他域，点击下拉菜单选择"pht"

### 3. **创建Playground客户端**

#### 3.1 导航到客户端页面
1. 在左侧菜单中，点击 **"Clients"**
2. 点击右上角的 **"Create client"** 按钮

#### 3.2 基本客户端信息
在"General Settings"页面填写：

- **Client type**: `OpenID Connect`
- **Client ID**: `playground`
- **Name**: `PADME Playground`
- **Description**: `PADME Playground Frontend Application`

点击 **"Next"** 继续。

#### 3.3 客户端认证设置
在"Capability config"页面设置：

- **Client authentication**: `OFF` （公共客户端）
- **Authorization**: `OFF`
- **Authentication flow**: 保持默认选择
  - ✅ Standard flow
  - ✅ Direct access grants

点击 **"Next"** 继续。

#### 3.4 登录设置
在"Login settings"页面填写：

- **Root URL**: `http://localhost:3003`
- **Home URL**: `http://localhost:3003`
- **Valid redirect URIs**: 
  ```
  http://localhost:3003/*
  http://localhost:3003/silent-check-sso.html
  ```
- **Valid post logout redirect URIs**: `http://localhost:3003/*`
- **Web origins**: `http://localhost:3003`

点击 **"Save"** 保存配置。

### 4. **配置重定向URL（重要）**

根据您的截图，我看到您需要继续配置以下重要设置：

#### 4.1 在当前"Settings"页面中配置
您现在在正确的页面！需要向下滚动找到以下字段：

**在"Access settings"部分**（向下滚动查找）：
- **Valid redirect URIs**: 
  ```
  http://localhost:3003/*
  ```
- **Valid post logout redirect URIs**: 
  ```
  http://localhost:3003/*
  ```
- **Web origins**: 
  ```
  http://localhost:3003
  ```

#### 4.2 如何找到这些设置
1. 在当前页面向下滚动
2. 找到"Access settings"部分
3. 如果没有看到，请检查页面右侧的导航菜单，点击"Login settings"

#### 4.3 高级设置（可选）
如果需要高级设置，请：
1. 继续向下滚动到页面最底部
2. 找到"Advanced Settings"部分
3. 或者点击右侧导航菜单中的"Advanced"

**重要提醒**: 确保点击页面底部的 **"Save"** 按钮保存所有更改！

### 5. **配置客户端作用域（可选）**

如果需要特定的客户端作用域：

1. 点击 **"Client scopes"** 标签页
2. 可以根据需要添加或移除作用域

### 6. **验证配置**

#### 6.1 检查客户端设置
确保以下配置正确：
- ✅ Client ID: `playground`
- ✅ Client authentication: `OFF`
- ✅ Valid redirect URIs 包含 `http://localhost:3003/*`
- ✅ Web origins 设置为 `http://localhost:3003`

#### 6.2 测试访问
1. 打开浏览器访问：`http://localhost:3003`
2. 应该会自动重定向到Keycloak登录页面
3. 可以使用测试用户登录（如果已创建）

## 🔑 **用户管理**

### 创建测试用户（如果需要）

1. 在Keycloak管理控制台中，点击左侧的 **"Users"**
2. 点击 **"Add user"**
3. 填写用户信息：
   - **Username**: `playground-user`
   - **Email**: `playground@example.com`
   - **First name**: `Playground`
   - **Last name**: `User`
   - **Email verified**: `ON`
   - **Enabled**: `ON`
4. 点击 **"Create"**
5. 在"Credentials"标签页设置密码：
   - **Password**: `playground123`
   - **Temporary**: `OFF`
6. 点击 **"Set password"**

## 🌐 **访问Playground**

配置完成后，可以通过以下方式访问：

### 前端界面
- **URL**: `http://localhost:3003`
- **功能**: Playground Web界面，需要Keycloak认证

### 后端API
- **URL**: `http://localhost:3002`
- **功能**: REST API，需要认证令牌

### Blazegraph
- **URL**: `http://localhost:9998`
- **功能**: 语义数据库管理界面

## 🔍 **故障排除**

### 常见问题

#### 1. 重定向循环
如果出现重定向循环：
- 检查"Valid redirect URIs"是否正确
- 确保URL格式正确（包含协议）

#### 2. CORS错误
如果出现CORS错误：
- 检查"Web origins"是否包含 `http://localhost:3003`
- 确保backend的CORS配置正确

#### 3. 认证失败
如果认证失败：
- 确保用户已启用
- 检查用户密码是否正确设置
- 确保客户端类型为"公共"

### 查看日志
```bash
# 查看Playground后端日志
docker-compose logs playground-backend

# 查看Keycloak日志
docker-compose logs keycloak -f
```

## ✅ **配置完成**

如果所有步骤都正确完成，您应该能够：
1. ✅ 访问 `http://localhost:3003` 并看到Playground界面
2. ✅ 被重定向到Keycloak登录页面
3. ✅ 使用创建的用户成功登录
4. ✅ 登录后访问Playground的所有功能

恭喜！PADME Playground的Keycloak集成已完成配置！
