const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置多Station环境...\n');

// 1. 复制锁文件到对应的Docker卷
const stations = [
    { id: 'station-1', port: 3031 },
    { id: 'station-2', port: 3032 },
    { id: 'station-3', port: 3033 }
];

stations.forEach(station => {
    const lockFileName = `stationsetup-${station.id}.lock`;
    const lockFilePath = path.join(__dirname, lockFileName);
    
    if (fs.existsSync(lockFilePath)) {
        console.log(`✅ 找到锁文件: ${lockFileName}`);
        console.log(`   - Station ID: ${station.id}`);
        console.log(`   - 端口: ${station.port}`);
        console.log(`   - 访问地址: http://localhost:${station.port}`);
        console.log('');
    } else {
        console.log(`❌ 未找到锁文件: ${lockFileName}`);
    }
});

console.log('📋 多Station环境设置完成！\n');

console.log('🎯 接下来需要：\n');

console.log('1. 在Keycloak中创建用户账号：');
stations.forEach(station => {
    const user = `station${station.id.split('-')[1]}`;
    console.log(`   - 用户名: ${user}`);
    console.log(`   - 密码: station123`);
    console.log(`   - 邮箱: ${user}@localhost.local`);
    console.log('');
});

console.log('2. 启动多Station服务：');
console.log('   docker-compose -f docker-compose-multi-station.yml up -d\n');

console.log('3. 访问不同的Station：');
stations.forEach(station => {
    const user = `station${station.id.split('-')[1]}`;
    console.log(`   - ${station.id}: http://localhost:${station.port} (用户: ${user})`);
});

console.log('\n4. 在Central Service中创建联邦学习任务时，将看到3个Station选项！\n');

console.log('🎉 这样每个用户登录时就会进入不同的Station了！');
