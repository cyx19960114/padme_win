const config = {
  isDevMode: import.meta.env.DEV,
  apiUrl: import.meta.env.FRONTEND_API_URL,
  keycloak: {
    serverUrl: import.meta.env.FRONTEND_KEYCLOAK_SERVER_URL,
    realm: import.meta.env.FRONTEND_KEYCLOAK_REALM,
    clientId: import.meta.env.FRONTEND_KEYCLOAK_CLIENT_ID,
  },
};

export default config;
