#!/bin/bash

echo "Starting PADME Harbor Container Registry Deployment..."
echo

# 检查Docker是否运行
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker and try again"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "Docker detected, proceeding with deployment..."
echo

# 切换到harbor目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 检查Harbor安装包
if [ ! -d "harbor" ]; then
    echo "Harbor installation package not found!"
    echo
    echo "Please run download-harbor.sh first to download Harbor"
    echo "Or manually download Harbor from: https://github.com/goharbor/harbor/releases"
    echo
    exit 1
fi

# 检查proxynet网络是否存在
if ! docker network inspect proxynet &> /dev/null; then
    echo "Creating proxynet network..."
    docker network create proxynet
else
    echo "proxynet network already exists"
fi

# 复制配置文件
echo "Copying Harbor configuration..."
cp harbor.yml harbor/harbor.yml

# 切换到harbor目录并运行安装
echo "Preparing Harbor installation..."
cd harbor
sudo ./prepare

if [ $? -ne 0 ]; then
    echo "Failed to prepare Harbor installation"
    exit 1
fi

echo "Starting Harbor services..."
sudo docker-compose up -d

if [ $? -eq 0 ]; then
    echo
    echo "Harbor deployment completed successfully!"
    echo
    echo "Harbor is now running on:"
    echo "  - Web UI: http://localhost:8080"
    echo "  - Registry: localhost:8080 (Docker registry)"
    echo
    echo "Default admin credentials:"
    echo "  Username: admin"
    echo "  Password: Harbor12345"
    echo
    echo "Database credentials:"
    echo "  PostgreSQL Password: root123"
    echo
    echo "IMPORTANT:"
    echo "1. Change the admin password after first login"
    echo "2. Wait 2-3 minutes for all services to fully start"
    echo "3. Access Harbor at: http://localhost:8080"
    echo
    echo "To view logs: docker-compose logs -f"
    echo "To stop:     docker-compose down"
    echo
else
    echo
    echo "Deployment failed!"
    echo "Please check the error messages above."
    echo
    exit 1
fi
