import Keycloak from 'keycloak-js';

import config from '../config';

const keycloakConfig = {
  url: config.keycloak.serverUrl,
  realm: config.keycloak.realm,
  clientId: config.keycloak.clientId,
};

const keycloak = new Keycloak({ ...keycloakConfig });

const initialize = async (onAuthenticatedCallback) => {
  try {
    const authenticated = await keycloak.init({ onLoad: 'login-required' });
    if (authenticated) {
      console.log('Successfully authenticated keycloak. Starting Vite app...');
      onAuthenticatedCallback();
    } else {
      console.warn('Not authenticated, redirecting to login.');
      doLogin();
    }
  } catch (error) {
    console.error(
      'Error initializing Keycloak. Please check the configuration:',
      keycloakConfig,
      error
    );
    alert('Error initializing Keycloak. Please check the console for details.');
  }
};

const doLogin = keycloak.login;

const doLogout = keycloak.logout;

const getToken = () => keycloak.token;

const isLoggedIn = () => !!keycloak.token;

const updateToken = keycloak.updateToken;

const getUsername = () => {
  return keycloak.tokenParsed?.preferred_username;
};

export default {
  initialize,
  doLogin,
  doLogout,
  isLoggedIn,
  getToken,
  updateToken,
  getUsername,
};
