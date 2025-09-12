var Keycloak = require("keycloak-connect");
const { getEnvOrThrow } = require('./../utils/environment');

let _keycloak;

var keycloakConfig = {
  clientId: "central-service-backend",
  bearerOnly: true,
  serverUrl: `http://${getEnvOrThrow("AUTH_SERVER_ADDRESS")}:${getEnvOrThrow("AUTH_SERVER_PORT")}`,
  realm: "pht"
};

function initKeyCloak(memoryStore) {
  if (_keycloak) {
    console.warn("Trying to intialize Keycloak again!");
    return _keycloak;
  } else {
    console.log("Initializing Keycloak...");
    _keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
    return _keycloak;
  }
}

function getKeycloak() {
  if (!_keycloak) {
    console.error(
      "Keycloak has not been initialized. Please call init first!."
    );
  }
  return _keycloak;
}

module.exports = { initKeyCloak, getKeycloak };
