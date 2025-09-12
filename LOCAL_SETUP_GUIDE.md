# PADME Central Service 本地部署指南

这是一个完全本地化的PADME Central Service部署方案，为PADME生态系统提供核心的训练协调和管理服务。

## 什么是PADME Central Service？

PADME Central Service是PADME生态系统的核心组件，提供以下功能：
- **训练请求管理**: 创建和管理联邦学习训练请求
- **车站管理**: 管理参与训练的各个数据节点（车站）
- **作业调度**: 协调和监控训练任务的执行
- **Harbor集成**: 管理容器镜像的分发和版本控制
- **Keycloak集成**: 提供统一的身份认证和授权
- **Vault集成**: 安全的密钥和配置管理
- **Web界面**: 用户友好的训练请求界面

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少8GB可用内存
- 至少20GB磁盘空间
- 端口3000, 5434, 9000, 9001需要空闲
- 已部署的依赖服务（Vault, Keycloak, Harbor）

## 依赖服务

Central Service需要以下PADME服务正常运行：
- **Vault** (localhost:8215) - 密钥管理
- **Keycloak** (localhost:8090) - 身份认证
- **Harbor** (localhost:8080) - 容器注册表

## 快速开始

### 步骤1: 确保依赖服务运行

确保以下服务已启动并正常运行：
```cmd
# 检查Vault
curl http://localhost:8215/v1/sys/health

# 检查Keycloak  
curl http://localhost:8090/

# 检查Harbor
curl http://localhost:8080/
```

### 步骤2: 部署Central Service

#### Windows用户
```cmd
deploy.bat
```

#### Linux/Mac用户
```bash
chmod +x deploy.sh
./deploy.sh
```

### 步骤3: 配置Keycloak客户端

运行Keycloak配置脚本：
```cmd
setup-keycloak.bat
```

按照脚本指示在Keycloak中创建所需的客户端。

## 手动部署

如果自动脚本遇到问题，可以手动执行以下步骤：

### 1. 构建Docker镜像
```bash
docker build -t padme-central-service:local .
```

### 2. 启动服务
```bash
docker-compose up -d
```

### 3. 检查服务状态
```bash
docker-compose ps
docker-compose logs centralservice
```

## 访问信息

### Central Service Web界面
- **URL**: http://localhost:3000
- **API端点**: http://localhost:3000/api

### 数据库服务
- **PostgreSQL**: localhost:5434
- **用户名**: postgres
- **密码**: central_postgres_password_2024
- **数据库**: postgres

### 对象存储服务
- **MinIO**: localhost:9000
- **控制台**: localhost:9001
- **用户名**: centralservice
- **密码**: minio_password_2024

## 服务架构

Central Service包含以下组件：

### 主要服务
- **centralservice**: Node.js应用 + React前端
- **postgres_center**: PostgreSQL数据库
- **minio**: MinIO对象存储
- **dind**: Docker-in-Docker (用于训练容器执行)

### 网络配置
- **centernetwork**: 内部服务通信
- **proxynet**: 代理网络(连接到其他PADME服务)
- **vaultnet**: Vault网络(连接到Vault服务)

### 数据卷
- **postgres_center_data**: 数据库数据持久化
- **minio_data**: 对象存储数据持久化
- **dind-***: Docker-in-Docker相关证书和数据

## Keycloak集成配置

### 前端客户端 (central-service)
```
Client ID: central-service
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: ON
Implicit Flow Enabled: ON
Direct Access Grants Enabled: ON
Root URL: http://localhost:3000
Valid Redirect URIs: http://localhost:3000/*
Web Origins: http://localhost:3000
```

### 后端客户端 (central-service-backend)
```
Client ID: central-service-backend
Client Protocol: openid-connect
Access Type: confidential
Standard Flow Enabled: ON
Implicit Flow Enabled: OFF
Direct Access Grants Enabled: ON
Service Accounts Enabled: ON
Authorization Enabled: ON
Root URL: http://localhost:3000
Valid Redirect URIs: http://localhost:3000/*
Web Origins: http://localhost:3000
Backchannel Session Logout Required: ON
```

### Harbor受众映射
为`central-service`客户端添加Harbor受众：
```
Name: harbor-audience
Mapper Type: Audience
Included Client Audience: harbor
Add to Access Token: ON
Add to token introspection: ON
```

## 环境配置

