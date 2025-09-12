# 🔧 Storehouse 快速修复指南

## 🚨 **当前问题**
- Storehouse显示中文登录界面
- "通过Keycloak登录"按钮无法点击
- 需要配置Keycloak客户端

## ⚡ **快速修复步骤**

### **第1步: 在Keycloak中创建客户端**

1. **访问Keycloak管理控制台**：
   - 打开：`http://localhost:8090`
   - 登录：admin / admin

2. **选择正确的Realm**：
   - 选择 **"pht"** realm

3. **创建Storehouse客户端**：
   - 点击 **"Clients"** → **"Create client"**
   - **Client ID**: `storehouse`
   - **Client Type**: `OpenID Connect`
   - **Client authentication**: `OFF` (公开客户端)
   - **Standard flow**: `ON`
   - **Root URL**: `http://localhost:5001`
   - **Valid redirect URIs**: `http://localhost:5001/*`
   - **Web origins**: `http://localhost:5001`
   - 点击 **"Save"**

### **第2步: 创建测试用户**

1. **在Keycloak中创建用户**：
   - 进入 **"Users"** → **"Add user"**
   - **Username**: `test-user`
   - **Email**: `test@localhost`
   - **First Name**: `Test`
   - **Last Name**: `User`
   - 点击 **"Create"**

2. **设置用户密码**：
   - 进入 **"Credentials"** 标签
   - 设置密码：`test123456`
   - 取消勾选 **"Temporary"**
   - 点击 **"Set Password"**

### **第3步: 测试修复**

1. **清除浏览器缓存**：
   - 按 `Ctrl + Shift + R` 强制刷新
   - 或者使用无痕模式访问

2. **重新访问Storehouse**：
   - 访问：`http://localhost:5001`
   - 点击"通过Keycloak登录"按钮
   - 使用 test-user / test123456 登录

## 🔄 **如果仍然有问题**

### **重启Storehouse服务**：
```bash
docker-compose restart storehouse
```

### **检查服务日志**：
```bash
docker-compose logs -f storehouse
```

### **验证Keycloak配置**：
- 确认客户端ID为 `storehouse`
- 确认重定向URI为 `http://localhost:5001/*`
- 确认客户端类型为 `public`

## ✅ **修复完成标志**
- 能够点击登录按钮
- 成功重定向到Keycloak
- 能够使用测试用户登录
- 返回Storehouse并看到应用界面
