const fs = require('fs');
const path = require('path');

console.log('🚀 设置动态Station路由系统...\n');

// 1. 复制动态Station配置文件到Docker卷
const stationsDir = path.join(__dirname, 'stations');
const dockerStationsDir = '/usr/src/app/stations';

console.log('📁 复制Station配置文件到Docker容器...');

// 检查stations目录是否存在
if (!fs.existsSync(stationsDir)) {
    console.log('❌ stations目录不存在，请先运行 create_dynamic_station_router.js');
    process.exit(1);
}

// 列出所有配置文件
const configFiles = fs.readdirSync(stationsDir);
console.log(`✅ 找到 ${configFiles.length} 个配置文件:`);
configFiles.forEach(file => {
    console.log(`   - ${file}`);
});

console.log('\n🎯 动态Station路由系统设置完成！\n');

console.log('📋 架构说明：');
console.log('1. 所有用户都访问同一个端口: http://localhost:3030');
console.log('2. 根据Keycloak登录的用户名自动路由到对应的Station配置');
console.log('3. 每个用户看到不同的Station界面和功能\n');

console.log('🎯 用户映射：');
const mappingPath = path.join(stationsDir, 'user-mapping.json');
if (fs.existsSync(mappingPath)) {
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    Object.entries(mapping.userStationMapping).forEach(([username, station]) => {
        console.log(`   - 用户 ${username} → ${station.name} (${station.id})`);
    });
}

console.log('\n📋 接下来需要：\n');

console.log('1. 在Keycloak中创建用户账号：');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
Object.entries(mapping.userStationMapping).forEach(([username, station]) => {
    console.log(`   - 用户名: ${username}`);
    console.log(`   - 密码: station123`);
    console.log(`   - 邮箱: ${station.email}`);
    console.log('');
});

console.log('2. 启动动态Station服务：');
console.log('   docker-compose -f docker-compose-dynamic.yml up -d\n');

console.log('3. 测试动态Station路由：');
console.log('   - 访问: http://localhost:3030');
console.log('   - 使用不同用户登录，查看不同的Station界面');
console.log('   - 每个用户会看到对应的Station信息\n');

console.log('4. 在Central Service中测试：');
console.log('   - 访问: http://localhost:3000');
console.log('   - 创建联邦学习任务');
console.log('   - 在"Select Station"中应该看到多个Station选项\n');

console.log('🎉 这样每个用户登录时就会自动进入对应的Station了！');
console.log('   无需记住不同的端口，所有用户都访问同一个地址！');
