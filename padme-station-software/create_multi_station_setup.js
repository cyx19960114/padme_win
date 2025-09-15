const crypto = require('crypto');
const fs = require('fs');

// 创建多个Station的配置
const stations = [
    {
        id: 'station-1',
        name: 'Station 1',
        user: 'station1',
        email: 'station1@localhost.local'
    },
    {
        id: 'station-2', 
        name: 'Station 2',
        user: 'station2',
        email: 'station2@localhost.local'
    },
    {
        id: 'station-3',
        name: 'Station 3', 
        user: 'station3',
        email: 'station3@localhost.local'
    }
];

// 为每个Station创建锁文件
stations.forEach(station => {
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
HARBOR_USER=${station.user}
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

    // 保存锁文件
    fs.writeFileSync(`stationsetup-${station.id}.lock`, lockContent);
    
    console.log(`✅ 已创建 ${station.name} 的锁文件: stationsetup-${station.id}.lock`);
    console.log(`   - Station ID: ${station.id}`);
    console.log(`   - 用户名: ${station.user}`);
    console.log(`   - 邮箱: ${station.email}`);
    console.log('');
});

console.log('🎉 多Station配置已创建完成！');
console.log('');
console.log('📋 接下来需要：');
console.log('1. 在Keycloak中创建对应的用户账号');
console.log('2. 为每个Station创建独立的Docker容器');
console.log('3. 配置用户与Station的映射关系');
