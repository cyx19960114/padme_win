# PADME Central Service - Keycloak配置指南

## 🔑 Keycloak管理员登录

**管理控制台地址**: http://localhost:8090/admin

**登录凭据**:
- 用户名: `admin`
- 密码: `admin_password_2024`

## 📋 配置步骤

### 步骤1: 选择正确的Realm

1. 登录后，确保你在 `pht` realm 中（左上角显示）
2. 如果没有 `pht` realm，需要先创建：
   - 点击左上角的realm下拉菜单
   - 选择 "Create realm"
   - 名称输入: `pht`
   - 点击 "Create"

### 步骤2: 创建前端客户端 (central-service)

✅ **从截图看，你已经成功创建了 `central-service` 客户端！**

如果需要重新创建或修改：

1. 在左侧菜单中点击 **"Clients"**
2. 点击右上角的 **"Create client"** 按钮

#### 第1步：General settings
- **Client type**: 保持 `OpenID Connect` ✅
- **Client ID**: 输入 `central-service`
- **Name**: 输入 `PADME Central Service Frontend`
- **Description**: 输入 `Frontend client for PADME Central Service`
- **Always display in UI**: 保持关闭状态
- 点击 **"Next"**

#### 第2步：Capability config
- **Client authentication**: 保持 `Off` ✅ (这是公共客户端)
- **Authorization**: 保持 `Off` ✅
- **Authentication flow**: 
  - ✅ **Standard flow** (勾选)
  - ✅ **Direct access grants** (勾选)
  - ✅ **Implicit flow** (勾选)
  - ❌ Service accounts roles (不勾选)
  - ❌ OAuth 2.0 Device Authorization Grant (不勾选)
  - ❌ OIDC CIBA Grant (不勾选)
- 点击 **"Next"**

#### 第3步：Login settings
- **Root URL**: 输入 `http://localhost:3000`
- **Home URL**: 输入 `http://localhost:3000`
- **Valid redirect URIs**: 点击 "+ Add valid redirect URIs"，输入 `http://localhost:3000/*`
- **Valid post logout redirect URIs**: 点击 "+ Add valid post logout redirect URIs"，输入 `http://localhost:3000/*`
- **Web origins**: 点击 "+ Add web origins"，输入 `http://localhost:3000`
- 点击 **"Save"**

### 步骤3: 创建后端客户端 (central-service-backend)

✅ **从截图看，你已经成功创建了 `central-service-backend` 客户端！**

如果需要重新创建或修改：

1. 再次点击 **"Create client"** 创建第二个客户端

#### 第1步：General settings
- **Client type**: 保持 `OpenID Connect` ✅
- **Client ID**: 输入 `central-service-backend`
- **Name**: 输入 `PADME Central Service Backend`
- **Description**: 输入 `Backend API client for PADME Central Service`
- **Always display in UI**: 保持关闭状态
- 点击 **"Next"**

#### 第2步：Capability config
- **Client authentication**: 开启 `On` ✅ (这是机密客户端)
- **Authorization**: 开启 `On` ✅
- **Authentication flow**: 
  - ✅ **Standard flow** (勾选)
  - ✅ **Direct access grants** (勾选)
  - ❌ **Implicit flow** (不勾选)
  - ✅ **Service accounts roles** (勾选)
  - ❌ OAuth 2.0 Device Authorization Grant (不勾选)
  - ❌ OIDC CIBA Grant (不勾选)
- 点击 **"Next"**

#### 第3步：Login settings
- **Root URL**: 输入 `http://localhost:3000`
- **Home URL**: 输入 `http://localhost:3000`
- **Valid redirect URIs**: 点击 "+ Add valid redirect URIs"，输入 `http://localhost:3000/*`
- **Valid post logout redirect URIs**: 点击 "+ Add valid post logout redirect URIs"，输入 `http://localhost:3000/*`
- **Web origins**: 点击 "+ Add web origins"，输入 `http://localhost:3000`
- 点击 **"Save"**

### 步骤4: 获取后端客户端密钥

📝 **获取客户端密钥的步骤**：

1. ✅ 点击 `central-service-backend` 客户端名称进入详情页面（已完成）
2. 在客户端详情页面，你会看到以下标签页：
   - **Settings** (设置)
   - **Keys** (密钥)
   - **Credentials** (凭据) ⬅️ **客户端密钥在这里！**
   - **Roles** (角色)
   - **Client scopes** (客户端作用域)
   - **Authorization** (授权)
   - **Service accounts roles** (服务账户角色)
   - **Sessions** (会话)
   - **Advanced** (高级设置)
   
3. **点击 "Credentials" 标签页** ⬅️ **请点击这个！**
4. 在Credentials页面中找到 **"Client Secret"** 或 **"Secret"**
5. **复制并保存这个密钥** - 稍后会用到

✅ **已获取客户端密钥**: `VHdbyDpLxGVNwcSxU1PBSDUJDPiCxzjZ`

