# PADME 反向代理使用示例

## 部署成功验证

你的PADME反向代理已经成功部署！以下是一些验证和使用示例。

## 快速验证

### 1. 检查服务状态
```bash
docker-compose ps
```

应该看到两个服务都在运行：
- `proxy-reverse_proxy-1` (端口 80/443)
- `proxy-reverse_proxy_certs-1` (证书管理)

### 2. 测试基本连接
在浏览器中访问：
- HTTP: http://localhost
- HTTPS: https://localhost (可能显示证书警告，这是正常的)

## 添加后端服务示例

假设你要添加一个Web应用到反向代理中：

### 1. 创建示例Web应用

创建一个简单的Docker服务 `docker-compose.example.yml`：

```yaml
version: '3.5'
services:
  web-app:
    image: nginx:alpine
    environment:
      - VIRTUAL_HOST=app.localhost
      - LETSENCRYPT_HOST=app.localhost
    volumes:
      - ./html:/usr/share/nginx/html
    networks:
      - proxynet

networks:
  proxynet:
    external: true
```

### 2. 创建示例HTML内容

创建 `html/index.html`：
```html
<!DOCTYPE html>
<html>
<head>
    <title>PADME Example App</title>
</head>
<body>
    <h1>欢迎使用PADME反向代理!</h1>
    <p>这是一个通过反向代理访问的示例应用</p>
    <p>访问地址: http://app.localhost</p>
</body>
</html>
```

### 3. 启动示例应用
```bash
docker-compose -f docker-compose.example.yml up -d
```

### 4. 配置本地DNS (可选)

在 `C:\Windows\System32\drivers\etc\hosts` 文件中添加：
```
127.0.0.1 app.localhost
```

然后访问 http://app.localhost

## 管理命令

### 使用管理脚本 (Windows)
```cmd
manage.bat
```

### 手动管理命令

#### 查看日志
```bash
# 查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f reverse_proxy
docker-compose logs -f reverse_proxy_certs
```

#### 重启服务
```bash
docker-compose restart
```

#### 停止服务
```bash
docker-compose down
```

#### 完全重建
```bash
docker-compose down
docker-compose up -d --build
```

## 高级配置

### 自定义NGINX配置

如果需要自定义NGINX配置，可以在 `ReverseProxy/` 目录下添加 `.conf` 文件，然后重建镜像。

### SSL证书管理

反向代理会自动为配置了 `LETSENCRYPT_HOST` 的服务申请SSL证书。对于本地开发，你可能会看到自签名证书警告。

### 网络隔离

所有需要通过代理访问的服务都必须连接到 `proxynet` 网络：

```yaml
networks:
  - proxynet
```

## 故障排除

### 1. 端口冲突
如果端口80或443被占用：
```bash
# 查看端口占用
netstat -ano | findstr :80
netstat -ano | findstr :443

# 修改docker-compose.yml中的端口映射
ports:
  - "8080:80"    # 改为8080端口
  - "8443:443"   # 改为8443端口
```

### 2. 容器无法启动
```bash
# 查看详细错误信息
docker-compose logs

# 检查Docker资源
docker system df
docker system prune  # 清理未使用的资源
```

### 3. 服务无法访问
```bash
# 检查网络连接
docker network ls
docker network inspect proxynet

# 确保服务在同一网络中
docker-compose ps
```

## 生产环境注意事项

本配置适用于本地开发和测试。在生产环境中，请考虑：

1. **安全配置**: 更新默认邮箱地址
2. **SSL证书**: 配置真实的域名和证书
3. **性能调优**: 根据负载调整nginx配置
4. **监控**: 添加日志收集和监控
5. **备份**: 定期备份证书和配置

## 支持的环境变量

### 反向代理服务
- `VIRTUAL_HOST`: 域名列表（逗号分隔）
- `VIRTUAL_PORT`: 后端服务端口（默认80）
- `VIRTUAL_PATH`: URL路径前缀
- `LETSENCRYPT_HOST`: SSL证书域名

### 证书管理服务
- `DEFAULT_EMAIL`: Let's Encrypt注册邮箱
- `ACME_CA_URI`: ACME服务器URI（默认为Let's Encrypt）
