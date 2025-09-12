# 🔑 Keycloak 用户创建指南

## 🎉 成功！Central Service已经可以显示Keycloak登录界面

## 📝 创建测试用户账号

### 1. 登录Keycloak管理控制台
- 访问: http://localhost:8090/admin
- 用户名: `admin`
- 密码: `admin_password_2024`

### 2. 切换到PHT Realm
1. 点击左上角的"master"下拉菜单
2. 选择"pht" realm

### 3. 创建新用户
1. 在左侧菜单中点击"Users"
2. 点击"Add user"按钮
3. 填写用户信息：
   ```
   Username: testuser
   Email: test@example.com
   First Name: Test
   Last Name: User
   ```
4. 点击"Save"

### 4. 设置用户密码
1. 在用户详情页面，点击"Credentials"选项卡
2. 点击"Set password"
3. 输入密码：`test123456`
4. 关闭"Temporary"开关（这样密码就不需要在首次登录时更改）
5. 点击"Save"

### 5. 测试登录
现在你可以使用以下凭据登录Central Service：
- **用户名**: `testuser`
- **密码**: `test123456`

## 🔧 Console错误修复

### 关于Console中的错误：
1. **`Unchecked runtime.lastError`** - 这是浏览器扩展的错误，不影响应用功能
2. **认证相关错误** - 可能是因为没有有效的用户账号

创建用户后这些错误应该会消失。

## 🚀 测试流程

1. 创建用户后，刷新 http://localhost:3000
2. 使用新创建的用户名和密码登录
3. 应该能成功进入Central Service主界面

## 🎯 预期结果

登录成功后，你应该能看到：
- PADME Central Service的主界面
- 训练请求管理功能
- 站点管理功能
- 其他Central Service功能

---

**恭喜！你已经成功部署了完整的PADME Central Service！** 🎊
