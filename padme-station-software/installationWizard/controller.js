// exports factory

const { decrypt, validateRsaKeyPair } = require("./token_crypt");
const {
  keyGenerator,
  EXPORT_OPTIONS_PRIVATE,
  EXPORT_OPTIONS_PUBLIC,
} = require("./keyGeneration");
const base64Util = require("../utils/base64");
const requestPromise = require("request-promise");
const { setupMetadata, setFilter, setRemoteKey } = require("./metadata_setup");

const authServerAddr = process.env.AUTH_SERVER_ADDRESS;
const authServerPort = process.env.AUTH_SERVER_PORT;

// request options for keycloak authentication
const getKeycloakAuthenticationRequestOptions = (username, password) => {
  let authServer = new URL(
    "/auth/realms/pht/protocol/openid-connect/token",
    `https://${authServerAddr}`
  );

  authServer.port = authServerPort;

  let options = {
    method: "POST",
    url: authServer.toString(),
    headers: {
      "Content-Type": "application/json",
    },
    form: {
      grant_type: "password",
      client_id: "central-service",
      username: username,
      password: password,
      scope: "openid profile email offline_access",
    },
  };

  return options;
};

// request options to share public key with the central service
const getSharingPublicKeyWithCenterRequestOptions = (
  accessToken,
  publicKey
) => {
  //'Lazy' load util here. Otherwise the controller tests fail
  const { utility } = require("../utils");

  // base64 encoding
  let publicKeyBase64 = base64Util.encode(publicKey);

  let endpoint = new URL(`${utility.getCSTargetURL()}/api/stations/publickey`);
  endpoint.port = process.env.CENTRALSERVICE_PORT;

  let options = {
    method: "POST",
    url: endpoint.toString(),
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      publicKey: publicKeyBase64,
    }),
  };

  console.log(options);
  return options;
};

// send the station public key with the central service
const sharePublicKeyWithCenter = async (username, password, publicKey) => {
  try {
    // get an access token from the center
    const keycloakAuthReqOptions = getKeycloakAuthenticationRequestOptions(
      username,
      password
    );
    const keycloakAuthReqResult = await requestPromise(keycloakAuthReqOptions);
    const accessToken = JSON.parse(keycloakAuthReqResult)["access_token"];

    const sharingPublicKeyWithCenterReqOpts =
      getSharingPublicKeyWithCenterRequestOptions(accessToken, publicKey);
    const sharingPublicKeyWithCenterResult = await requestPromise(
      sharingPublicKeyWithCenterReqOpts
    );

    console.log(sharingPublicKeyWithCenterResult);

    return Promise.resolve();
  } catch (error) {
    console.log(error);
    return Promise.reject();
  }
};

