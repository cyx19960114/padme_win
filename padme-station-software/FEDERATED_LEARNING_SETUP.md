# PADME 联邦学习设置指南

## 🎯 联邦学习架构

### 服务组件
- **Central Service** (localhost:3000) - 联邦学习协调器
- **Station Software** (localhost:3030) - 边缘计算节点
- **Keycloak** (localhost:8090) - 身份认证服务
- **Harbor** (localhost:8080) - 容器镜像仓库

## ✅ 已完成的配置

### 1. Central Service连接修复
- ✅ 修复了Station Software的Central Service地址配置
- ✅ 从 `localhost:8091` 更新为 `localhost:3000`
- ✅ 修复了HTTPS/HTTP协议问题

### 2. 服务状态验证
- ✅ Central Service: 运行在端口 3000
- ✅ Station Software: 运行在端口 3030
- ✅ Keycloak: 运行在端口 8090
- ✅ Harbor: 运行在端口 8080

## 🔧 联邦学习工作流程

### 1. 创建联邦学习任务
1. 访问 **Central Service**: http://localhost:3000
2. 使用Keycloak账号登录
3. 点击 "Federated Learning" 下拉菜单
4. 选择 "Create Federated Learning Request"
5. 填写任务配置：
   - **Select Project**: 选择项目
   - **Select Learning Image**: 选择学习镜像
   - **Select Aggregation Image**: 选择聚合镜像
   - **Number of Training Rounds**: 训练轮数
   - **Select Station**: 选择参与的Station

### 2. 可用的Station
根据Central Service代码，当前有以下临时Station可用：
- **aachenbeeck** - 测试Station 1
- **aachenmenzel** - 测试Station 2

### 3. Station执行任务
1. 访问 **Station Software**: http://localhost:3030
2. 使用Station账号登录
3. 查看待执行的联邦学习任务
4. 执行训练任务
5. 上传结果到Central Service

## 🔍 故障排除

### 问题1: "Select Station" 显示 "No options"
**原因**: Station未正确注册到Central Service
**解决方案**: 
1. 确认Central Service正在运行
2. 检查Station Software的Central Service配置
3. 重启Station Software服务

### 问题2: Station无法连接到Central Service
**原因**: 网络配置或认证问题
**解决方案**:
1. 检查防火墙设置
2. 确认Keycloak认证配置
3. 验证服务间的网络连接

### 问题3: 联邦学习任务创建失败
**原因**: 缺少必要的镜像或配置
**解决方案**:
1. 确认Harbor中有相应的镜像
2. 检查项目配置
3. 验证Station状态

## 📋 测试步骤

### 1. 验证Central Service
```bash
# 检查Central Service状态
curl http://localhost:3000
```

### 2. 验证Station Software
```bash
# 检查Station Software状态
curl http://localhost:3030
```

### 3. 验证Station列表
1. 登录Central Service前端
2. 尝试创建联邦学习任务
3. 检查"Select Station"下拉框是否有选项

## 🎉 预期结果

成功配置后，您应该能够：
1. ✅ 在Central Service中看到可用的Station列表
2. ✅ 创建联邦学习任务并选择参与的Station
3. ✅ 在Station Software中看到待执行的任务
4. ✅ 执行联邦学习训练并上传结果

## 📝 注意事项

1. **认证**: 所有服务都需要通过Keycloak认证
2. **网络**: 确保所有服务在同一网络中
3. **镜像**: 确保Harbor中有必要的训练镜像
4. **资源**: 确保有足够的计算资源执行训练任务

## 🔄 下一步

1. 测试联邦学习任务创建
2. 验证Station能够接收和执行任务
3. 测试完整的联邦学习流程
4. 根据需要添加更多Station

---
配置完成时间: 2025-09-12 14:25
状态: ✅ 基础配置完成，准备测试联邦学习功能
