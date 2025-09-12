# PADME Docker-in-Docker (DinD) 本地部署指南

这是一个完全本地化的Docker-in-Docker部署方案，专为PADME生态系统设计，解决了容器内DNS解析问题。

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少4GB可用内存
- 端口2375和2376需要空闲
- 管理员/sudo权限（用于privileged模式）

## 什么是Docker-in-Docker (DinD)？

DinD允许在Docker容器内运行Docker守护进程，这对以下场景非常有用：
- CI/CD流水线中构建Docker镜像
- 容器化的开发环境
- 微服务架构中的动态容器管理
- PADME训练任务的隔离执行

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
cd dind
docker-compose up -d --build
```

## 访问和使用

### API端点
- **安全连接**: https://localhost:2376 (推荐)
- **非安全连接**: http://localhost:2375 (仅开发环境)

### 从宿主机连接到DinD

#### 方法1：环境变量（推荐）
```bash
# Windows (PowerShell)
$env:DOCKER_HOST="tcp://localhost:2376"
$env:DOCKER_TLS_VERIFY="1"
$env:DOCKER_CERT_PATH="./certs/client"

# Linux/Mac
export DOCKER_HOST=tcp://localhost:2376
export DOCKER_TLS_VERIFY=1
export DOCKER_CERT_PATH=./certs/client
```

#### 方法2：Docker CLI参数
```bash
docker -H tcp://localhost:2376 --tlsverify --tlscert=./certs/client/cert.pem --tlskey=./certs/client/key.pem --tlscacert=./certs/client/ca.pem ps
```

#### 方法3：非安全连接（仅开发）
```bash
docker -H tcp://localhost:2375 ps
```

### 测试连接
```bash
# 设置环境变量后
docker info
docker ps
```

## 特殊功能

### 1. DNS解析修复
本DinD镜像解决了标准docker:dind镜像的DNS解析问题：
- 内置dnsmasq服务器(172.31.0.1)
- 自动DNS转发到宿主机
- 容器间名称解析正常工作

### 2. 自动清理
- 每日自动清理7天前的数据
- 清理未使用的镜像、容器、网络、卷
- 保持DinD环境整洁

### 3. 自定义网络配置
- 默认桥接网络：172.31.0.1/24
- 地址池：172.16.0.0/12
- 避免与宿主机网络冲突

## 使用示例

### 在DinD中运行容器
```bash
# 设置连接到DinD
export DOCKER_HOST=tcp://localhost:2376

# 运行测试容器
docker run --rm hello-world

# 运行带网络的容器
docker run -d --name nginx -p 8080:80 nginx

# 构建镜像
docker build -t myapp .

# 运行compose项目
docker-compose up -d
```

### 网络测试
```bash
# 测试DNS解析
docker run --rm alpine nslookup google.com

# 测试容器间通信
docker network create testnet
docker run -d --network testnet --name app1 nginx
docker run --rm --network testnet alpine ping app1
```

## 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看DinD日志
docker-compose logs -f dind

# 查看特定时间段日志
docker-compose logs --since 10m dind
```

### 重启服务
```bash
docker-compose restart
```

### 停止服务
```bash
docker-compose down
```

### 完全清理（包括数据）
```bash
docker-compose down -v
```

### 进入DinD容器
```bash
docker-compose exec dind sh
```

## 高级配置

### 自定义守护进程配置
修改 `Dind/deamon.json` 文件：
```json
{
  "bip": "172.31.0.1/24",
  "default-address-pools":[
    {"base":"172.16.0.0/12","size":24}
  ],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 自定义清理策略
修改 `Dind/docker-prune` 脚本：
```bash
#!/bin/sh
# 保留3天的数据
docker system prune -af --filter "until=$((3*24))h"
```

### 添加自定义DNS
修改 `Dind/entrypoint.sh`：
```bash
#!/bin/ash
dnsmasq
echo "nameserver 172.31.0.1" >> /etc/resolv.conf
echo "nameserver 8.8.8.8" >> /etc/resolv.conf  # 添加Google DNS作为备用
dockerd-entrypoint.sh "$@"
```

## 与PADME服务集成

### 训练任务执行
```yaml
# 在其他PADME服务中使用DinD
services:
  trainer:
    image: padme-trainer
    environment:
      DOCKER_HOST: "tcp://dind:2376"
      DOCKER_TLS_VERIFY: "1"
      DOCKER_CERT_PATH: "/certs"
    volumes:
      - dind-certs-client:/certs:ro
    networks:
      - dindnet
```

### CI/CD集成
```yaml
# GitLab CI示例
build:
  image: docker:latest
  services:
    - name: your-dind-image
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2376
    DOCKER_TLS_VERIFY: "1"
    DOCKER_CERT_PATH: "/certs"
  script:
    - docker build -t myapp .
    - docker push myapp
```

## 故障排除

### 1. 容器无法启动
```bash
# 检查privileged权限
docker-compose logs dind

# 确认端口未被占用
netstat -ano | findstr :2376
netstat -ano | findstr :2375
```

### 2. 连接被拒绝
```bash
# 检查证书配置
docker-compose exec dind ls -la /certs/client/

# 验证TLS连接
openssl s_client -connect localhost:2376
```

### 3. DNS解析失败
```bash
# 检查dnsmasq状态
docker-compose exec dind ps aux | grep dnsmasq

# 测试DNS解析
docker-compose exec dind nslookup google.com
```

### 4. 性能问题
```bash
# 检查资源使用
docker stats

# 清理DinD环境
docker -H tcp://localhost:2376 system prune -af
```

## 安全注意事项

⚠️ **重要安全提醒**：
- DinD需要privileged模式运行，具有高权限
- 仅在受信任的环境中使用
- 生产环境请：
  - 启用TLS验证
  - 限制网络访问
  - 定期更新镜像
  - 监控容器活动

## 性能优化

### 1. 存储优化
```yaml
# 使用SSD存储
volumes:
  dind_data:
    driver_opts:
      type: tmpfs
      device: tmpfs
```

### 2. 内存优化
```yaml
# 限制内存使用
services:
  dind:
    mem_limit: 4g
    mem_reservation: 2g
```

### 3. 网络优化
```yaml
# 使用host网络（生产环境慎用）
services:
  dind:
    network_mode: host
```

## 本地化修改说明

与原始DinD镜像相比，本地化版本进行了以下修改：

1. **简化部署**: 提供docker-compose配置
2. **端口映射**: 直接访问2375/2376端口
3. **卷管理**: 持久化证书和数据
4. **健康检查**: 自动监控服务状态
5. **网络配置**: 自定义网络设置
6. **自动化脚本**: 一键部署和管理
