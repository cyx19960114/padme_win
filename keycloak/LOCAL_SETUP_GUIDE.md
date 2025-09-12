# PADME Keycloak 本地部署和设置指南

这是一个完全本地化的Keycloak身份和访问管理(IAM)部署方案，为PADME生态系统提供统一的身份认证服务。

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少2GB可用内存
- 端口8090和5433需要空闲

## 快速开始

### Windows用户
双击运行 `deploy.bat` 脚本，或在命令行中执行：
```cmd
deploy.bat
```

### Linux/Mac用户
在终端中执行：
```bash
./deploy.sh
```

## 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤：

```bash
cd keycloak
# 确保proxynet网络存在
docker network create proxynet 2>/dev/null
docker-compose up -d --build
```

## 访问信息

### Keycloak Web界面
- **主页**: http://localhost:8090/auth
- **管理控制台**: http://localhost:8090/auth/admin

### 默认管理员凭据
- **用户名**: `admin`
- **密码**: `admin_password_2024`

### PostgreSQL数据库
- **主机**: localhost:5433
- **用户名**: postgres
- **密码**: keycloak_local_password_2024
- **数据库**: postgres

## 初始设置步骤

### 1. 等待服务启动
部署后请等待2-3分钟让服务完全启动。可以通过以下命令查看启动状态：

```bash
docker-compose logs -f
```

### 2. 访问管理控制台
在浏览器中打开：http://localhost:8090/auth/admin

使用默认凭据登录：
- 用户名：`admin`
- 密码：`admin_password_2024`

### 3. 创建PADME Realm

登录成功后，执行以下步骤：

1. 点击左上角的 "Master" 下拉菜单
2. 选择 "Create Realm"
3. 在 "Realm name" 字段输入：`pht`
4. 点击 "Create" 按钮

### 4. 配置Realm设置

在 `pht` realm中：

1. 转到 "Realm Settings"
2. 在 "General" 标签页设置：
   - Display name: `PADME PHT`
   - HTML Display name: `<strong>PADME PHT</strong>`
3. 在 "Login" 标签页可以配置登录选项
4. 点击 "Save"

## 创建客户端应用

为PADME服务创建客户端配置：

### 1. Central Service客户端

1. 转到 "Clients" 页面
2. 点击 "Create client"
3. 填写信息：
   - **Client type**: OpenID Connect
   - **Client ID**: `central-service`
   - **Name**: `PADME Central Service`
4. 点击 "Next"
5. 配置能力：
   - ✅ Client authentication
   - ✅ Authorization
   - ✅ Standard flow
   - ✅ Service accounts roles
6. 点击 "Next"
7. 配置登录设置：
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`
8. 点击 "Save"

### 2. 获取客户端凭据

在创建的客户端中：
1. 转到 "Credentials" 标签页
2. 复制 "Client secret" 值，保存备用

## 用户管理

### 创建测试用户

1. 转到 "Users" 页面
2. 点击 "Add user"
3. 填写基本信息：
   - **Username**: `testuser`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Email**: `test@localhost`
4. 点击 "Create"

### 设置用户密码

在用户详情页面：
1. 转到 "Credentials" 标签页
2. 点击 "Set password"
3. 输入密码：`testpassword`
4. 取消勾选 "Temporary"（如果希望密码永久有效）
5. 点击 "Save"

## 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看Keycloak日志
docker-compose logs -f keycloak

# 查看数据库日志
docker-compose logs -f postgres_keycloak
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 完全重建
```bash
docker-compose down -v  # 警告：这会删除数据库数据
docker-compose up -d --build
```

## 高级配置

### 自定义主题

如果需要自定义Keycloak主题：

1. 创建主题目录：
```bash
mkdir -p themes/padme/login
```

2. 在docker-compose.yml中添加卷挂载：
```yaml
volumes:
  - "./themes:/opt/keycloak/themes/custom"
```

### SSL/HTTPS配置

在生产环境中，建议配置HTTPS：

1. 修改docker-compose.yml：
```yaml
environment:
  KC_HTTP_ENABLED: false
  KC_HTTPS_CERTIFICATE_FILE: /path/to/cert.pem
  KC_HTTPS_CERTIFICATE_KEY_FILE: /path/to/key.pem
```

### 数据库备份

备份PostgreSQL数据：
```bash
docker exec keycloak-postgres_keycloak-1 pg_dump -U postgres postgres > keycloak_backup.sql
```

恢复数据：
```bash
docker exec -i keycloak-postgres_keycloak-1 psql -U postgres postgres < keycloak_backup.sql
```

## 与其他PADME服务集成

### 环境变量配置

其他PADME服务可以使用以下配置连接到Keycloak：

```yaml
environment:
  KEYCLOAK_URL: "http://keycloak:8080/auth"
  KEYCLOAK_REALM: "pht"
  KEYCLOAK_CLIENT_ID: "your-client-id"
  KEYCLOAK_CLIENT_SECRET: "your-client-secret"
```

### 网络连接

确保其他服务连接到相同的网络：
```yaml
networks:
  - keycloaknet
  - proxynet
```

## 故障排除

### 1. 服务无法启动
```bash
# 检查端口占用
netstat -ano | findstr :8090
netstat -ano | findstr :5433

# 查看详细错误
docker-compose logs keycloak
```

### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose logs postgres_keycloak

# 测试数据库连接
docker exec -it keycloak-postgres_keycloak-1 psql -U postgres -c "SELECT version();"
```

### 3. 无法访问管理控制台
- 确认服务已完全启动（等待2-3分钟）
- 检查防火墙设置
- 验证端口映射是否正确

### 4. 忘记管理员密码
重新设置管理员密码：
```bash
docker exec -it keycloak-keycloak-1 /opt/keycloak/bin/kc.sh admin-cli config credentials --server http://localhost:8080/auth --realm master --user admin
```

## 安全注意事项

⚠️ **生产环境警告**：
- 修改默认管理员密码
- 使用强密码策略
- 启用HTTPS
- 配置适当的CORS策略
- 定期备份数据库
- 限制网络访问

## 配置文件位置

- **Docker Compose**: `docker-compose.yml`
- **Keycloak配置**: 容器内 `/opt/keycloak/conf/`
- **数据库数据**: Docker卷 `keycloak_postgres_data`
- **日志**: 通过 `docker-compose logs` 查看

## 本地化修改说明

与原始版本相比，本地化版本进行了以下修改：

1. **直接端口访问**: 8090端口直接映射，无需反向代理
2. **数据库端口**: PostgreSQL映射到5433端口避免冲突
3. **预设管理员**: 自动创建管理员账户
4. **本地域名**: 使用localhost而非外部域名
5. **简化网络**: 支持本地和代理网络
6. **环境变量**: 预设所有必要的配置值
