import Keycloak from "keycloak-js";

const _kc = new Keycloak({
  realm: "pht",
  url: `https://${process.env.REACT_APP_AUTH_SERVER_ADDRESS}/auth`,
  clientId: "central-service",
});

/**
 * Initializes Keycloak instance and calls the provided
 * callback function if successfully authenticated.
 */
const initKeycloak = (onAuthenticatedCallback) => {
  _kc
    .init({
      onLoad: "login-required",
    })
    .then((authenticated) => {
      if (!authenticated) {
        console.log("user is not authenticated..!");
      }
      onAuthenticatedCallback();
    })
    .catch(console.error);
};

const doLogin = _kc.login;

const doLogout = _kc.logout;

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
