#!/bin/bash

echo "Starting PADME Vault Deployment..."
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

# 切换到vault目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 停止并删除现有容器（如果存在）
echo "Stopping existing containers..."
docker-compose down 2>/dev/null

# 构建并启动服务
echo "Building and starting Vault service..."
if docker-compose up -d --build; then
    echo
    echo "Vault deployment completed successfully!"
    echo
    echo "Vault is now running on:"
    echo "  - HTTPS: https://localhost:8215"
    echo
    echo "IMPORTANT: You need to initialize and unseal Vault manually."
    echo "Use the setup guide: LOCAL_SETUP_GUIDE.md"
    echo
    echo "Quick setup commands:"
    echo "  docker exec -it vault-vault-1 /bin/ash"
    echo "  vault operator init -tls-skip-verify -key-shares=1 -key-threshold=1"
    echo "  vault operator unseal -tls-skip-verify"
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
