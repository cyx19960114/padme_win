# Keycloak登录界面修复指南

## 🔍 问题分析

Station Software无法显示Keycloak登录界面，直接进入主界面但显示认证错误。

## 📋 需要检查的Keycloak配置

### 1. 访问Keycloak管理界面
- **URL**: http://localhost:8090
- **用户名**: admin
- **密码**: admin_password_2024

### 2. 检查Realm配置
确保在 `pht` realm中：

#### 客户端1: pht-web (前端)
- **Client ID**: `pht-web`
- **Client Protocol**: `openid-connect`
- **Access Type**: `public`
- **Valid Redirect URIs**: 
  - `http://localhost:3030/*`
  - `http://localhost:3030/silent-check-sso.html`
- **Web Origins**: `http://localhost:3030`

#### 客户端2: pht-station (后端)
- **Client ID**: `pht-station`
- **Client Protocol**: `openid-connect`
- **Access Type**: `confidential`
- **Service Accounts Enabled**: `ON`
- **Valid Redirect URIs**: `http://localhost:3030/*`
- **Web Origins**: `http://localhost:3030`
- **Client Secret**: `9eDl3P2lWBhXvuYjy3rsCIi9MvOFFRak`

### 3. 检查用户配置
确保以下用户存在：
- **station1** / `station123`
- **station2** / `station123`
- **station3** / `station123`

## 🔧 修复步骤

### 步骤1: 检查Keycloak客户端
1. 访问 http://localhost:8090
2. 登录到 `pht` realm
3. 检查 `Clients` 部分是否有 `pht-web` 和 `pht-station`

### 步骤2: 创建缺失的客户端
如果客户端不存在，请创建：

#### 创建 pht-web 客户端
1. 点击 `Create`
2. 设置 `Client ID`: `pht-web`
3. 设置 `Client Protocol`: `openid-connect`
4. 点击 `Save`
5. 在 `Settings` 标签页：
   - `Access Type`: `public`
   - `Valid Redirect URIs`: `http://localhost:3030/*`
   - `Web Origins`: `http://localhost:3030`
6. 点击 `Save`

#### 创建 pht-station 客户端
1. 点击 `Create`
2. 设置 `Client ID`: `pht-station`
3. 设置 `Client Protocol`: `openid-connect`
4. 点击 `Save`
5. 在 `Settings` 标签页：
   - `Access Type`: `confidential`
   - `Service Accounts Enabled`: `ON`
   - `Valid Redirect URIs`: `http://localhost:3030/*`
   - `Web Origins`: `http://localhost:3030`
6. 在 `Credentials` 标签页：
   - 复制 `Secret` 值
7. 点击 `Save`

### 步骤3: 创建用户
1. 在 `Users` 部分点击 `Add user`
2. 创建以下用户：
   - **Username**: `station1`, **Password**: `station123`
   - **Username**: `station2`, **Password**: `station123`
   - **Username**: `station3`, **Password**: `station123`

### 步骤4: 测试登录
1. 访问 http://localhost:3030
2. 应该看到Keycloak登录界面
3. 使用 `station1` / `station123` 登录
4. 应该进入Station 1的界面

## 🚨 故障排除

### 如果仍然无法显示登录界面
1. 检查浏览器控制台是否有JavaScript错误
2. 检查Station Software日志：`docker logs pht-web-dynamic`
3. 确保Keycloak正在运行：`docker ps | findstr keycloak`

### 如果登录后显示错误
1. 检查用户是否正确创建
2. 检查客户端配置是否正确
3. 检查重定向URI是否匹配

## 📞 需要帮助？

如果按照以上步骤仍然无法解决问题，请提供：
1. Keycloak管理界面截图
2. Station Software日志
3. 浏览器控制台错误信息
