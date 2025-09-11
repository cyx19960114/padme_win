const os = require("os");
const fs = require("fs");
const path = require("path");
const request = require("request");
const { getAgentOptions } = require("../../dind-certs-client");

const getTempDir = (dirPath, empty) => {
  // empty : if it already exists, remove all old files

  const tempDirPath = path.join(os.tmpdir(), dirPath);

  try {
    fs.mkdirSync(tempDirPath, { recursive: true });
    return tempDirPath;
  } catch (error) {
    if (error.code === "EEXIST") {
      console.log(`${tempDirPath} already exists...`);

      if (empty) {
        try {
          fs.rmdirSync(tempDirPath, { recursive: true });
          fs.mkdirSync(tempDirPath, { recursive: true });
        } catch (error) {
          console.log(error);
          return null;
        }
      }

      return tempDirPath;
    } else {
      console.log(error);
      return null;
    }
  }
};

const removeJobTempDir = (jobId) => {
  const tempDirPath = getTempDir(jobId);
  fs.rmdirSync(tempDirPath, { recursive: true });
};

const removeContainerTempDir = (jobId, container) => {
  const tempDirPath = getTempDir(path.join(jobId, container));
  fs.rmdirSync(tempDirPath, { recursive: true });
};

const getJobTempDir = (jobId, empty) => {
  const tempDirPath = getTempDir(jobId, empty);
  return tempDirPath;
};

const getTempContainerTarArchiveFileName = () => {
  const tempContainerTarArchiveFileName = "container.tar";
  return tempContainerTarArchiveFileName;
};

const getTempContainerTarArchiveSubPath = (
  jobId,
  container,
  beforeOrAfterExecution
) => {
  console.log(jobId, container, beforeOrAfterExecution);

  var executionStateDirName = null;
  if (beforeOrAfterExecution === "before") {
    executionStateDirName = "before";
  } else if (beforeOrAfterExecution === "after") {
    executionStateDirName = "after";
  }

  const tempContainerTarArchiveFilePath = path.join(
    jobId,
    container,
    executionStateDirName
  );
  return tempContainerTarArchiveFilePath;
};

const getEncryptedTarArchiveFileName = () => {
  const encryptedTarArchiveFileName = "file.enc";
  return encryptedTarArchiveFileName;
};

const getEncryptedTarArchiveFilePathInContainer = () => {
  const encryptedTarArchiveFileName = getEncryptedTarArchiveFileName();
  const encryptedTarArchiveFilePathInContainer = path.join(
    "/",
    encryptedTarArchiveFileName
  );
  return encryptedTarArchiveFilePathInContainer;
};

const getPrevChangesFileName = () => {
  const prevChangesFileName = "changes";
  return prevChangesFileName;
};

/**
 * Returns false if the provided string is not a json string and the json object otherwise
 * @param {*} jsonString
 * @returns
 */
const tryParseJSONObject = (jsonString) => {
  try {
    var o = JSON.parse(jsonString);

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return false;
};

/**
 * Pulls the provided image and tag via docker
 * @param {*} req
 * @param {*} res
 * @param {*} image
 * @param {*} tag
 * @param {*} successCallback
 * @param {*} failureCallback
 */
const pullImage = (req, res, image, tag, successCallback, failureCallback) => {
  //Build url for dind
  let url = `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}/images/create?fromImage=${image}`;

  if (tag) url += "&tag=" + tag;

  var auth = {
    username: process.env.HARBOR_USER,
    password: process.env.HARBOR_CLI,
    email: process.env.HARBOR_EMAIL,
  };
  var authInfo = Buffer.from(JSON.stringify(auth)).toString("base64");
  var options = {
    uri: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Registry-Auth": authInfo,
    },
    json: {},
    agentOptions: getAgentOptions(),
  };

  let body = Buffer.from("");
  request(options)
    .on("error", async (err) => {
      console.log("error: ", err);
      req.flash("error_msg", err);
      res.status(500).send();
    })
    .on("data", async (data) => {
      //Docker sends a json object with {message:} when an error occurs
      //We cannot send this data as as stream because then the request will
      //appear successful even tough it is in fact not (send will set status = 200)
      if (body.length == 0) {
        //Only on first data needed since this will be a error message
        let errorTest = tryParseJSONObject(data.toString("utf-8"));
        if (!errorTest || (errorTest && !errorTest.message)) {
          //No error - save to send data
          body = Buffer.concat([body, data]);
          res.write(data);
        }
      } else {
        body = Buffer.concat([body, data]);
        res.write(data);
      }
    })
    .on("complete", async (response) => {
      if (response.statusCode == 200) {
        console.log("complete - success");
        successCallback();
      } else {
        console.log("complete - failed");
        failureCallback(body.toString("utf-8") || "Internal Server Error");
      }
    });
};

module.exports = {
  getTempDir,
  removeJobTempDir,
  removeContainerTempDir,
  getJobTempDir,
  getTempContainerTarArchiveFileName,
  getTempContainerTarArchiveSubPath,
  getEncryptedTarArchiveFileName,
  getEncryptedTarArchiveFilePathInContainer,
  getPrevChangesFileName,
  pullImage,
};
