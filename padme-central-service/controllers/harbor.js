// 开发环境专用Harbor控制器 - 使用基本HTTP认证直接连接Harbor
const axios = require('axios');

const HARBOR_URL = `http://host.docker.internal:8080`;
const HARBOR_AUTH = {
  username: process.env.HARBOR_ADMIN_USER || 'admin',
  password: process.env.HARBOR_ADMIN_PASSWORD || 'Harbor12345'
};

console.log(`🔧 [DEV] Harbor Controller - URL: ${HARBOR_URL}`);
console.log(`🔧 [DEV] Harbor Auth - User: ${HARBOR_AUTH.username}`);

module.exports = {
  async getProjects(req, res, next) {
    try {
      console.log('🔍 [Harbor] 获取所有项目...');
      
      const response = await axios.get(`${HARBOR_URL}/api/v2.0/projects`, { 
        auth: HARBOR_AUTH,
        timeout: 10000 
      });
      
      console.log(`✅ [Harbor] 找到 ${response.data.length} 个项目`);
      res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ [Harbor] 获取项目失败:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  async getTrainClassRepositories(req, res, next) {
    try {
      console.log('🔍 [Harbor] 获取训练类仓库...');
      
      const response = await axios.get(
        `${HARBOR_URL}/api/v2.0/projects/train_class_repository/repositories`,
        { auth: HARBOR_AUTH, timeout: 10000 }
      );
      
      console.log(`✅ [Harbor] 找到 ${response.data.length} 个训练仓库`);
      res.status(200).json(response.data);
      
    } catch (error) {
      console.error('❌ [Harbor] 获取训练仓库失败:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  async getFederatedTrainClassRepositories(req, res, next) {
    try {
      console.log('🔍 [Harbor] 获取联邦学习项目...');
      console.log(`🔗 [Harbor] 请求URL: ${HARBOR_URL}/api/v2.0/projects/federated_learn_repository/repositories`);
      
      // 获取federated_learn_repository项目的所有仓库
      const response = await axios.get(
        `${HARBOR_URL}/api/v2.0/projects/federated_learn_repository/repositories`,
        { 
          auth: HARBOR_AUTH, 
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const repositories = response.data;
      console.log(`📦 [Harbor] 原始仓库数据 (${repositories.length}个):`, 
        repositories.map(r => r.name));
      
      // 重新组织数据结构以匹配前端期望的格式
      const projects = [];
      const projectMap = {};
      
      repositories.forEach(repo => {
        // 解析仓库名: federated_learn_repository/项目名/类型
        const parts = repo.name.split('/');
        console.log(`🔍 [Harbor] 解析仓库: ${repo.name} -> parts:`, parts);
        
        if (parts.length >= 3) {
          const projectName = parts[1];  // 项目名 (如: diabetes_prediction)
          const imageType = parts[2];    // 类型 (learning 或 aggregation)
          
          console.log(`📋 [Harbor] 项目: ${projectName}, 类型: ${imageType}`);
          
          if (!projectMap[projectName]) {
            projectMap[projectName] = {
              name: projectName,
              processing: false
            };
            projects.push(projectMap[projectName]);
            console.log(`➕ [Harbor] 新增项目: ${projectName}`);
          }
          
          // 添加镜像标签信息
          if (imageType === 'learning') {
            projectMap[projectName].learning = [{
              tag: 'latest',
              trainclass: `${repo.name}:latest`
            }];
            console.log(`📚 [Harbor] 添加学习镜像: ${projectName}`);
          } else if (imageType === 'aggregation') {
            projectMap[projectName].aggregation = [{
              tag: 'latest', 
              trainclass: `${repo.name}:latest`
            }];
            console.log(`🔄 [Harbor] 添加聚合镜像: ${projectName}`);
          }
        } else {
          console.log(`⚠️ [Harbor] 跳过格式不正确的仓库: ${repo.name}`);
        }
      });
      
      console.log(`✅ [Harbor] 最终返回 ${projects.length} 个联邦学习项目:`);
      projects.forEach(p => {
        console.log(`  📄 ${p.name}: learning=${!!p.learning}, aggregation=${!!p.aggregation}`);
      });
      
      res.status(200).json(projects);
      
    } catch (error) {
      console.error('❌ [Harbor] 获取联邦学习项目失败:', error.message);
      console.error('❌ [Harbor] 错误详情:', {
        url: `${HARBOR_URL}/api/v2.0/projects/federated_learn_repository/repositories`,
        auth: { username: HARBOR_AUTH.username, password: '***' },
        error: error.response?.data || error.message
      });
      
      res.status(500).json({ error: error.message });
    }
  }
};