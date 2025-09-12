// 临时补丁文件：修复Central Service中的Docker客户端TLS问题
const fs = require('fs');
const path = require('path');

const dockerJsPath = './padme-central-service/utils/docker.js';

// 读取原始文件
let content = fs.readFileSync(dockerJsPath, 'utf8');

// 修复getInstance函数
const oldGetInstance = `const getInstance = () => {

    const docker = new Docker({
        protocol: 'https',
        host: 'dind',
        port: 2376,
        ca: fs.readFileSync(path.join(dind_client_certs_path, 'ca.pem')),
        cert: fs.readFileSync(path.join(dind_client_certs_path, 'cert.pem')),
        key: fs.readFileSync(path.join(dind_client_certs_path, 'key.pem'))
    });

    return docker;
}`;

const newGetInstance = `const getInstance = () => {
    // Check if we should use TLS or not based on environment variables
    const dockerHost = process.env.DOCKER_HOST || 'tcp://dind:2375';
    const useTLS = process.env.DOCKER_TLS_VERIFY !== '';
    
    let dockerConfig;
    
    if (useTLS) {
        // Use TLS with certificates
        dockerConfig = {
            protocol: 'https',
            host: 'dind',
            port: 2376,
            ca: fs.readFileSync(path.join(dind_client_certs_path, 'ca.pem')),
            cert: fs.readFileSync(path.join(dind_client_certs_path, 'cert.pem')),
            key: fs.readFileSync(path.join(dind_client_certs_path, 'key.pem'))
        };
    } else {
        // Use plain HTTP without TLS
        dockerConfig = {
            protocol: 'http',
            host: 'dind',
            port: 2375
        };
    }

    const docker = new Docker(dockerConfig);
    return docker;
}`;

// 如果文件还没有被修复，则应用修复
if (content.includes('protocol: \'https\'') && !content.includes('DOCKER_TLS_VERIFY')) {
    content = content.replace(oldGetInstance, newGetInstance);
    fs.writeFileSync(dockerJsPath, content);
    console.log('✅ 成功应用Docker客户端TLS修复补丁');
} else {
    console.log('⚠️ 文件已经被修复或格式不匹配');
}

// 验证修复
const verifyContent = fs.readFileSync(dockerJsPath, 'utf8');
if (verifyContent.includes('DOCKER_TLS_VERIFY')) {
    console.log('✅ 修复验证成功：DOCKER_TLS_VERIFY检查已添加');
} else {
    console.log('❌ 修复验证失败：DOCKER_TLS_VERIFY检查未找到');
}
