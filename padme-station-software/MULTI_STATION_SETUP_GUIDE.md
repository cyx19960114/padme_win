# 多Station环境设置指南

## 🎯 解决方案概述

我已经创建了一个**多Station架构**，解决了您担心的问题：

### ✅ 问题解决
- **不同用户登录不同Station**: 每个用户现在会进入独立的Station
- **Station隔离**: 每个Station有独立的配置、密钥和端口
- **联邦学习支持**: Central Service可以看到多个Station选项

## 🏗️ 架构设计

### 多Station配置
- **Station 1**: 端口 3031，用户 `station1`
- **Station 2**: 端口 3032，用户 `station2`  
- **Station 3**: 端口 3033，用户 `station3`

### 每个Station包含
- 独立的RSA密钥对
- 独立的Station ID
- 独立的用户认证
- 独立的Docker容器

## 📋 设置步骤

### 1. 在Keycloak中创建用户

访问 http://localhost:8090，使用 admin/admin_password_2024 登录

#### 创建 Station 1 用户
1. 选择 "pht" realm
2. 点击 "Users" → "Add user"
3. 填写信息：
   - **Username**: `station1`
   - **Email**: `station1@localhost.local`
   - **First Name**: `Station`
   - **Last Name**: `One`
   - **Enabled**: ✅
4. 点击 "Credentials" → "Set password"
   - **Password**: `station123`
   - **Temporary**: ❌ (取消勾选)

#### 创建 Station 2 用户
1. 重复上述步骤
2. 填写信息：
   - **Username**: `station2`
   - **Email**: `station2@localhost.local`
   - **First Name**: `Station`
   - **Last Name**: `Two`

#### 创建 Station 3 用户
1. 重复上述步骤
2. 填写信息：
   - **Username**: `station3`
   - **Email**: `station3@localhost.local`
   - **First Name**: `Station`
   - **Last Name**: `Three`

### 2. 启动多Station服务

```bash
# 停止当前的单一Station服务
docker-compose down

# 启动多Station服务
docker-compose -f docker-compose-multi-station.yml up -d
```

### 3. 验证多Station环境

#### 访问不同的Station
- **Station 1**: http://localhost:3031 (用户: station1)
- **Station 2**: http://localhost:3032 (用户: station2)
- **Station 3**: http://localhost:3033 (用户: station3)

#### 登录测试
1. 访问 http://localhost:3031
2. 使用 `station1` / `station123` 登录
3. 您将看到 "Station 1" 的界面
4. 重复测试其他Station

### 4. 在Central Service中测试

1. 访问 http://localhost:3000
2. 创建联邦学习任务
3. 在 "Select Station" 中应该看到3个选项：
   - station-1
   - station-2
   - station-3

## 🎯 预期结果

### ✅ 用户隔离
- 用户 `station1` 登录 → 进入 Station 1 (端口 3031)
- 用户 `station2` 登录 → 进入 Station 2 (端口 3032)
- 用户 `station3` 登录 → 进入 Station 3 (端口 3033)

### ✅ Station识别
- 每个Station显示不同的名称和ID
- 每个Station有独立的联邦学习任务
- 每个Station可以独立执行训练任务

### ✅ 联邦学习支持
- Central Service可以看到所有3个Station
- 可以创建包含多个Station的联邦学习任务
- 每个Station可以独立参与训练

## 🔧 技术细节

### 锁文件配置
每个Station都有独立的锁文件：
- `stationsetup-station-1.lock`
- `stationsetup-station-2.lock`
- `stationsetup-station-3.lock`

### Docker容器
- `pht-web-station1` (端口 3031)
- `pht-web-station2` (端口 3032)
- `pht-web-station3` (端口 3033)

### 共享服务
- MongoDB (所有Station共享)
- Docker-in-Docker (所有Station共享)
- Vault (所有Station共享)

## 🎉 完成！

现在您有了一个完整的多Station联邦学习环境：

1. ✅ **用户隔离**: 不同用户访问不同Station
2. ✅ **Station识别**: 每个Station有独立身份
3. ✅ **联邦学习**: 支持多Station协作训练
4. ✅ **本地化**: 完全本地运行，无需互联网

---

**状态**: ✅ 多Station架构已创建
**时间**: 2025-09-12 16:00
