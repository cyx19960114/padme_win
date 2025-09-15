// 完全独立的测试路由 - 绕过所有认证和中间件
const express = require('express');
const axios = require('axios');
const router = express.Router();

const HARBOR_URL = `http://${process.env.HARBOR_ADDRESS}:${process.env.HARBOR_PORT}`;
const HARBOR_AUTH = {
  username: process.env.HARBOR_ADMIN_USER || 'admin',
  password: process.env.HARBOR_ADMIN_PASSWORD || 'Harbor12345'
};

console.log(`🧪 Test Router - Harbor URL: ${HARBOR_URL}`);

// 测试Harbor连接
router.get('/harbor-connection', async (req, res) => {
  try {
    console.log('🔍 测试Harbor连接...');
    
    const response = await axios.get(`${HARBOR_URL}/api/v2.0/systeminfo`, { 
      auth: HARBOR_AUTH,
      timeout: 5000
    });
    
    res.json({
      status: 'success',
      message: 'Harbor连接成功',
      harbor_url: HARBOR_URL,
      harbor_version: response.data.harbor_version
    });
  } catch (error) {
    console.error('❌ Harbor连接失败:', error.message);
    res.status(500).json({
      status: 'error', 
      message: 'Harbor连接失败',
      error: error.message,
      harbor_url: HARBOR_URL
    });
  }
});

// 获取联邦学习项目
router.get('/federatedtrains', async (req, res) => {
  try {
    console.log('🔍 获取联邦学习项目...');
    
    // 获取federated_learn_repository项目的仓库
    const response = await axios.get(
      `${HARBOR_URL}/api/v2.0/projects/federated_learn_repository/repositories`,
      { auth: HARBOR_AUTH, timeout: 10000 }
    );
    
    const repositories = response.data;
    console.log(`📦 找到 ${repositories.length} 个仓库:`, repositories.map(r => r.name));
    
    // 重新组织数据结构
    const projects = [];
    const projectMap = {};
    
    repositories.forEach(repo => {
      const parts = repo.name.split('/');
      if (parts.length >= 3) {
        const projectName = parts[1];
        const imageType = parts[2];
        
        if (!projectMap[projectName]) {
          projectMap[projectName] = {
            name: projectName,
            processing: false
          };
          projects.push(projectMap[projectName]);
        }
        
        if (imageType === 'learning') {
          projectMap[projectName].learning = [{
            tag: 'latest',
            trainclass: `${repo.name}:latest`
          }];
        } else if (imageType === 'aggregation') {
          projectMap[projectName].aggregation = [{
            tag: 'latest',
            trainclass: `${repo.name}:latest`
          }];
        }
      }
    });
    
    console.log(`✅ 返回 ${projects.length} 个项目:`, projects.map(p => p.name));
    res.json(projects);
    
  } catch (error) {
    console.error('❌ 获取联邦学习项目失败:', error.message);
    
    // 返回模拟数据
    const mockProjects = [
      {
        name: 'diabetes_prediction',
        processing: false,
        learning: [{ tag: 'latest', trainclass: 'federated_learn_repository/diabetes_prediction/learning:latest' }],
        aggregation: [{ tag: 'latest', trainclass: 'federated_learn_repository/diabetes_prediction/aggregation:latest' }]
      },
      {
        name: 'heart_disease_classification',
        processing: false,
        learning: [{ tag: 'latest', trainclass: 'federated_learn_repository/heart_disease_classification/learning:latest' }],
        aggregation: [{ tag: 'latest', trainclass: 'federated_learn_repository/heart_disease_classification/aggregation:latest' }]
      }
    ];
    
    console.log('🔄 返回模拟数据');
    res.json(mockProjects);
  }
});

module.exports = router;
