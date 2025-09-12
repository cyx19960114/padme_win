#!/bin/bash

echo "Starting PADME Keycloak Deployment..."
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

# 切换到keycloak目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 检查proxynet网络是否存在
if ! docker network inspect proxynet &> /dev/null; then
    echo "Creating proxynet network..."
    docker network create proxynet
else
    echo "proxynet network already exists"
fi

# 停止并删除现有容器（如果存在）
echo "Stopping existing containers..."
docker-compose down 2>/dev/null

# 构建并启动服务
echo "Building and starting Keycloak services..."
if docker-compose up -d --build; then
    echo
    echo "Keycloak deployment completed successfully!"
    echo
    echo "Keycloak is now running on:"
    echo "  - HTTP:  http://localhost:8090"
    echo "  - Admin Console: http://localhost:8090/auth/admin"
    echo
    echo "Default admin credentials:"
    echo "  Username: admin"
    echo "  Password: admin_password_2024"
    echo
    echo "Database (PostgreSQL):"
    echo "  Host: localhost:5433"
    echo "  Username: postgres"
    echo "  Password: keycloak_local_password_2024"
    echo
    echo "IMPORTANT: Wait 2-3 minutes for services to fully start"
    echo "Then access: http://localhost:8090/auth"
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
