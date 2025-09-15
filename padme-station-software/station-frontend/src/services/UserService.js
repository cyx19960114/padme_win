import Keycloak from "keycloak-js";
import axios from "axios";

let _kc = null;
let _authenticated = false;
let _username = null;
let _initPromise = null;

async function getKeycloakConfig() {
  try {
    const response = await axios.get("/dashboard/v2/keycloakConfig");
    console.log("📋 Raw Keycloak config response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch Keycloak config:", error);
    throw error;
  }
}

/**
 * Initializes Keycloak instance and calls the provided
 * callback function if successfully authenticated.
 */
const initKeycloak = async (onAuthenticatedCallback) => {
  // 防止重复初始化
  if (_initPromise) {
    return _initPromise;
  }

  _initPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("🔄 Starting Keycloak initialization...");
      
      const config = await getKeycloakConfig();
      console.log("📋 Keycloak config:", config);
      
      // 验证配置
      if (!config.realm || !config.url || !config.clientId) {
        throw new Error(`Invalid Keycloak config: ${JSON.stringify(config)}`);
      }
      
      _kc = new Keycloak({
        realm: config.realm,
        url: config.url,
        clientId: config.clientId,
      });

      console.log("🚀 Initializing Keycloak with config:", {
        realm: config.realm,
        url: config.url,
        clientId: config.clientId,
      });

      const authenticated = await _kc.init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        promiseType: 'native',
      });

      console.log(`🔐 Keycloak initialization complete. Authenticated: ${authenticated}`);
      
      _authenticated = authenticated;
      
      if (authenticated) {
        _username = _kc.tokenParsed?.preferred_username || null;
        console.log(`✅ User authenticated as: ${_username}`);
        console.log("🎫 Token info:", {
          token: _kc.token ? "Present" : "Missing",
          refreshToken: _kc.refreshToken ? "Present" : "Missing",
          idToken: _kc.idToken ? "Present" : "Missing"
        });
        
        // 设置axios请求头
        if (_kc.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${_kc.token}`;
          console.log("🔧 Authorization header set for axios requests");
        }
        
        // 设置token刷新
        setInterval(() => {
          _kc.updateToken(30).then((refreshed) => {
            if (refreshed) {
              console.log('🔄 Token refreshed');
              axios.defaults.headers.common['Authorization'] = `Bearer ${_kc.token}`;
            } else {
              console.log('✅ Token still valid');
            }
          }).catch((error) => {
            console.error('❌ Token refresh failed:', error);
            _authenticated = false;
            _username = null;
            delete axios.defaults.headers.common['Authorization'];
          });
        }, 60000); // 每分钟检查一次
        
      } else {
        console.log("❌ User is not authenticated");
        _username = null;
        delete axios.defaults.headers.common['Authorization'];
      }
      
      onAuthenticatedCallback();
      resolve(authenticated);
      
    } catch (error) {
      console.error("❌ Keycloak initialization failed:", error);
      _authenticated = false;
      _username = null;
      delete axios.defaults.headers.common['Authorization'];
      onAuthenticatedCallback();
      reject(error);
    }
  });

  return _initPromise;
};

const doLogin = () => {
  console.log("🚀 Initiating login...");
  if (_kc && _kc.login) {
    _kc.login({
      redirectUri: window.location.origin + '/'
    }).catch(error => {
      console.error("❌ Login failed:", error);
    });
  } else {
    console.error("❌ Keycloak not initialized or login method not available");
    console.log("🔍 Keycloak instance:", _kc);
  }
};

const doLogout = () => {
  console.log("🚪 Initiating logout...");
  if (_kc && _kc.logout) {
    // 清理状态
    _authenticated = false;
    _username = null;
    delete axios.defaults.headers.common['Authorization'];
    
    // 执行登出
    _kc.logout({
      redirectUri: window.location.origin + '/'
    }).catch(error => {
      console.error("❌ Logout failed:", error);
    });
  } else {
    console.error("❌ Keycloak not initialized or logout method not available");
    // 手动清理状态
    _authenticated = false;
    _username = null;
    delete axios.defaults.headers.common['Authorization'];
    window.location.reload();
  }
};

const getToken = () => {
  const token = _kc?.token || null;
  console.log(`🎫 Getting token: ${token ? "Present" : "Missing"}`);
  return token;
};

const isLoggedIn = () => {
  // 多重检查确保状态准确
  const kcAuthenticated = _kc?.authenticated || false;
  const hasToken = !!(_kc?.token);
  const internalAuth = _authenticated;
  
  const result = internalAuth && kcAuthenticated && hasToken;
  
  console.log(`🔍 Login status check:`, {
    internal: internalAuth,
    kcAuthenticated: kcAuthenticated,
    hasToken: hasToken,
    result: result
  });
  
  return result;
};

const updateToken = (successCallback) => {
  if (_kc && _kc.updateToken) {
    return _kc.updateToken(5).then(successCallback).catch((error) => {
      console.error("❌ Token update failed:", error);
      doLogin();
    });
  }
  return Promise.reject("Keycloak not initialized");
};

const getUsername = () => {
  const username = _username || _kc?.tokenParsed?.preferred_username || null;
  console.log(`👤 Getting username: ${username}`);
  return username;
};

// 强制刷新认证状态的函数
const refreshAuthStatus = () => {
  if (_kc) {
    console.log("🔄 Refreshing auth status...");
    console.log("🔍 Current KC state:", {
      authenticated: _kc.authenticated,
      token: _kc.token ? "Present" : "Missing",
      tokenParsed: _kc.tokenParsed ? "Present" : "Missing"
    });
    
    if (_kc.authenticated && _kc.token) {
      _authenticated = true;
      _username = _kc.tokenParsed?.preferred_username || null;
      if (_kc.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${_kc.token}`;
      }
      console.log(`✅ Auth status refreshed: ${_username}`);
    } else {
      _authenticated = false;
      _username = null;
      delete axios.defaults.headers.common['Authorization'];
      console.log("❌ Auth status cleared - not authenticated");
    }
  } else {
    console.log("⚠️ Keycloak not initialized yet");
  }
};

// 重置所有状态
const reset = () => {
  console.log("🔄 Resetting UserService...");
  _kc = null;
  _authenticated = false;
  _username = null;
  _initPromise = null;
  delete axios.defaults.headers.common['Authorization'];
};

const UserService = {
  initKeycloak,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  updateToken,
  getUsername,
  refreshAuthStatus,
  reset,
};

export default UserService;