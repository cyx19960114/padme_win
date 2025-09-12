# 🔍 Central Service 白屏问题排查指南

## 当前状态分析

### ✅ 正常工作的部分
- Web服务器正常响应HTTP请求
- React应用已成功构建
- 数据库连接正常
- 静态文件(CSS/JS)正常加载

### ❌ 存在的问题
1. **Harbor连接失败**: `Error: connect ECONNREFUSED 127.0.0.1:8090`
2. **可能的Keycloak认证问题**
3. **前端可能在等待API响应**

## 🚀 立即解决方案

### 方案1: 临时禁用外部服务依赖

让我们创建一个"开发模式"配置，暂时跳过Harbor和Keycloak初始化：

### 方案2: 检查浏览器控制台

在浏览器中按F12，查看：
1. **Console选项卡**: 是否有JavaScript错误
2. **Network选项卡**: API请求是否正常
3. **Elements选项卡**: HTML是否正确加载

### 方案3: 测试API端点

直接访问后端API：
- http://localhost:3000/api (如果有)
- http://localhost:3000/health (健康检查)

## 🔧 调试步骤

### 1. 检查前端加载
```bash
curl -I http://localhost:3000
```

### 2. 检查静态资源
浏览器网络选项卡应该显示：
- main.css (已加载)
- main.js (已加载)
- favicon.png (已加载)

### 3. 查看JavaScript控制台错误

## 💡 可能的原因

1. **认证重定向循环**: Keycloak配置不正确导致无限重定向
2. **API请求失败**: 前端等待API响应超时
3. **环境变量问题**: React环境变量配置错误
4. **CORS问题**: 跨域请求被阻止

## 🎯 下一步行动

我建议：
1. 首先检查浏览器开发者工具的错误信息
2. 如果有JavaScript错误，我们针对性修复
3. 考虑创建一个"最小化"版本，先让基本界面显示
