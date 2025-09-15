const dynamicStationConfig = require('../utils/dynamicStationConfig');

/**
 * 动态Station路由中间件
 * 根据Keycloak认证的用户自动加载对应的Station配置
 */
function dynamicStationMiddleware(req, res, next) {
    // 检查是否已认证
    if (!req.kauth || !req.kauth.grant) {
        console.log('⚠️ 用户未认证，跳过Station配置加载');
        return next();
    }

    try {
        // 从Keycloak token中获取用户名
        const token = req.kauth.grant.access_token;
        const username = token.content.preferred_username;
        
        if (!username) {
            console.log('⚠️ 无法从token中获取用户名');
            return next();
        }

        console.log(`🔍 检测到用户登录: ${username}`);

        // 获取用户的Station配置
        const stationConfig = dynamicStationConfig.getStationConfig(username);
        
        if (!stationConfig) {
            console.log(`❌ 用户 ${username} 的Station配置加载失败`);
            return res.status(500).json({
                error: 'Station configuration not found',
                message: `No station configuration found for user: ${username}`
            });
        }

        // 设置当前Station配置
        dynamicStationConfig.setCurrentStationConfig(stationConfig);

        // 将Station信息添加到请求对象
        req.station = {
            id: stationConfig.STATION_ID,
            name: stationConfig.STATION_NAME,
            username: username,
            email: stationConfig.STATION_EMAIL,
            config: stationConfig
        };

        console.log(`✅ 用户 ${username} 已路由到Station: ${stationConfig.STATION_ID}`);
        next();

    } catch (error) {
        console.error('❌ 动态Station路由中间件错误:', error);
        return res.status(500).json({
            error: 'Station routing failed',
            message: error.message
        });
    }
}

/**
 * Station信息API端点
 * 返回当前用户的Station信息
 */
function getStationInfo(req, res) {
    try {
        const currentConfig = dynamicStationConfig.getCurrentStationConfig();
        
        if (!currentConfig) {
            return res.status(404).json({
                error: 'No station configuration loaded'
            });
        }

        res.json({
            stationId: currentConfig.STATION_ID,
            stationName: currentConfig.STATION_NAME,
            username: currentConfig.USERNAME,
            email: currentConfig.STATION_EMAIL,
            harborUser: currentConfig.HARBOR_USER,
            centralServiceEndpoint: currentConfig.CENTRALSERVICE_ENDPOINT
        });

    } catch (error) {
        console.error('❌ 获取Station信息失败:', error);
        res.status(500).json({
            error: 'Failed to get station information',
            message: error.message
        });
    }
}

/**
 * 所有Station列表API端点
 * 返回所有可用的Station信息
 */
function getAllStations(req, res) {
    try {
        const stations = dynamicStationConfig.getAllStations();
        
        res.json({
            stations: stations,
            total: stations.length
        });

    } catch (error) {
        console.error('❌ 获取所有Station信息失败:', error);
        res.status(500).json({
            error: 'Failed to get all stations',
            message: error.message
        });
    }
}

module.exports = {
    dynamicStationMiddleware,
    getStationInfo,
    getAllStations
};
