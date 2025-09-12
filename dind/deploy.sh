#!/bin/bash

echo "Starting PADME Docker-in-Docker (DinD) Deployment..."
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

# 切换到dind目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 停止并删除现有容器（如果存在）
echo "Stopping existing containers..."
docker-compose down 2>/dev/null

# 构建并启动服务
echo "Building and starting Docker-in-Docker service..."
if docker-compose up -d --build; then
    echo
    echo "DinD deployment completed successfully!"
    echo
    echo "Docker-in-Docker is now running on:"
    echo "  - Secure API:   https://localhost:2376"
    echo "  - Insecure API: http://localhost:2375"
    echo
    echo "Features:"
    echo "  - DNS resolution fix for containers"
    echo "  - Daily Docker cleanup (7-day retention)"
    echo "  - Custom bridge network (172.31.0.1/24)"
    echo "  - Embedded dnsmasq for DNS forwarding"
    echo
    echo "IMPORTANT: Wait 30-60 seconds for service to fully start"
    echo
    echo "To connect from host:"
    echo "  export DOCKER_HOST=tcp://localhost:2376"
    echo "  export DOCKER_TLS_VERIFY=1"
    echo "  export DOCKER_CERT_PATH=./certs/client"
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