### 本地化配置摘要
```yaml
# 主机配置
HOST_ADDRESS: localhost
HOST_PORT: 3000

# 数据库配置
DB_HOST: center_database
DB_PASSWORD: central_postgres_password_2024

# Harbor集成
HARBOR_ADDRESS: localhost
HARBOR_PORT: 8080
HARBOR_ADMIN_USER: admin
HARBOR_ADMIN_PASSWORD: Harbor12345

# Keycloak集成
AUTH_SERVER_ADDRESS: localhost
AUTH_SERVER_PORT: 8090
AUTH_SERVER_ADMIN_CLI_USERNAME: admin
AUTH_SERVER_ADMIN_CLI_PASSWORD: admin_password_2024

# Vault集成
VAULT_HOST: localhost
VAULT_PORT: 8215

# MinIO配置
MINIO_ENDPOINT: minio
MINIO_USE_SSL: false
MINIO_ADMIN_USER: centralservice
MINIO_ADMIN_PASSWORD: minio_password_2024

# 禁用功能 (本地开发)
SLACK_INTEGRATION_ENABLED: false
MAIL_HOST: "" (邮件功能禁用)
```

## 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看应用日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f centralservice
docker-compose logs -f postgres_center
docker-compose logs -f minio
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart centralservice
```

### 停止服务
```bash
docker-compose down
```

### 完全重建
```bash
# 停止并删除所有容器和卷
docker-compose down -v

# 重新构建镜像
docker build -t padme-central-service:local .

# 重新启动
docker-compose up -d
```

## 故障排除

### 1. 服务无法启动
```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5434
netstat -ano | findstr :9000

# 查看详细错误日志
docker-compose logs centralservice
```

### 2. 数据库连接失败
```bash
# 检查PostgreSQL状态
docker-compose logs postgres_center

# 测试数据库连接
docker exec -it padme_win-postgres_center-1 psql -U postgres -d postgres
```

### 3. Web界面无法访问
```bash
# 检查Central Service状态
docker-compose logs centralservice

# 检查是否完成React构建
docker exec -it padme_win-centralservice-1 ls -la TrainRequester/build/
```

### 4. 依赖服务连接问题
```bash
# 检查网络连接
docker network ls
docker network inspect padme_win_centernetwork

# 测试服务连接
docker exec -it padme_win-centralservice-1 curl http://localhost:8080
```

## 开发和调试

### 本地开发模式
```bash
# 使用开发配置
NODE_ENV=development docker-compose up

# 监控文件变化
docker-compose logs -f centralservice
```

### 数据库管理
```bash
# 连接到数据库
docker exec -it padme_win-postgres_center-1 psql -U postgres -d postgres

# 查看表结构
\dt

# 运行数据库迁移
docker exec -it padme_win-centralservice-1 npm run migrate
```

### MinIO管理
- 访问MinIO控制台: http://localhost:9001
- 用户名: centralservice
- 密码: minio_password_2024

## 与PADME集成

### 训练流程集成
1. **用户认证**: 通过Keycloak进行单点登录
2. **镜像管理**: 使用Harbor存储和分发训练镜像
3. **密钥管理**: 通过Vault管理训练相关的密钥和配置
4. **容器执行**: 使用DinD执行训练容器
5. **结果存储**: 使用MinIO存储训练结果和中间数据

### API集成示例
```javascript
// 获取系统信息
GET http://localhost:3000/api/system/info

// 创建训练请求
POST http://localhost:3000/api/trains
{
  "name": "My Training Job",
  "image": "localhost:8080/padme/training:latest",
  "stations": ["station1", "station2"]
}

// 查看训练状态
GET http://localhost:3000/api/trains/{trainId}
```

## 安全注意事项

⚠️ **重要安全提醒**：
- 立即更改所有默认密码
- 配置适当的网络访问控制
- 启用HTTPS（生产环境）
- 定期备份数据和配置
- 监控访问日志和异常活动
- 确保Vault密钥的安全管理

## 生产环境考虑

对于生产部署，请考虑以下因素：
- 使用外部数据库和对象存储
- 配置高可用性和负载均衡
- 实施完整的监控和告警
- 配置备份和恢复策略
- 使用HTTPS和适当的证书管理
- 实施网络安全策略

## 本地化修改说明

与原始生产版本相比，本地化版本进行了以下修改：

1. **网络配置**: 使用localhost而非域名
2. **端口映射**: 直接映射到主机端口
3. **证书管理**: 简化TLS配置用于本地开发
4. **邮件服务**: 禁用邮件通知功能
5. **Slack集成**: 禁用Slack通知
6. **密钥管理**: 使用预定义的开发密钥
7. **数据库**: 使用内置PostgreSQL而非外部服务
8. **存储**: 使用内置MinIO而非云存储
9. **监控**: 简化监控配置

这些修改使Central Service可以在本地环境中独立运行，便于开发和测试。