**重要提示**：
- 客户端必须是"机密客户端"才会有密钥
- 确保客户端的 **Client authentication** 设置为 `On`

### 步骤5: 配置后端客户端的额外设置

1. 在 `central-service-backend` 客户端的 **"Settings"** 标签页中
2. 向下滚动找到 **"Login settings"** 部分
3. 确认以下设置：
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/*`
   - **Web origins**: `http://localhost:3000`

4. 在 **"Logout settings"** 部分设置：
   - **Backchannel logout session required**: ✅ **ON** (开启单点登出)
   - **Backchannel logout revoke offline sessions**: ❌ **OFF** (保持用户体验)

5. 点击 **"Save"** 保存所有设置

### 步骤6: 为central-service添加Harbor受众映射

✅ **你已经在正确的位置！**

1. ✅ 点击 `central-service` 客户端名称进入详情页面（已完成）
2. ✅ 点击 **"Client scopes"** 标签页（已完成）
3. ✅ **点击 `central-service-dedicated` 链接**（已完成）
4. ✅ 在打开的页面中，你会看到 **"Mappers"** 标签页已经激活（已完成）
5. **点击 "Configure a new mapper" 按钮** ⬅️ **现在请点击这个！**
6. 选择 **"Audience"** 映射器类型
8. 填写映射器信息：
   - **Name**: `harbor-audience`
   - **Included Client Audience**: `harbor`
   - **Add to ID token**: 开启 `On`
   - **Add to access token**: 开启 `On`
   - **Add to token introspection**: 开启 `On`
9. 点击 **"Save"**

## ✅ 验证配置

### 检查客户端列表
✅ **从你的截图可以看到，两个客户端都已成功创建：**
- ✅ `central-service` - PADME Central Service Frontend (OpenID Connect)
- ✅ `central-service-backend` - PADME Central Service Backend (OpenID Connect)

### 需要确认的配置
1. **✅ 客户端已创建**
2. **🔍 需要获取客户端密钥** - 从 `central-service-backend` 的 "Keys" 标签页
3. **🔍 需要验证URL配置** - 确保两个客户端都配置了正确的重定向URI
4. **🔍 需要添加Harbor受众映射** - 为 `central-service` 添加

### 当前状态检查
根据你的截图，需要完成以下步骤：

1. **点击 `central-service-backend`** 进入详情页面
2. **查找并记录客户端密钥**
3. **验证所有URL配置**
4. **为 `central-service` 添加Harbor受众映射**

## 🔧 更新Central Service配置

如果你获取到了central-service-backend的客户端密钥，可以在docker-compose.yml中添加：

```yaml
environment:
  KEYCLOAK_CLIENT_SECRET: "你从Keys页面复制的密钥"
```

然后重启Central Service：
```bash
docker-compose restart centralservice
```

## 🧪 测试配置

1. 等待Central Service完全启动
2. 访问 http://localhost:3000
3. 尝试通过Keycloak登录
4. 如果出现认证问题，检查浏览器开发者工具的网络标签页

## 📋 配置完成检查清单

- [x] 已登录Keycloak管理控制台 (http://localhost:8090/admin)
- [x] 在pht realm中工作
- [x] 创建了central-service客户端（公共客户端）
- [x] 创建了central-service-backend客户端（机密客户端）
- [ ] 从central-service-backend的Keys标签页获取了客户端密钥
- [ ] 验证了两个客户端的重定向URI配置
- [ ] 为central-service添加了Harbor受众映射
- [ ] 测试了Central Service的访问

## 🔍 下一步操作

根据你的截图，现在需要：

1. **点击 `central-service-backend` 客户端名称**
2. **查看客户端详情页面的标签页**
3. **找到并点击 "Keys" 标签页**
4. **复制客户端密钥**
5. **检查和完善URL配置**
6. **为前端客户端添加Harbor受众映射**

## 🔍 故障排除

### 如果找不到客户端密钥
1. 确保点击了 `central-service-backend` 客户端名称进入详情页面
2. 查看是否有 "Keys" 或 "Credentials" 标签页
3. 确认客户端的 **Client authentication** 设置为 `On`
4. 如果仍然找不到，尝试重新编辑客户端设置

### 如果标签页不同
不同版本的Keycloak可能标签页名称略有不同：
- 可能叫 "Keys"、"Credentials" 或 "Client Authenticator"
- 查找包含客户端密钥或Secret的页面

### 常见配置错误
1. **重定向URI不匹配**: 确保使用 `http://localhost:3000/*`
2. **Web origins配置错误**: 确保设置为 `http://localhost:3000`
3. **客户端类型错误**: frontend用公共客户端，backend用机密客户端
4. **认证流程配置错误**: 确保按照指南勾选了正确的选项

## 🎉 配置进度

✅ **已完成**: 创建了两个必需的客户端
🔄 **进行中**: 获取客户端密钥和完善配置
⏳ **待完成**: Harbor受众映射和最终测试

你的配置已经完成了大部分！现在只需要完善一些细节配置就可以开始使用了。