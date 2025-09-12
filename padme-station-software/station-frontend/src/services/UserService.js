import Keycloak from "keycloak-js";
import axios from "axios";

async function getKeycloakConfig() {
  const baseURL = "/";
  const response = await axios.get(`${baseURL}dashboard/v2/keycloakConfig`);
  return response.data;
}

let _kc;

/**
 * Initializes Keycloak instance and calls the provided
 * callback function if successfully authenticated.
 */
const initKeycloak = async (onAuthenticatedCallback) => {
  try {
    const config = await getKeycloakConfig();
    _kc = new Keycloak({
      realm: config.realm,
      url: config.url,
      clientId: config.clientId,
    });

    _kc
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
      })
      .then((authenticated) => {
        if (!authenticated) {
          console.log("user is not authenticated..!");
        }
        onAuthenticatedCallback();
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        // 即使Keycloak失败，也继续加载应用
        onAuthenticatedCallback();
      });
  } catch (error) {
    console.error("Failed to get Keycloak config:", error);
    // 即使配置获取失败，也继续加载应用
    onAuthenticatedCallback();
  }
};

const doLogin = () => _kc.login();

const doLogout = () => _kc.logout();

const getToken = () => _kc.token;

const isLoggedIn = () => !!_kc.token;

const updateToken = (successCallback) =>
  _kc.updateToken(5).then(successCallback).catch(doLogin);

const getUsername = () => _kc.tokenParsed?.preferred_username;

const UserService = {
  initKeycloak,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  updateToken,
  getUsername,
};

export default UserService;
