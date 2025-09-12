#!/bin/bash

echo "Starting PADME Central Service Deployment..."
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

# 切换到central service目录
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo

# 检查依赖服务是否运行
echo "Checking dependency services..."

# 检查proxynet网络
if ! docker network inspect proxynet &> /dev/null; then
    echo "Creating proxynet network..."
    docker network create proxynet
else
    echo "✓ proxynet network exists"
fi

# 检查vaultnet网络
if ! docker network inspect vaultnet &> /dev/null; then
    echo "Creating vaultnet network..."
    docker network create vaultnet
else
    echo "✓ vaultnet network exists"
fi

echo
echo "Checking PADME services status..."

# 检查Vault是否运行
if curl -f -s http://localhost:8215/v1/sys/health &> /dev/null; then
    echo "✓ Vault service is running"
else
    echo "⚠ Warning: Vault service not detected at localhost:8215"
    echo "  Please ensure Vault is running before using Central Service"
fi

# 检查Keycloak是否运行
if curl -f -s http://localhost:8090/ &> /dev/null; then
    echo "✓ Keycloak service is running"
else
    echo "⚠ Warning: Keycloak service not detected at localhost:8090"
    echo "  Please ensure Keycloak is running before using Central Service"
fi

# 检查Harbor是否运行
if curl -f -s http://localhost:8080/ &> /dev/null; then
    echo "✓ Harbor service is running"
else
    echo "⚠ Warning: Harbor service not detected at localhost:8080"
    echo "  Please ensure Harbor is running before using Central Service"
fi

echo
echo "Building Central Service Docker image..."
docker build -t padme-central-service:local .

if [ $? -ne 0 ]; then
    echo "Failed to build Central Service image"
    exit 1
fi

echo
echo "Starting Central Service and dependencies..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo
    echo "Central Service deployment completed successfully!"
    echo
    echo "Central Service is now running on:"
    echo "  - Web UI: http://localhost:3000"
    echo "  - API Endpoint: http://localhost:3000/api"
    echo
    echo "Dependency Services:"
    echo "  - PostgreSQL: localhost:5434"
    echo "  - MinIO: localhost:9000 (Console: localhost:9001)"
    echo "  - DinD: Internal container network"
    echo
    echo "Database credentials:"
    echo "  Username: postgres"
    echo "  Password: central_postgres_password_2024"
    echo "  Database: postgres"
    echo
    echo "MinIO credentials:"
    echo "  Username: centralservice"
    echo "  Password: minio_password_2024"
    echo
    echo "Integration with PADME services:"
    echo "  - Harbor: localhost:8080 (admin/Harbor12345)"
    echo "  - Keycloak: localhost:8090 (admin/admin_password_2024)"
    echo "  - Vault: localhost:8215"
    echo
    echo "IMPORTANT NEXT STEPS:"
    echo "1. Configure Keycloak clients (run setup-keycloak.sh)"
    echo "2. Configure Vault authentication"
    echo "3. Access Central Service at: http://localhost:3000"
    echo
    echo "To view logs: docker-compose logs -f"
    echo "To stop:     docker-compose down"
    echo
else
    echo
    echo "Deployment failed!"
    echo "Please check the error messages above."
    echo
    echo "Common issues:"
    echo "- Ensure all dependency services are running"
    echo "- Check if ports 3000, 5434, 9000, 9001 are available"
    echo "- Verify Docker has sufficient resources"
    echo
    exit 1
fi
