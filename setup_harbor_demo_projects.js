const axios = require('axios');

// Harbor配置
const HARBOR_URL = 'http://localhost:8080';
const HARBOR_USERNAME = 'admin';
const HARBOR_PASSWORD = 'Harbor12345'; // 默认Harbor密码

// 项目配置
const PROJECTS = [
    {
        name: 'train_class_repository',
        description: 'Repository for train classes used in incremental learning'
    },
    {
        name: 'federated_learn_repository', 
        description: 'Repository for federated learning projects'
    }
];

// 示例联邦学习项目
const FL_DEMO_PROJECTS = [
    {
        name: 'diabetes_prediction',
        learning_image: 'tensorflow/tensorflow:2.8.0',
        aggregation_image: 'python:3.9-slim'
    },
    {
        name: 'heart_disease_classification',
        learning_image: 'pytorch/pytorch:1.12.0-cuda11.3-cudnn8-devel',
        aggregation_image: 'python:3.9-slim'
    },
    {
        name: 'image_classification',
        learning_image: 'tensorflow/tensorflow:2.8.0-gpu',
        aggregation_image: 'python:3.9-slim'
    }
];

// 创建axios实例，带有认证
const harborApi = axios.create({
    baseURL: HARBOR_URL + '/api/v2.0',
    auth: {
        username: HARBOR_USERNAME,
        password: HARBOR_PASSWORD
    },
    headers: {
        'Content-Type': 'application/json'
    }
});

async function createProject(projectConfig) {
    try {
        console.log(`🚀 创建项目: ${projectConfig.name}`);
        
        const projectData = {
            project_name: projectConfig.name,
            metadata: {
                public: "false"
            },
            storage_limit: -1
        };
        
        const response = await harborApi.post('/projects', projectData);
        console.log(`✅ 项目 ${projectConfig.name} 创建成功`);
        return true;
    } catch (error) {
        if (error.response && error.response.status === 409) {
            console.log(`ℹ️  项目 ${projectConfig.name} 已存在`);
            return true;
        } else {
            console.error(`❌ 创建项目 ${projectConfig.name} 失败:`, error.response?.data || error.message);
            return false;
        }
    }
}

async function createRepository(projectName, repositoryName) {
    try {
        console.log(`📦 在项目 ${projectName} 中创建仓库: ${repositoryName}`);
        
        // Harbor API 2.0 中，仓库是通过推送镜像自动创建的
        // 这里我们只记录将要创建的仓库
        console.log(`ℹ️  仓库 ${projectName}/${repositoryName} 将在首次推送镜像时自动创建`);
        return true;
    } catch (error) {
        console.error(`❌ 创建仓库失败:`, error.response?.data || error.message);
        return false;
    }
}

async function tagAndPushImage(sourceImage, targetImage) {
    try {
        console.log(`🏷️  标记镜像: ${sourceImage} -> ${targetImage}`);
        
        // 这里模拟镜像标记过程
        // 在实际环境中，您需要使用docker命令或docker API
        console.log(`📝 执行命令: docker tag ${sourceImage} ${targetImage}`);
        console.log(`📤 执行命令: docker push ${targetImage}`);
        console.log(`ℹ️  注意: 请手动执行上述Docker命令来实际推送镜像`);
        
        return true;
    } catch (error) {
        console.error(`❌ 标记镜像失败:`, error.message);
        return false;
    }
}

async function setupFederatedLearningProject(project) {
    console.log(`\n🔬 设置联邦学习项目: ${project.name}`);
    
    // 创建学习镜像仓库
    const learningRepo = `${project.name}/learning`;
    await createRepository('federated_learn_repository', learningRepo);
    
    // 创建聚合镜像仓库  
    const aggregationRepo = `${project.name}/aggregation`;
    await createRepository('federated_learn_repository', aggregationRepo);
    
    // 标记并推送学习镜像
    const learningTarget = `localhost:8080/federated_learn_repository/${learningRepo}:latest`;
    await tagAndPushImage(project.learning_image, learningTarget);
    
    // 标记并推送聚合镜像
    const aggregationTarget = `localhost:8080/federated_learn_repository/${aggregationRepo}:latest`;
    await tagAndPushImage(project.aggregation_image, aggregationTarget);
}

async function generateDockerCommands() {
    console.log(`\n📜 生成Docker命令脚本:`);
    console.log(`\n# ================================`);
    console.log(`# Docker镜像准备命令`);
    console.log(`# ================================\n`);
    
    console.log(`# 1. 登录Harbor`);
    console.log(`docker login localhost:8080 -u admin -p Harbor12345\n`);
    
    for (const project of FL_DEMO_PROJECTS) {
        console.log(`# 项目: ${project.name}`);
        console.log(`# 拉取基础镜像`);
        console.log(`docker pull ${project.learning_image}`);
        console.log(`docker pull ${project.aggregation_image}\n`);
        
        console.log(`# 标记并推送学习镜像`);
        const learningTarget = `localhost:8080/federated_learn_repository/${project.name}/learning:latest`;
        console.log(`docker tag ${project.learning_image} ${learningTarget}`);
        console.log(`docker push ${learningTarget}\n`);
        
        console.log(`# 标记并推送聚合镜像`);
        const aggregationTarget = `localhost:8080/federated_learn_repository/${project.name}/aggregation:latest`;
        console.log(`docker tag ${project.aggregation_image} ${aggregationTarget}`);
        console.log(`docker push ${aggregationTarget}\n`);
        
        console.log(`# --------------------------------\n`);
    }
}

async function main() {
    console.log('🎯 开始设置Harbor演示项目\n');
    
    try {
        // 测试Harbor连接
        console.log('🔗 测试Harbor连接...');
        await harborApi.get('/systeminfo');
        console.log('✅ Harbor连接成功\n');
        
        // 创建基础项目
        console.log('📋 创建基础项目...');
        for (const project of PROJECTS) {
            await createProject(project);
        }
        
        // 设置联邦学习演示项目
        console.log('\n🔬 设置联邦学习演示项目...');
        for (const project of FL_DEMO_PROJECTS) {
            await setupFederatedLearningProject(project);
        }
        
        // 生成Docker命令
        await generateDockerCommands();
        
        console.log('\n🎉 Harbor项目设置完成!');
        console.log('\n📝 接下来的步骤:');
        console.log('1. 复制上面的Docker命令');
        console.log('2. 在终端中执行这些命令');
        console.log('3. 刷新Central Service界面');
        console.log('4. 现在应该能看到可选的项目和聚合镜像了!');
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ 无法连接到Harbor，请确保Harbor在localhost:8080运行');
        } else {
            console.error('❌ 设置过程中出现错误:', error.message);
        }
    }
}

main();
