#!/bin/bash

echo "Downloading Harbor Container Registry..."
echo

# 检查是否已存在Harbor目录
if [ -d "harbor" ]; then
    echo "Harbor directory already exists."
    read -p "Do you want to re-download? (y/n): " overwrite
    if [[ $overwrite != [yY] ]]; then
        echo "Skipping download."
        exit 0
    fi
    echo "Removing existing Harbor directory..."
    rm -rf harbor
fi

# Harbor版本配置
HARBOR_VERSION="v2.8.4"
HARBOR_PACKAGE="harbor-offline-installer-${HARBOR_VERSION}.tgz"

echo "Downloading Harbor ${HARBOR_VERSION}..."
echo "Package: ${HARBOR_PACKAGE}"
echo

# 检查curl是否可用
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not available"
    echo "Please download Harbor manually from:"
    echo "https://github.com/goharbor/harbor/releases/download/${HARBOR_VERSION}/${HARBOR_PACKAGE}"
    echo
    echo "Then extract it to the current directory."
    exit 1
fi

# 下载Harbor
echo "Downloading from GitHub..."
curl -L -o "${HARBOR_PACKAGE}" "https://github.com/goharbor/harbor/releases/download/${HARBOR_VERSION}/${HARBOR_PACKAGE}"

if [ $? -ne 0 ]; then
    echo "Failed to download Harbor package"
    echo "Please check your internet connection and try again"
    echo "Or download manually from: https://github.com/goharbor/harbor/releases"
    exit 1
fi

echo "Download completed: ${HARBOR_PACKAGE}"
echo

# 检查tar是否可用
if ! command -v tar &> /dev/null; then
    echo "Error: tar is not available"
    echo "Please extract ${HARBOR_PACKAGE} manually"
    echo "The harbor folder should contain the Harbor installation files"
    exit 1
fi

# 解压Harbor包
echo "Extracting Harbor package..."
tar -zxf "${HARBOR_PACKAGE}"

if [ $? -ne 0 ]; then
    echo "Failed to extract Harbor package"
    echo "Please extract ${HARBOR_PACKAGE} manually"
    exit 1
fi

# 清理下载的压缩包
echo "Cleaning up..."
rm "${HARBOR_PACKAGE}"

echo
echo "Harbor download and extraction completed successfully!"
echo

# 检查是否成功解压
if [ -d "harbor" ]; then
    echo "Harbor directory created successfully"
    ls -la harbor/
else
    echo "Warning: Harbor directory not found after extraction"
    echo "Please check if the extraction was successful"
    exit 1
fi

echo
echo "Next steps:"
echo "1. Run deploy.sh to start Harbor installation"
echo "2. Or manually configure harbor.yml and run prepare + docker-compose up"
echo
