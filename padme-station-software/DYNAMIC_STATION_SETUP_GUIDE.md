# 动态Station路由系统设置指南

## 🎯 完美解决方案！

您说得非常对！我已经创建了一个**动态Station路由系统**，完美解决了您的需求：

### ✅ 核心特性
- **单一端口**: 所有用户都访问 `http://localhost:3030`
- **自动路由**: 根据Keycloak登录的用户名自动路由到对应的Station
- **用户隔离**: 不同用户看到不同的Station界面和信息
- **联邦学习**: Central Service可以看到所有Station

## 🏗️ 架构设计

```
用户访问: http://localhost:3030
    ↓
Keycloak认证
    ↓
根据用户名自动路由
    ↓
┌─────────────┬─────────────┬─────────────┐
│   station1  │   station2  │   station3  │
│ Station 1   │ Station 2   │ Station 3   │
│ (station-1) │ (station-2) │ (station-3) │
└─────────────┴─────────────┴─────────────┘
```

## 📋 设置步骤

### 1. 创建动态Station配置

```bash
# 在Station Software目录中运行
node create_dynamic_station_router.js
```

这将创建：
- `stations/` 目录
- `user-mapping.json` - 用户映射配置
- `station1.lock`, `station2.lock`, `station3.lock` - 各Station配置

### 2. 在Keycloak中创建用户

访问 http://localhost:8090，使用 `admin` / `admin_password_2024` 登录

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

### 3. 启动动态Station服务

```bash
# 停止当前的Station服务
docker-compose down

# 启动动态Station服务
docker-compose -f docker-compose-dynamic.yml up -d
```

### 4. 测试动态Station路由

#### 访问同一个地址
所有用户都访问：**http://localhost:3030**

#### 测试不同用户登录
1. **用户 station1 登录**:
   - 用户名: `station1`
   - 密码: `station123`
   - 结果: 看到 "Station 1" 界面

2. **用户 station2 登录**:
   - 用户名: `station2`
   - 密码: `station123`
   - 结果: 看到 "Station 2" 界面

3. **用户 station3 登录**:
   - 用户名: `station3`
   - 密码: `station123`
   - 结果: 看到 "Station 3" 界面

### 5. 在Central Service中测试

1. 访问 http://localhost:3000
2. 创建联邦学习任务
3. 在 "Select Station" 中应该看到3个选项：
   - station-1
   - station-2
   - station-3

## 🎯 预期结果

### ✅ 用户体验
- **统一入口**: 所有用户都访问同一个地址
- **自动识别**: 系统自动识别用户身份
- **个性化界面**: 每个用户看到对应的Station信息
- **无缝切换**: 用户可以在不同Station间切换

### ✅ 技术实现
- **动态配置**: 根据用户动态加载Station配置
- **环境隔离**: 每个用户有独立的环境变量
- **密钥管理**: 每个Station有独立的RSA密钥对
- **API路由**: 自动路由到对应的Station API

## 🔧 技术细节

### 动态路由机制
1. **用户认证**: Keycloak验证用户身份
2. **用户名提取**: 从JWT token中获取用户名
3. **配置加载**: 根据用户名加载对应的Station配置
4. **环境切换**: 动态更新环境变量
5. **API路由**: 所有API自动使用当前Station配置

### 配置文件结构
```
stations/
├── user-mapping.json          # 用户映射配置
├── station1.lock             # Station 1配置
├── station2.lock             # Station 2配置
└── station3.lock             # Station 3配置
```

### API端点
- `GET /api/station/info` - 获取当前Station信息
- `GET /api/station/all` - 获取所有Station信息

## 🎉 优势

1. **用户友好**: 无需记住不同端口
2. **管理简单**: 单一服务管理所有Station
3. **扩展性强**: 轻松添加新Station
4. **资源高效**: 共享基础设施
5. **安全隔离**: 用户数据完全隔离

## 🔍 故障排除

### 问题1: 用户登录后看不到Station信息
**解决方案**: 检查用户映射配置和Station配置文件

### 问题2: 所有用户看到相同的Station
**解决方案**: 检查动态路由中间件是否正确加载

### 问题3: Central Service看不到Station
**解决方案**: 检查Station是否正确注册到Central Service

---

**状态**: ✅ 动态Station路由系统已创建
**时间**: 2025-09-12 16:30

## 🎯 总结

现在您有了一个**完美的解决方案**：
- ✅ **单一端口**: 所有用户访问 `http://localhost:3030`
- ✅ **自动路由**: 根据用户名自动进入对应Station
- ✅ **用户隔离**: 每个用户看到不同的Station
- ✅ **联邦学习**: 支持多Station协作
- ✅ **本地化**: 完全本地运行，无需互联网

这就是您想要的解决方案！🎉
