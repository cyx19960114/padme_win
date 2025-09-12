#!/bin/bash

echo "================================"
echo "PADME Metadata Service 本地部署"
echo "================================"
echo

echo "1. 检查Docker是否运行..."
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "错误: Docker未运行，请先启动Docker"
    exit 1
fi

echo "✓ Docker正在运行"
echo

echo "2. 检查proxynet网络..."
if ! docker network inspect proxynet &> /dev/null; then
    echo "创建proxynet网络..."
    docker network create proxynet
else
    echo "✓ proxynet网络已存在"
fi
echo

echo "3. 构建Metadata Service镜像..."
docker-compose build
echo

echo "4. 启动服务..."
docker-compose up -d
echo

echo "5. 等待服务启动..."
sleep 30
echo

echo "6. 检查服务状态..."
docker-compose ps
echo

echo "================================"
echo "部署完成！"
echo "================================"
echo
echo "访问信息:"
echo "- Metadata Service: http://localhost:3001"
echo "- GraphDB PostgreSQL: localhost:5435 (postgres/metadata_graph_password_2024)"
echo "- Management PostgreSQL: localhost:5436 (postgres/metadata_mgmt_password_2024)"
echo
echo "日志查看: docker-compose logs"
echo "停止服务: docker-compose down"
echo
