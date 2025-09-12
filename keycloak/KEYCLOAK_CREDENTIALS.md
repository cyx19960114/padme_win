# PADME Keycloak 凭据记录

**⚠️ 重要：请妥善保存以下凭据信息！**

## 管理员凭据

### Keycloak管理员
- **用户名**: `admin`
- **密码**: `admin_password_2024`

## 数据库凭据

### PostgreSQL数据库
- **主机**: `localhost:5433`
- **用户名**: `postgres`
- **密码**: `keycloak_local_password_2024`
- **数据库名**: `postgres`

## 访问信息

### Web界面
- **Keycloak主页**: http://localhost:8090/
- **管理控制台**: http://localhost:8090/admin/
- **Master Realm控制台**: http://localhost:8090/admin/master/console/

### 开发模式特殊说明
Keycloak当前运行在开发模式下，路径结构可能与生产模式不同。如果遇到404错误，尝试以下路径：
- http://localhost:8090/
- http://localhost:8090/admin/
- http://localhost:8090/realms/master/

## 下一步操作

### 1. 访问管理控制台
1. 打开浏览器访问：http://localhost:8090/admin/
2. 使用管理员凭据登录
3. 如果页面显示错误，尝试访问：http://localhost:8090/

### 2. 创建PHT Realm
1. 在管理控制台中
2. 点击左上角的"Master"下拉菜单
3. 选择"Create Realm"
4. 输入Realm名称：`pht`
5. 点击"Create"

### 3. 配置客户端
根据PADME服务需要配置相应的客户端应用。

---

**安全提醒**：
- 请将此文件保存在安全位置
- 不要将凭据提交到版本控制系统
- 在生产环境中使用更强的密码
- 定期轮换密钥和令牌
