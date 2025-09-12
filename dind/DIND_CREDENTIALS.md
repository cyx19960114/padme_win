# PADME Docker-in-Docker 服务信息

## 🔧 服务配置

### 端口信息
- **Docker API (TLS)**: localhost:2376
- **Docker API (非TLS)**: localhost:2375
- **DNS服务**: 172.31.0.1:53 (容器内)

### 网络配置
- **容器网络**: dindnet (bridge)
- **默认桥接网络**: 172.31.0.1/24
- **地址池**: 172.16.0.0/12

### 卷挂载
- **证书**: dind-certs
- **客户端证书**: dind-certs-client
- **Docker数据**: dind-data

## 🔑 访问方法

### 方法1: 容器内操作 (推荐)
```bash
# 进入DinD容器
docker-compose exec dind sh

# 在容器内使用Docker
# (注意: 需要正确配置DOCKER_HOST)
```

### 方法2: 网络API访问 (需要配置)
```bash
# TLS连接 (需要证书)
docker -H tcp://localhost:2376 --tls info

# 非TLS连接 (需要配置守护进程)
docker -H tcp://localhost:2375 info
```

### 方法3: 环境变量配置
```bash
# PowerShell
$env:DOCKER_HOST="tcp://localhost:2376"

# Bash
export DOCKER_HOST=tcp://localhost:2376
```

## 🛠️ 常用命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f dind
```

### 容器操作
```bash
# 进入容器
docker-compose exec dind sh

# 查看进程
docker-compose exec dind ps aux

# 查看网络
docker-compose exec dind netstat -ln

# 测试DNS
docker-compose exec dind nslookup google.com
```

### 维护操作
```bash
# 手动清理 (在容器内)
docker system prune -af

# 查看磁盘使用
docker system df

# 查看容器统计
docker stats dind-dind-1
```

## 🔍 故障排除

### 检查服务状态
```bash
# 容器是否运行
docker-compose ps

# 健康检查状态
docker-compose exec dind docker version

# 进程检查
docker-compose exec dind ps aux | grep -E "(dockerd|dnsmasq)"
```

### 网络连通性
```bash
# 端口测试
telnet localhost 2375
telnet localhost 2376

# 容器内网络
docker-compose exec dind ping 172.31.0.1
```

### 日志分析
```bash
# 查看启动日志
docker-compose logs dind | head -50

# 查看错误日志
docker-compose logs dind | grep -i error

# 实时监控
docker-compose logs -f dind
```

## 📋 配置文件位置

### 主要配置
- **Docker Compose**: `/docker-compose.yml`
- **Dockerfile**: `/Dind/Dockerfile`
- **启动脚本**: `/Dind/entrypoint.sh`
- **守护进程配置**: `/Dind/deamon.json`
- **清理脚本**: `/Dind/docker-prune`

### 运行时配置
- **Docker数据**: Docker卷 `dind-data`
- **证书存储**: Docker卷 `dind-certs`
- **容器日志**: `docker-compose logs dind`

## 🔐 安全注意事项

### Privileged模式
- DinD需要privileged权限运行
- 仅在受信任环境中使用
- 避免在生产环境直接暴露API

### 网络安全
- API端口仅绑定到localhost
- 考虑使用TLS加密
- 限制容器间网络访问

### 数据安全
- 定期备份重要数据
- 清理策略配置合理的保留期
- 监控磁盘空间使用

## 🚀 使用示例

### 在DinD中运行容器
```bash
# 进入DinD环境
docker-compose exec dind sh

# 运行测试容器
docker run --rm hello-world

# 运行后台服务
docker run -d --name nginx -p 8080:80 nginx

# 构建镜像
docker build -t myapp .
```

### 网络测试
```bash
# 创建自定义网络
docker network create testnet

# 测试容器通信
docker run -d --network testnet --name app1 nginx
docker run --rm --network testnet alpine ping app1
```

---

**提醒**: 当前配置为开发环境优化，生产使用请加强安全配置。
