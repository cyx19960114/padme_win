# PADME Harbor 凭据和配置信息

**⚠️ 重要：请妥善保存以下凭据信息！**

## 🔑 Harbor访问凭据

### Web管理界面
- **URL**: http://localhost:8080
- **管理员用户名**: `admin`
- **管理员密码**: `Harbor12345`

### Docker Registry
- **Registry地址**: `localhost:8080`
- **登录命令**: `docker login localhost:8080`

## 🗄️ 数据库凭据

### PostgreSQL数据库
- **主机**: harbor-db (容器内)
- **端口**: 5432
- **用户名**: postgres
- **密码**: `root123`
- **数据库**: postgres, registry, notaryserver, notarysigner

### Redis缓存
- **主机**: redis (容器内)
- **端口**: 6379
- **密码**: 无

## ⚙️ 系统配置

### Harbor版本信息
- **Harbor版本**: v2.8.4
- **配置版本**: 2.8.0
- **准备容器**: goharbor/prepare:v2.8.4

### 存储配置
- **数据目录**: `./data`
- **日志目录**: `/var/log/harbor`
- **配置目录**: `./common/config`

### 网络配置
- **主机名**: localhost
- **外部URL**: http://localhost:8080
- **HTTP端口**: 8080
- **代理网络**: proxynet (如果连接)

## 📦 服务组件

### 核心服务
- **harbor-core**: 核心API服务
- **harbor-portal**: Web UI前端
- **harbor-db**: PostgreSQL数据库
- **redis**: Redis缓存
- **registry**: Docker Registry v2
- **registryctl**: Registry控制器

### 可选服务
- **harbor-jobservice**: 后台任务服务
- **trivy-adapter**: 漏洞扫描适配器
- **harbor-proxy**: Nginx反向代理

## 🔧 配置参数

### 日志配置
```yaml
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor
```

### 作业服务配置
```yaml
jobservice:
  max_job_workers: 10
  logger_sweeper_duration: 1 #days
```

### 通知配置
```yaml
notification:
  webhook_job_max_retry: 3
  webhook_job_http_client_timeout: 3 #seconds
```

### 上传清理配置
```yaml
upload_purging:
  enabled: true
  age: 168h      # 7天
  interval: 24h  # 每24小时执行一次
```

## 🔐 安全设置

### 默认安全配置
- **内部TLS**: 禁用（本地开发）
- **认证模式**: 本地数据库
- **自动扫描**: 可配置
- **内容信任**: 可配置

### 推荐安全加固
1. **更改管理员密码**
2. **启用OIDC认证** (与Keycloak集成)
3. **配置RBAC权限**
4. **启用镜像扫描**
5. **配置Webhook通知**

## 📊 监控和维护

### 系统状态检查
```bash
# 检查容器状态
docker-compose ps

# 检查服务健康状态
curl -f http://localhost:8080/api/v2.0/systeminfo

# 检查数据库连接
docker exec harbor-db psql -U postgres -c "SELECT version();"
```

### 日志查看
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f harbor-core
docker-compose logs -f harbor-db
```

### 磁盘使用监控
```bash
# 检查数据目录大小
du -sh ./data

# 检查镜像存储大小
du -sh ./data/registry
```

## 🔄 备份和恢复

### 数据备份命令
```bash
# 备份数据库
docker exec harbor-db pg_dumpall -c -U postgres > harbor_db_backup.sql

# 备份镜像数据
tar -czf harbor_registry_backup.tar.gz ./data/registry/

# 备份配置
tar -czf harbor_config_backup.tar.gz ./common/
```

### 数据恢复命令
```bash
# 恢复数据库
docker exec -i harbor-db psql -U postgres < harbor_db_backup.sql

# 恢复镜像数据
tar -xzf harbor_registry_backup.tar.gz

# 恢复配置
tar -xzf harbor_config_backup.tar.gz
```

## 🌐 使用示例

### Docker Registry操作
```bash
# 登录Registry
docker login localhost:8080
# 用户名: admin
# 密码: Harbor12345

# 标记镜像
docker tag nginx:latest localhost:8080/library/nginx:v1.0

# 推送镜像
docker push localhost:8080/library/nginx:v1.0

# 拉取镜像
docker pull localhost:8080/library/nginx:v1.0
```

### 项目管理
1. **创建项目**: 在Web界面创建新项目
2. **设置权限**: 配置项目访问权限
3. **配置策略**: 设置安全策略和自动扫描

### 用户管理
1. **创建用户**: 在用户管理中创建新用户
2. **分配角色**: 在项目中分配用户角色
3. **配置权限**: 设置用户访问权限

## 🔗 API访问

### REST API
- **API Base URL**: http://localhost:8080/api/v2.0
- **认证方式**: Basic Auth 或 Bearer Token
- **API文档**: http://localhost:8080/devcenter

### CLI工具
Harbor提供CLI工具进行自动化管理：
```bash
# 安装Harbor CLI
# 配置Harbor endpoint和凭据
# 执行自动化操作
```

---

**安全提醒**：
- 请将此文件保存在安全位置
- 不要将凭据提交到版本控制系统
- 在生产环境中使用更强的密码
- 定期轮换密钥和令牌
- 监控访问日志和异常活动
