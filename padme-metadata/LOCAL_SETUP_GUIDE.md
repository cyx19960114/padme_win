# 📖 PADME Metadata Service 本地设置指南

## 📋 概述

PADME Metadata Service是PADME联邦学习生态系统的元数据基础设施，负责收集、存储和提供关于训练执行的语义化信息。

## 🎯 功能特性

- **元数据收集**: 自动收集训练执行的状态和指标
- **语义化存储**: 使用RDF三元组存储结构化元数据
- **RESTful API**: 提供HTTP接口进行元数据管理
- **数据过滤**: 支持用户配置的数据过滤规则
- **状态跟踪**: 实时跟踪联邦学习训练的各个阶段

## 🔧 系统要求

### 必需环境
- Docker Desktop
- Docker Compose
- 8GB+ 可用内存
- 2GB+ 可用磁盘空间

### 依赖服务
- PostgreSQL 14.5 (图数据库)
- PostgreSQL 14.5 (管理数据库)

## 🚀 快速开始

### 方法1: 使用部署脚本 (推荐)

**Windows:**
```cmd
cd padme-metadata
deploy.bat
```

**Linux/Mac:**
```bash
cd padme-metadata
./deploy.sh
```

### 方法2: 手动部署

```bash
cd padme-metadata

# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 检查状态
docker-compose ps
```

## 📁 项目结构

```
padme-metadata/
├── docker-compose.yml      # Docker编排配置
├── Dockerfile             # 容器构建文件
├── local.env              # 本地环境变量
├── deploy.bat/sh          # 部署脚本
├── manage.bat             # 管理脚本
├── bin/                   # 可执行文件
│   ├── metadataprovider   # 元数据提供者
│   └── metadatastore      # 元数据存储
├── metadataInfrastructure/ # 核心代码
└── Schema/                # 元数据架构
```

## ⚙️ 配置说明

### 环境变量 (local.env)

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| METADATA_STORE_GRAPHDB_PASSWORD | metadata_graph_password_2024 | 图数据库密码 |
| METADATA_STORE_MANAGEMENTDB_PASSWORD | metadata_mgmt_password_2024 | 管理数据库密码 |
| METADATA_STORE_REGISTRY_KEY | metadata_registry_key_2024 | API访问密钥 |
| MSTORE_HOST | http://localhost:3001 | 服务主机地址 |
| MSTORE_PORT | 9988 | 内部服务端口 |

### 端口映射

| 服务 | 内部端口 | 外部端口 | 用途 |
|------|----------|----------|------|
| Metadata Provider | 9988 | 3001 | HTTP API |
| Graph Database | 5432 | 5435 | PostgreSQL连接 |
| Management Database | 5432 | 5436 | PostgreSQL连接 |

## 🔗 API接口

### 配置管理

**获取服务配置**
```http
GET http://localhost:3001/configuration/general
```

**响应示例**
```json
{
  "stationIdentifier": "None",
  "ready": false
}
```

**设置站点标识符**
```http
POST http://localhost:3001/configuration/general
Content-Type: application/json

{
  "stationIdentifier": "station-001"
}
```

### 执行状态追踪

**记录训练开始**
```http
POST http://localhost:3001/remote/execution/state/{execution_id}/startedRunning
```

**记录训练完成**
```http
POST http://localhost:3001/remote/execution/state/{execution_id}/finished
```

### 指标收集

**提交执行指标**
```http
POST http://localhost:3001/remote/execution/metric
Content-Type: application/json

{
  "execution_id": "exec-123",
  "metrics": {...}
}
```

## 🛠️ 管理命令

### 使用管理脚本

**Windows (manage.bat):**
```cmd
manage.bat start      # 启动服务
manage.bat stop       # 停止服务
manage.bat restart    # 重启服务
manage.bat status     # 查看状态
manage.bat logs       # 查看日志
manage.bat clean      # 清理数据
```

### 手动管理

**启动服务**
```bash
docker-compose up -d
```

**停止服务**
```bash
docker-compose down
```

**查看日志**
```bash
docker-compose logs -f metadata_store
```

**重启特定服务**
```bash
docker-compose restart metadata_store
```

## 🔍 故障排除

### 常见问题

**Q: 服务无法启动**
A: 检查Docker是否运行，端口是否被占用
```bash
docker-compose ps
netstat -an | findstr :3001
```

**Q: API返回404错误**
A: 确认端点路径正确，服务完全启动
```bash
docker-compose logs metadata_store
```

**Q: 数据库连接失败**
A: 检查数据库容器状态和密码配置
```bash
docker-compose logs graphdatabase
docker-compose logs managementdatabase
```

### 重置环境

**完全重置 (⚠️ 将删除所有数据)**
```bash
docker-compose down -v
docker rmi padme-metadata:local
docker-compose up -d --build
```

## 📊 监控和维护

### 健康检查

**服务状态检查**
```bash
curl http://localhost:3001/configuration/general
```

**数据库连接检查**
```bash
docker exec padme-metadata-graphdatabase-1 pg_isready -U postgres
docker exec padme-metadata-managementdatabase-1 pg_isready -U postgres
```

### 数据备份

**备份数据库**
```bash
# Graph数据库
docker exec padme-metadata-graphdatabase-1 pg_dump -U postgres postgres > graph_backup.sql

# Management数据库
docker exec padme-metadata-managementdatabase-1 pg_dump -U postgres postgres > mgmt_backup.sql
```

**恢复数据库**
```bash
# 恢复Graph数据库
docker exec -i padme-metadata-graphdatabase-1 psql -U postgres postgres < graph_backup.sql

# 恢复Management数据库
docker exec -i padme-metadata-managementdatabase-1 psql -U postgres postgres < mgmt_backup.sql
```

## 🔗 集成指南

### 与Central Service集成

在Central Service中配置元数据服务：
```javascript
const metadataConfig = {
  endpoint: 'http://localhost:3001',
  registryKey: 'metadata_registry_key_2024'
};
```

### 与Station Software集成

在Station Software中配置元数据上报：
```python
metadata_provider_url = "http://localhost:3001"
registry_key = "metadata_registry_key_2024"
```

## 🎯 最佳实践

### 安全配置
- 修改默认密码
- 使用HTTPS (生产环境)
- 限制网络访问

### 性能优化
- 监控数据库大小
- 定期清理旧数据
- 配置适当的缓存

### 数据管理
- 定期备份数据库
- 监控磁盘使用
- 配置日志轮转

## 📞 技术支持

### 日志分析
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs metadata_store

# 实时跟踪日志
docker-compose logs -f
```

### 配置验证
```bash
# 检查配置文件
cat docker-compose.yml
cat local.env

# 验证网络连接
docker network ls
docker network inspect padme-metadata_metadatanet
```

## 🎉 完成！

恭喜！你已经成功设置了PADME Metadata Service。现在你可以：

1. **收集元数据**: 开始收集训练执行的元数据
2. **API集成**: 将其他服务集成到元数据系统
3. **监控跟踪**: 实时跟踪联邦学习工作流
4. **数据分析**: 使用收集的元数据进行分析

**下一步**: 配置其他PADME服务以使用此元数据基础设施！
