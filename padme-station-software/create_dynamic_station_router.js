const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 创建动态Station路由系统...\n');

// 用户到Station的映射配置
const userStationMapping = {
    'station1': {
        id: 'station-1',
        name: 'Station 1',
        email: 'station1@localhost.local'
    },
    'station2': {
        id: 'station-2', 
        name: 'Station 2',
        email: 'station2@localhost.local'
    },
    'station3': {
        id: 'station-3',
        name: 'Station 3',
        email: 'station3@localhost.local'
    }
};

// 创建动态Station配置目录
const stationsDir = path.join(__dirname, 'stations');
if (!fs.existsSync(stationsDir)) {
    fs.mkdirSync(stationsDir);
}

// 为每个用户创建Station配置
Object.entries(userStationMapping).forEach(([username, station]) => {
    // 生成RSA密钥对
    const { generateKeyPairSync } = require('crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // 配置文件内容
    const configContent = `STATION_ID=${station.id}
HARBOR_USER=${username}
HARBOR_PASSWORD=station123
HARBOR_EMAIL=${station.email}
STATION_NAME=${station.name}
STATION_EMAIL=${station.email}
HARBOR_CLI=local-harbor-cli-secret
HARBOR_WEBHOOK_SECRET=local-webhook-secret
CENTRALSERVICE_ADDRESS=localhost
CENTRALSERVICE_PORT=3000
CENTRALSERVICE_ENDPOINT=http://localhost:3000
AUTH_SERVER_ADDRESS=localhost
AUTH_SERVER_PORT=8090
KC_AUTH_SERVER_URL=http://localhost:8090
KC_REALM=pht
KC_CLIENT_ID=pht-station
KC_CLIENT_SECRET=9eDl3P2lWBhXvuYjy3rsCIi9MvOFFRak
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_USER=admin
MONGO_PASSWORD=admin123456
MONGO_DB=pht
MONGO_AUTH_SOURCE=admin
DOCKER_HOST=pht-dind
DOCKER_PORT=2376
VAULT_HOST=vault
VAULT_PORT=8200
VAULT_TOKEN=station-root-token
VAULT_ADDR=http://vault:8200
JWT_SECRET=pht-station-jwt-secret
SESSION_SECRET=pht-station-session-secret
METADATA_PROVIDER=http://metadata:9988
METADATA_STORE=http://localhost:8001
COSIGN_ENABLED=false
NODE_ENV=development
HOST_MOUNT_DIRECTORY=/tmp`;

    // 创建锁文件内容
    const lockContent = `${configContent}
PRIVATE_KEY="${Buffer.from(privateKey).toString('base64')}"
PUBLIC_KEY="${Buffer.from(publicKey).toString('base64')}"`;

    // 保存到stations目录
    const stationConfigPath = path.join(stationsDir, `${username}.lock`);
    fs.writeFileSync(stationConfigPath, lockContent);
    
    console.log(`✅ 已创建 ${station.name} 的配置: ${username}.lock`);
    console.log(`   - Station ID: ${station.id}`);
    console.log(`   - 用户名: ${username}`);
    console.log(`   - 邮箱: ${station.email}`);
    console.log('');
});

// 创建用户映射配置文件
const mappingConfig = {
    userStationMapping,
    defaultStation: 'station1'
};

fs.writeFileSync(
    path.join(stationsDir, 'user-mapping.json'), 
    JSON.stringify(mappingConfig, null, 2)
);

console.log('🎉 动态Station路由系统已创建完成！\n');

console.log('📋 架构说明：');
console.log('1. 所有用户都访问同一个端口: http://localhost:3030');
console.log('2. 根据Keycloak登录的用户名自动路由到对应的Station配置');
console.log('3. 每个用户看到不同的Station界面和功能\n');

console.log('🎯 用户映射：');
Object.entries(userStationMapping).forEach(([username, station]) => {
    console.log(`   - 用户 ${username} → ${station.name} (${station.id})`);
});

console.log('\n📁 配置文件位置：');
console.log(`   - 配置目录: ${stationsDir}`);
console.log('   - 用户映射: user-mapping.json');
console.log('   - Station配置: [username].lock');

console.log('\n🔄 下一步：');
console.log('1. 修改Station Software代码以支持动态路由');
console.log('2. 在Keycloak中创建对应的用户账号');
console.log('3. 测试动态Station路由功能');
