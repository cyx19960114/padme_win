const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

class DynamicStationConfig {
    constructor() {
        this.stationsDir = path.join(__dirname, '..', 'stations');
        this.userMapping = null;
        this.currentConfig = null;
        this.loadUserMapping();
    }

    // 加载用户映射配置
    loadUserMapping() {
        try {
            const mappingPath = path.join(this.stationsDir, 'user-mapping.json');
            if (fs.existsSync(mappingPath)) {
                const mappingData = fs.readFileSync(mappingPath, 'utf8');
                this.userMapping = JSON.parse(mappingData);
                console.log('✅ 用户映射配置已加载:', this.userMapping.userStationMapping);
            } else {
                console.log('⚠️ 未找到用户映射配置文件，使用默认配置');
                this.userMapping = {
                    userStationMapping: {
                        'station1': {
                            id: 'station-1',
                            name: 'Station 1',
                            email: 'station1@localhost.local'
                        }
                    },
                    defaultStation: 'station1'
                };
            }
        } catch (error) {
            console.error('❌ 加载用户映射配置失败:', error);
            this.userMapping = {
                userStationMapping: {
                    'station1': {
                        id: 'station-1',
                        name: 'Station 1',
                        email: 'station1@localhost.local'
                    }
                },
                defaultStation: 'station1'
            };
        }
    }

    // 根据用户名获取Station配置
    getStationConfig(username) {
        if (!this.userMapping || !this.userMapping.userStationMapping[username]) {
            console.log(`⚠️ 用户 ${username} 未找到映射配置，使用默认配置`);
            username = this.userMapping?.defaultStation || 'station1';
        }

        const stationConfigPath = path.join(this.stationsDir, `${username}.lock`);
        
        if (!fs.existsSync(stationConfigPath)) {
            console.log(`❌ 未找到用户 ${username} 的Station配置文件`);
            return null;
        }

        try {
            const configContent = fs.readFileSync(stationConfigPath, 'utf8');
            const config = dotenv.parse(configContent);
            
            // 添加用户信息
            config.USERNAME = username;
            config.STATION_MAPPING = this.userMapping.userStationMapping[username];
            
            console.log(`✅ 已加载用户 ${username} 的Station配置:`, config.STATION_ID);
            return config;
        } catch (error) {
            console.error(`❌ 加载用户 ${username} 的Station配置失败:`, error);
            return null;
        }
    }

    // 获取当前用户的Station配置
    getCurrentStationConfig() {
        return this.currentConfig;
    }

    // 设置当前用户的Station配置
    setCurrentStationConfig(config) {
        this.currentConfig = config;
        
        // 更新环境变量
        if (config) {
            Object.keys(config).forEach(key => {
                if (key !== 'USERNAME' && key !== 'STATION_MAPPING') {
                    process.env[key] = config[key];
                }
            });
            console.log(`🔄 已切换到Station: ${config.STATION_ID} (用户: ${config.USERNAME})`);
        }
    }

    // 获取所有可用的Station
    getAllStations() {
        if (!this.userMapping) {
            return [];
        }

        return Object.entries(this.userMapping.userStationMapping).map(([username, station]) => ({
            username,
            stationId: station.id,
            stationName: station.name,
            email: station.email
        }));
    }

    // 检查用户是否有权限访问指定Station
    hasAccessToStation(username, stationId) {
        if (!this.userMapping || !this.userMapping.userStationMapping[username]) {
            return false;
        }
        
        const userStation = this.userMapping.userStationMapping[username];
        return userStation.id === stationId;
    }
}

// 创建全局实例
const dynamicStationConfig = new DynamicStationConfig();

module.exports = dynamicStationConfig;
