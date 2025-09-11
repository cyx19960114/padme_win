const request = require("request");

// Stuff for the Central Service Token Authentication

var cs_auth_token = "";
var cs_auth_expires = Date.now();

/**
 * Updates the Auhtentcation tokens expire time
 * @param {int} secondsToAdd The seconds to add for the expiration from now
 */
function updateExpireTime(secondsToAdd) {
  cs_auth_expires = new Date(new Date().getTime() + secondsToAdd * 1000);
}

/**
 * @returns the http options needed for authentication at the CS
 */
function getAdminAuthRequestOptions() {
  let authServer = new URL(
    "/auth/realms/pht/protocol/openid-connect/token",
    `https://${process.env.AUTH_SERVER_ADDRESS}`
  );
  authServer.port = process.env.AUTH_SERVER_PORT;
  var options = {
    url: authServer.toString(),
    headers: {
      "Content-Type": "application/json",
    },
    form: {
      grant_type: "password",
      client_id: "central-service",
      username: process.env.HARBOR_USER,
      password: process.env.HARBOR_PASSWORD,
      scope: "openid profile email offline_access",
    },
  };
  return options;
}

/**
 * Returns a Bearer Token for access to the central service apis
 * @param {boolean} forceRefresh Whether a refresh should be forced (can e.g. be used to ensure long running requests are properly authenticated)
 * @param {function} callback Callback function with two parameters: err ("" on success) and data (data contains the token on success)
 */
function resolveCentralServiceAccessTokenCore(forceRefresh, callback) {
  //Check if up to date
  if (!forceRefresh && cs_auth_token != "" && Date.now() < cs_auth_expires) {
    console.log("Using cached token for CS authentication");
    return callback("", cs_auth_token);
  }

  //Get a  new token
  console.log("Requesting new token from auth server");
  let options = getAdminAuthRequestOptions();

  request.post(options, (error, response) => {
    if (error) {
      return callback(error.message, "");
    }

    if (
      response.statusCode == 200 &&
      typeof response.body != "undefined" &&
      response.body != null
    ) {
      console.log("Requesting new token from auth server succeeded");
      let body = JSON.parse(response.body);
      cs_auth_token = body.access_token;
      updateExpireTime(body.expires_in);
      callback("", cs_auth_token);
    } else {
      callback("Cannot connect to the central authentication server.", "");
    }
  });
}

/**
 * Returns a Bearer Token for access to the central service apis
 * @param {*} req The curren http request, used for showing errors
 * @param {*} res The current result, used for error redrection when needed
 * @param {*} callback Gets called on request success
 * @returns A bearer token
 */
function resolveCentralServiceAccessToken(req, res, callback) {
  resolveCentralServiceAccessTokenCore(false, (err, token) => {
    if (err) {
      console.log("error: ", err);
      req.flash("error_msg", err);
      res.redirect("/error");
      return;
    }
    callback(token);
  });
}

module.exports = {
  resolveCentralServiceAccessToken,
  resolveCentralServiceAccessTokenCore,
};
