#!/bin/bash

echo "Starting PADME Reverse Proxy Deployment..."
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

# 切换到proxy目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 创建proxynet网络（如果不存在）
echo "Creating proxynet network..."
if docker network create proxynet 2>/dev/null; then
    echo "Created proxynet network successfully"
else
    echo "proxynet network already exists or error occurred"
fi
echo

# 停止并删除现有容器（如果存在）
echo "Stopping existing containers..."
docker-compose down 2>/dev/null

# 构建并启动服务
echo "Building and starting reverse proxy services..."
if docker-compose up -d --build; then
    echo
    echo "Deployment completed successfully!"
    echo
    echo "The reverse proxy is now running on:"
    echo "  - HTTP:  http://localhost:80"
    echo "  - HTTPS: https://localhost:443"
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
