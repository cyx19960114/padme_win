# PADME 反向代理本地部署指南

这是一个完全本地化的NGINX反向代理部署方案，基于Docker容器技术。

## 系统要求

- Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
- 至少2GB可用内存
- 端口80和443需要空闲

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

1. **创建Docker网络**
```bash
docker network create proxynet
```

2. **构建并启动服务**
```bash
cd proxy
docker-compose up -d --build
```

## 配置说明

### 主要组件
- **reverse_proxy**: 基于nginx-proxy的反向代理服务器
- **reverse_proxy_certs**: Let's Encrypt证书管理器（用于HTTPS）

### 端口映射
- HTTP: localhost:80
- HTTPS: localhost:443

### 添加新的服务到代理

要将新的Docker服务添加到反向代理中，请在目标容器的配置中添加以下环境变量：

```yaml
environment:
  VIRTUAL_HOST: "example.localhost"
  LETSENCRYPT_HOST: "example.localhost"
networks:
  - proxynet
```

### 网络配置
所有需要通过代理访问的服务都必须连接到 `proxynet` 网络。

## 管理命令

### 查看日志
```bash
docker-compose logs -f
```

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 清理和重建
```bash
docker-compose down
docker-compose up -d --build
```

## 故障排除

### 常见问题

1. **端口80/443被占用**
   - 停止其他占用这些端口的服务（如IIS、Apache等）
   - 或修改docker-compose.yml中的端口映射

2. **Docker无法启动**
   - 确保Docker Desktop正在运行
   - 检查Docker是否有足够的资源分配

3. **网络连接问题**
   - 确保proxynet网络已创建
   - 检查目标服务是否正确连接到proxynet网络

### 查看容器状态
```bash
docker-compose ps
```

### 查看网络信息
```bash
docker network ls
docker network inspect proxynet
```

## 本地化修改

与原始版本相比，本地化版本进行了以下修改：

1. **移除CI/CD依赖**: 不再依赖GitLab CI/CD变量
2. **本地构建**: 直接从本地Dockerfile构建镜像
3. **简化网络**: 使用bridge驱动的本地网络
4. **默认邮箱**: 设置为admin@localhost
5. **自动化脚本**: 提供Windows和Linux的部署脚本

## 安全注意事项

- 本配置适用于本地开发和测试环境
- 生产环境请配置适当的SSL证书和安全设置
- 定期更新Docker镜像以获取安全补丁