const validateCustomRsaKeyPair = async (publicKey, privateKey) => {
  try {
    await validateRsaKeyPair(publicKey, privateKey);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = (configurationManager) => {
  // message queue
  let messages = [];
  let otp = "";

  async function confupload(req, res) {
    messages.push("Upload Started...");
    if (!req.files) {
      return res.sendStatus(400);
    } else {
      const envfile = req.files.envfile;
      // notify
      messages.push("File Uploaded with md-5 hash:" + String(envfile.md5));
      try {
        console.log("Start encrypting with otp:" + String(otp));
        decryptedVal = decrypt(envfile.data, otp);
        configurationManager.envconfiguration = decryptedVal.toString();
      } catch (e) {
        console.log(e);
        messages.push("Error while decrypting file");
        return res.sendStatus(400);
      }
      try {
        messages.push("Perform sanity checks on configuration...");
        await configurationManager.envconfigurationSanityCheck();
        messages.push("Sanity check complete.");
        messages.push("File decrypted");
      } catch (e) {
        console.log(e);
        messages.push("Error while file decryption. Is the password correct?");
        res.sendStatus(400);
        return;
      }
      return res.sendStatus(200);
    }
  }

  async function fetchHarborCredentials(req, res) {
    try {
      const { username, password } =
        configurationManager.getHarborUsernameAndPassword();

      return res
        .status(200)
        .send({ username, password, authServerAddr, authServerPort });
    } catch (error) {
      console.log(error);
      console.log(
        "A reason for this error can be that no 'env' file was provided"
      );
      return res
        .status(400)
        .send("Error might be due to an invalid 'env' file provided");
    }
  }

  async function uploadAndDecrypt(req, res) {
    const otpExists = req.body.hasOwnProperty("otp") && req.body.otp !== "";
    if (!otpExists) {
      return res
        .status(400)
        .send("'otp' required for decryption and must not be empty!");
    }

    messages.push("Password has been transmitted...", "Upload Started...");

    if (!req.files) {
      messages.push("No file specified...");
      return res.status(400).send("'env' file required for decryption!");
    }

    const password = req.body.otp;
    const envfile = req.files.envfile;
    messages.push("File Uploaded with md-5 hash:" + String(envfile.md5));

    try {
      console.log(`Starting decryption with OTP: ${String(password)}`);
      messages.push(
        `Starting decryption for '${envfile.name}' file with provided OTP...`
      );

      const decryptedVal = decrypt(envfile.data, password);
      configurationManager.envconfiguration = decryptedVal.toString();
    } catch (e) {
      console.log(e);
      messages.push("Error while decrypting file");
      return res.status(400).send("Error while decrypting file");
    }

    try {
      messages.push("Perform sanity checks on configuration...");
      await configurationManager.envconfigurationSanityCheck();
      messages.push("Sanity check complete", "File decrypted!");
      console.log("Decryption complete!");
    } catch (e) {
      console.log(e);
      messages.push("Error while file decryption! Is the password correct?");
      return res.status(400).send("Error while file decryption");
    }

    messages.push("Step completed, please proceed now to the next step.");
    return res.status(200).send("File decrypted successfully");
  }

  // a hook for getting messages
  // simple but enough for this use case
  async function messageHook(req, res) {
    if (messages.length > 0) {
      const messageCopy = messages;
      messages = [];
      return res.send({ messages: messageCopy });
    } else {
      return res.send({ messages: [] });
    }
  }

  async function setHarborPassword(req, res) {
    if (!("newPassword" in req.body)) {
      res.sendStatus(400);
      return;
    }
    const { newPassword } = req.body;

    // validate the new password (try to log into the center(keycloak) with provided credentials)
    const { username } = configurationManager.getHarborUsernameAndPassword();
    let options = getKeycloakAuthenticationRequestOptions(
      username,
      newPassword
    );

    // Try logging in to keycloak
    try {
      let requestResult = await requestPromise(options);
      console.log(requestResult);
    } catch (ex) {
      console.log(ex);
      const message = ex?.error
        ? JSON.parse(ex.error).error_description
        : "Unable to login keycloak";
      return res.status(ex.statusCode || 500).send(message);
    }

    configurationManager.updateHarborPassword(newPassword);
    res.sendStatus(200);
  }

  // a hook for generating a key-pair
  async function generateKeys(req, res) {
    console.log("Generating keys...");
    keyGenerator().then(async (key_res) => {
      const { pub, priv } = key_res;
      configurationManager.publicKey = pub.export(EXPORT_OPTIONS_PUBLIC);
      configurationManager.privateKey = priv.export(EXPORT_OPTIONS_PRIVATE);
      console.log("Keys generated!");

      // share the public key with the center
      try {
        const { username, password } =
          configurationManager.getHarborUsernameAndPassword();

        await sharePublicKeyWithCenter(
          username,
          password,
          configurationManager.publicKey
        );
      } catch (error) {
        console.log(error);
        return res.sendStatus(500);
      }

      res.send({ publicKey: configurationManager.publicKey });
    });
  }

  // a hook for submitting own key pair
  async function submitKeys(req, res) {
    if (!("privateKey" in req.body && "publicKey" in req.body)) {
      return res.sendStatus(400);
    }

    const { privateKey, publicKey } = req.body;
    console.log("Received key-pair with public key:" + String(publicKey));

    try {
      await validateCustomRsaKeyPair(String(publicKey), String(privateKey));
    } catch (error) {
      console.log("Error validating custom RSA key-pair", error);
      return res.sendStatus(500);
    }

    configurationManager.publicKey = String(publicKey);
    configurationManager.privateKey = String(privateKey);

    // share the public key with the center
    try {
      const { username, password } =
        configurationManager.getHarborUsernameAndPassword();

      await sharePublicKeyWithCenter(
        username,
        password,
        configurationManager.publicKey
      );
    } catch (error) {
      console.log(error);
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  }

  async function configComplete(req, res) {
    console.log("Configuration did end...");
    configurationManager.configurationDidEnd();
    res.sendStatus(200);
  }

  async function setFilterHandler(req, res) {
    const { list, use_as_allow_list } = req.body;
    await setFilter(list, use_as_allow_list);
    res.sendStatus(200);
  }

  async function getPreconfiguredStationIRI(req, res) {
    // handler for returning the predefined station iri if there is one
    res.send({
      station_iri: configurationManager.get_station_iri(),
    });
  }

  async function metadataGeneralSetup(req, res) {
    if (!("secret_key" in req.body && "station_iri" in req.body)) {
      return res.sendStatus(400);
    }
    const { secret_key, station_iri } = req.body;
    console.log("Received station iri:" + station_iri);
    const provider_setup_successful = await setupMetadata(
      station_iri,
      secret_key
    );
    console.log("Send key to metadata store...");
    const token = configurationManager.get_metadata_token();
    var store_setup_successful = false;
    if (token == "") {
      console.warn(
        "No single use token in env file, skipping metadata store key setup..."
      );
    } else {
      store_setup_successful = await setRemoteKey(token, secret_key);
    }

    res.send({
      store_setup_successful,
      provider_setup_successful,
    });
  }

  return {
    confupload,
    fetchHarborCredentials,
    uploadAndDecrypt,
    messageHook,
    setHarborPassword,
    generateKeys,
    submitKeys,
    getPreconfiguredStationIRI,
    metadataGeneralSetup,
    configComplete,
    setFilterHandler,
  };
};
