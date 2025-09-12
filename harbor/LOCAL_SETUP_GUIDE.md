# PADME Harbor 本地部署指南

这是一个完全本地化的Harbor容器注册表部署方案，为PADME生态系统提供企业级的Docker镜像存储和管理服务。

## 什么是Harbor？

Harbor是一个开源的容器镜像注册表，提供以下企业级功能：
- 基于角色的访问控制(RBAC)
- 镜像漏洞扫描(Trivy集成)
- 镜像签名和验证(Cosign支持)
- OIDC/LDAP集成
- Webhook通知
- 镜像复制和同步
- Helm Chart管理

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少4GB可用内存
- 至少10GB磁盘空间
- 端口8080需要空闲
- 稳定的网络连接（用于下载Harbor安装包）

## 快速开始

### 步骤1: 下载Harbor安装包

#### Windows用户
```cmd
download-harbor.bat
```

#### Linux/Mac用户
```bash
chmod +x download-harbor.sh
./download-harbor.sh
```

这会下载Harbor v2.8.4离线安装包并自动解压。

### 步骤2: 部署Harbor

#### Windows用户
```cmd
deploy.bat
```

#### Linux/Mac用户
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

## 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤：

### 1. 下载Harbor
从[Harbor Releases](https://github.com/goharbor/harbor/releases)下载v2.8.4版本的离线安装包。

### 2. 解压安装包
```bash
tar -zxf harbor-offline-installer-v2.8.4.tgz
```

### 3. 配置Harbor
```bash
# 复制配置文件
cp harbor.yml harbor/harbor.yml

# 进入Harbor目录
cd harbor

# 准备安装
sudo ./prepare

# 启动服务
sudo docker-compose up -d
```

## 访问信息

### Web界面
- **Harbor管理界面**: http://localhost:8080
- **Docker Registry**: localhost:8080

### 默认凭据
- **管理员用户名**: `admin`
- **管理员密码**: `Harbor12345`
- **数据库密码**: `root123`

## 使用Harbor

### 1. 登录Web界面
1. 打开浏览器访问：http://localhost:8080
2. 使用默认凭据登录
3. **立即更改管理员密码！**

### 2. 创建项目
1. 点击"项目"
2. 点击"新建项目"
3. 输入项目名称（如：`padme-local`）
4. 选择访问级别（公开/私有）
5. 点击"确定"

### 3. 推送镜像到Harbor

#### 登录到Harbor Registry
```bash
docker login localhost:8080
# 输入用户名: admin
# 输入密码: Harbor12345
```

#### 标记并推送镜像
```bash
# 标记现有镜像
docker tag nginx:latest localhost:8080/padme-local/nginx:latest

# 推送镜像
docker push localhost:8080/padme-local/nginx:latest
```

#### 从Harbor拉取镜像
```bash
docker pull localhost:8080/padme-local/nginx:latest
```

### 4. 管理用户和权限
1. 转到"系统管理" → "用户管理"
2. 创建新用户
3. 在项目中分配角色权限

## 高级配置

### 与Keycloak集成（OIDC认证）

如果你已经部署了PADME Keycloak服务，可以配置OIDC单点登录：

#### 1. 在Keycloak中创建Harbor客户端
1. 登录Keycloak管理控制台
2. 选择`pht` realm
3. 转到"Clients" → "Create"
4. 配置：
   - Client ID: `harbor`
   - Client Protocol: `openid-connect`
   - Root URL: `http://localhost:8080`
   - Access Type: `confidential`

#### 2. 在Harbor中配置OIDC
1. 登录Harbor管理界面
2. 转到"系统管理" → "配置" → "认证"
3. 选择认证模式：`OIDC`
4. 配置OIDC参数：
   - OIDC Provider Name: `Keycloak`
   - OIDC Endpoint: `http://localhost:8090/auth/realms/pht`
   - OIDC Client ID: `harbor`
   - OIDC Client Secret: `[从Keycloak获取]`
   - Group Claim Name: `groups`
   - OIDC Admin Group: `harbor-admin`
   - OIDC Scope: `openid,profile,email`

### 配置镜像扫描
Harbor集成了Trivy进行漏洞扫描：

1. 转到"系统管理" → "扫描器"
2. 确认Trivy扫描器已启用
3. 在项目设置中启用自动扫描
4. 推送镜像时会自动进行安全扫描

### 配置Webhook
设置Webhook来响应Harbor事件：

1. 转到项目设置 → "Webhooks"
2. 点击"新建Webhook"
3. 配置Webhook URL和事件类型
4. 测试Webhook连接

## 管理命令

### 查看服务状态
```bash
cd harbor
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f harbor-core
docker-compose logs -f harbor-db
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
docker-compose down -v  # 删除数据卷
sudo ./prepare          # 重新准备
docker-compose up -d
```

### 备份和恢复

#### 备份Harbor数据
```bash
# 备份数据库
docker exec harbor-db pg_dumpall -c -U postgres > harbor_database_backup.sql

# 备份镜像数据
tar -czf harbor_registry_backup.tar.gz ./data/registry/
```

#### 恢复Harbor数据
```bash
# 恢复数据库
docker exec -i harbor-db psql -U postgres < harbor_database_backup.sql

# 恢复镜像数据
tar -xzf harbor_registry_backup.tar.gz
```

## 故障排除

### 1. 服务无法启动
```bash
# 检查端口占用
netstat -ano | findstr :8080

# 查看Docker日志
docker-compose logs
```

### 2. 镜像推送失败
```bash
# 检查登录状态
docker info | grep Username

# 重新登录
docker logout localhost:8080
docker login localhost:8080
```

### 3. Web界面无法访问
```bash
# 检查防火墙设置
# 确认所有服务都在运行
docker-compose ps

# 检查Nginx代理状态
docker-compose logs harbor-proxy
```

### 4. 数据库连接问题
```bash
# 检查PostgreSQL状态
docker-compose logs harbor-db

# 测试数据库连接
docker exec -it harbor-db psql -U postgres -d postgres
```

## 性能优化

### 1. 存储优化
```yaml
# 在harbor.yml中配置外部存储
storage_service:
  s3:
    accesskey: YOUR_ACCESS_KEY
    secretkey: YOUR_SECRET_KEY
    region: us-east-1
    bucket: harbor-storage
```

### 2. 缓存配置
```yaml
# 启用缓存层
cache:
  enabled: true
  expire_hours: 24
```

### 3. 资源限制
```yaml
# 在docker-compose.yml中添加资源限制
services:
  core:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

## 与PADME集成

### 配置PADME服务使用Harbor

在PADME服务的docker-compose配置中：

```yaml
services:
  padme-service:
    image: localhost:8080/padme-local/service:latest
    environment:
      HARBOR_REGISTRY: localhost:8080
      HARBOR_PROJECT: padme-local
```

### CI/CD集成
```bash
# 在CI/CD流水线中
docker login localhost:8080 -u admin -p Harbor12345
docker build -t localhost:8080/padme-local/app:${VERSION} .
docker push localhost:8080/padme-local/app:${VERSION}
```

## 安全注意事项

⚠️ **重要安全提醒**：
- 立即更改默认管理员密码
- 使用强密码策略
- 启用OIDC/LDAP集成
- 定期更新Harbor版本
- 配置网络访问控制
- 启用镜像漏洞扫描
- 定期备份数据

## 生产环境考虑

- 使用HTTPS配置
- 外部数据库和Redis
- 负载均衡配置
- 高可用性部署
- 监控和告警
- 日志聚合

## 本地化修改说明

与原始版本相比，本地化版本进行了以下修改：

1. **简化网络**: 使用HTTP而非HTTPS（本地开发）
2. **默认端口**: 直接映射到8080端口
3. **本地存储**: 使用本地文件系统存储
4. **简化配置**: 移除外部依赖配置
5. **自动化脚本**: 提供下载和部署脚本
6. **预设密码**: 便于本地开发和测试
