const axios = require("axios");
const express = require("express");
const router = express.Router();
const request = require("request");
const Train = require("../models/Train");
const { FLJob, FLJobState, FLPrivacySetting } = require("../models/FLJob");
const FLJobManager = require("../federated/flJobManager");
const { resolveCentralServiceAccessToken } = require("../validation/auth");
const { getAgentOptions } = require("../dind-certs-client");
const { vault } = require("../utils");
const { utility } = require("../utils");
const { environment } = require("../utils");
const { verifyImage } = require("../utils/cosign");

// Dashboard
// Get Docker Information
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

//Returns the train requests for the specified type
function getRequestedJobs(req, res, token, type, callback) {
  let options = {
    url: `${utility.getCSTargetURL()}/api/${type}jobinfo/${
      process.env.STATION_ID
    }`,
    headers: (headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
  };

  request.get(options, function (error, response, body) {
    if (error) {
      console.error(error);
      return res.status(400).send("Error requesting jobs");
    }

    try {
      callback(JSON.parse(body));
    } catch (error) {
      console.error(error);
      return res.status(400).send("Cannot connect to the central service.");
    }
  });
}

/**
 * Reads the label property of the provided docker image
 * @param {*} image The image to read the label from
 * @param {function} callback, gets called with a String with the labels or undefined if the request failed
 */
function readLabelForImage(image, callback) {
  //Use the filter parameter for the /image/ endpoint in the docker API
  //to only return the image we are interested in
  //See: https://docs.docker.com/engine/api/v1.43/#tag/Image
  //Filters are json objects
  const filter = {
    reference: [
      image
    ]
  };

  //Build the request options and uri.
  //The filter object is encoded into a JSON string that will then be URL encoded
  let options = {
    uri: `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}/images/json?all=1&filters=${encodeURIComponent(JSON.stringify(filter))}`,
    method: "GET",
    agentOptions: getAgentOptions(),
  };

  request(options, function (error, response, body) {
    if (error) {
      console.log(error);
      callback(undefined);
    } else {
      let data = JSON.parse(body);
      if (data.length == 0) {
        console.log(`Found no image with name ${image}`);
        callback(undefined);
      } else {
        callback(JSON.stringify(data[0].Labels));
      }
    }
  });
}

/**
 * Parses the ENV Labels from a container and returns
 * @param {*} labels The labels that should be parsed
 * @returns The envVariablelist that can be displayed in the frontend
 */
function parseEnvVarList(labels) {
  let envVariableList = [];

  if (labels) {
    let parsedLabels = JSON.parse(labels);
    if (parsedLabels && parsedLabels.envs)
      envVariableList = JSON.parse(parsedLabels.envs);
  }

  // Validate envs structure
  const input_type_list = ["number", "password", "text", "url", "select"];
  let index = envVariableList.length;
  let containerMount;
  while (index--) {
    const element = envVariableList[index];
    if (!element.name) {
      envVariableList.splice(index, 1);
      continue;
    }

    if (element.name === "BIND_MOUNT_ENV") {
      containerMount = element.value;
      envVariableList.splice(index, 1);
      continue;
    }

    if (!input_type_list.includes(element.type)) {
      envVariableList[index].type = "text";
    }

    if (!element.required) {
      envVariableList[index].required = false;
    }
  }

  return { envVariableList, containerMount };
}

/**
 * @param {function} callback, gets called with the pathlist from vault that can be used for the env variables
 * @returns
 */
function resolveVaultPathList(callback) {
  // key-value version 1 - START
  let kv1Promise = new Promise((resolve) => {
    //Get key-value engines (v1)
    vault.getKeyValueEngines(1).then((result) => {
      let promises = [];
      let kvEnginesVersion1 = result;
      kvEnginesVersion1.forEach((kvEngine) => {
        promises.push(
          new Promise((resolve) => {
            //Traverse all existing paths
            vault.traverse([kvEngine], (paths) => {
              resolve(paths);
            });
          })
        );
      });

      //When all results received
      Promise.all(promises).then((results) => {
        let paths = results.flat();
        //Read keys corresponding to each path
        let pathPromises = paths.map((path) => vault.read(path));
        Promise.all(pathPromises).then((results) => {
          let pathList = [];

          for (let index = 0; index < results.length; index++) {
            if (!results[index]) continue;
            const element = results[index];
            //key-value pairs
            const data = element.data;
            pathList.push(
              Object.keys(data).map((key) => {
                return { path: paths[index], key: key };
              })
            );
          }

          pathList = pathList.flat();
          resolve(pathList);
        });
      });
    });
  });
  // key-value version 1 - END

  // key-value version 2 - START
  let kv2Promise = new Promise((resolve) => {
    //Get key-value engines (v2)
    vault.getKeyValueEngines(2).then((result) => {
      let promises = [];
      let kvEnginesVersion2 = result;
      kvEnginesVersion2.forEach((kvEngine) => {
        promises.push(
          new Promise((resolve) => {
            //Traverse all existing paths (add 'metadata' for api calls)
            vault.traverse([`${kvEngine}metadata/`], (paths) => {
              resolve(paths);
            });
          })
        );
      });

      //When all results received
      Promise.all(promises).then((results) => {
        let paths = results.flat();

        //Replace 'metadata' with 'data' for api calls
        paths = paths.map((path) => {
          path = path.split("/");
          path.splice(1, 1, "data");
          path = path.join("/");
          return path;
        });
        // console.log(paths);
        //Read keys corresponding to each path
        let pathPromises = paths.map((path) => vault.read(path));
        Promise.all(pathPromises).then((results) => {
          let pathList = [];

          for (let index = 0; index < results.length; index++) {
            if (!results[index]) continue;
            const element = results[index];
            //key-value pairs
            const data = element.data.data;
            pathList.push(
              Object.keys(data).map((key) => {
                return { path: paths[index], key: `data.${key}` };
              })
            );
          }

          pathList = pathList.flat();
          resolve(pathList);
        });
      });
    });
  });
  // key-value version 2 - END

  Promise.all([kv1Promise, kv2Promise]).then((results) => {
    callback(results.flat());
  });
}

module.exports = (keycloak) => {
  router.get("/v2/stationInfo", (req, res) => {
    let appVersion;
    try {
      appVersion = require("../version.json").version;
    } catch (error) {
      console.log("Could not load station version from 'version.json'. Using package.json");
      appVersion = require("../package.json").version;
    }

    res.send({ appVersion });
  });

  router.get("/v2/keycloakConfig", (req, res) => {
    res.send({
      realm: process.env.REACT_APP_KC_REALM || "pht",
      url: process.env.REACT_APP_KC_AUTH_SERVER_URL || "https://localhost:8443",
      clientId: process.env.REACT_APP_KC_CLIENT_ID || "pht-web"
    });
  });

  router.get(
    "/v2",
    keycloak.protect(),
    function (req, res, next) {
      if (!req.harbor) {
        req.harbor = { auth: {} };
      }
      let options = getAdminAuthRequestOptions();
      request.post(options, (error, response) => {
        if (error) {
          // Describe the occuring problem better
          if (error.message.includes("EAI_AGAIN")) {
            error.message +=
              " This means that the DNS resolution for the domain menzel.informatik.rwth-aachen.de ist NOT successfull. Most likely, the container has problems accessing the internet. Confirm this by using the command docker exec -it stationdeploymentfiles-pht-web /bin/bash and execute apt update. When the update is not successfull, the container has no working internet connection.";
          }
          return res.status(400).send(error.message);
        }

        if (
          response.statusCode == 200 &&
          typeof response.body != "undefined" &&
          response.body != null
        ) {
          let body = JSON.parse(response.body);
          req.harbor.auth.admin_access_token = body.access_token;
          return next();
        } else {
          console.log(
            "error: ",
            "Cannot Connect to the central authentication server."
          );
          return res
            .status(400)
            .send("Cannot Connect to the central authentication server.");
        }
      });
    },
    function (req, res) {
      resolveCentralServiceAccessToken(req, res, (token) => {
        //Load incremental and federated jobs, if both successfull show in the UI
        console.log("loading incremental job requests");
        getRequestedJobs(req, res, token, "", (incTrains) => {
          //Check if loading incremental jobs was successfull
          if (incTrains == null) {
            console.log("loading incremental job requests failed");
            return;
          }

          console.log("loading federated job requests");
          getRequestedJobs(req, res, token, "federated", async (fedJobs) => {
            //Check if loading federated jobs was successful

            if (fedJobs == null || fedJobs.error != null) {
              console.log("loading federated job requests failed");
              return res.status(400).send("Could not load federated jobs");
            }

            //Filter or the ones that are already pulled locally
            let filteredFedJobs = [];
            for (const job of fedJobs) {
              if (!(await FLJob.exists({ jobid: job.jobid }))) {
                const verifiedStatus = verifyImage(job.learningstoragelocation);
                job['verified'] = verifiedStatus;
                filteredFedJobs.push(job);
              }
            }

            res.send({
              incrementalTrains: incTrains,
              federatedTrains: filteredFedJobs,
            });
          });
        });
      });
    }
  );

  router.get("/images/v2", keycloak.protect(), (req, res) => {
    Train.find({}, function (err, docs) {
      if (err) {
        return res.status(404).send(err.message);
      } else if (docs.length > 0) {
        let options = {
          uri: `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}/images/json?all=1`,
          method: "GET",
          agentOptions: getAgentOptions(),
        };

        request(options, function (error, response, body) {
          if (error) {
            console.log(error);
            return res.status(404).send(error.message);
          } else {
            let data = JSON.parse(body);
            let pull_images = [];
            let push_images = [];
            for (var i = 0; i < data.length; i++) {
              if (data[i].RepoTags == null) {
                continue;
              }
              for (var j = 0; j < data[i].RepoTags.length; j++) {
                if (data[i].RepoTags[j] == "none") {
                  continue;
                }
                for (var k = 0; k < docs.length; k++) {
                  if (
                    docs[k].trainstoragelocation +
                      ":" +
                      docs[k].currentstation ===
                      data[i].RepoTags[j] &&
                    (data[i].ParentId === "" ||
                      (data[i].Labels && data[i].Labels.decrypted))
                  ) {
                    pull_images.push({
                      Id: data[i].Id,
                      RepoTag: data[i].RepoTags[j],
                      JobId: docs[k].jobid,
                      TrainClassId: docs[k].trainclassid,
                      Labels: JSON.stringify(data[i].Labels),
                      pureLabels: data[i].Labels,
                      status: "pulled",
                    });
                    break;
                  }
                  if (
                    docs[k].trainstoragelocation + ":" + docs[k].nextstation ===
                      data[i].RepoTags[j] ||
                    (docs[k].trainstoragelocation +
                      ":" +
                      docs[k].currentstation ===
                      data[i].RepoTags[j] &&
                      data[i].ParentId !== "")
                  ) {
                    push_images.push({
                      Id: data[i].Id,
                      RepoTag: data[i].RepoTags[j],
                      JobId: docs[k].jobid,
                      TrainClassId: docs[k].trainclassid,
                      status: "waiting_to_push",
                    });
                    break;
                  }
                }
              }
            }
            res.send({
              pullImages: pull_images,
              pushImages: push_images,
            });
          }
        });
      } else {
        res.send({
          pullImages: [],
          pushImages: [],
        });
      }
    });
  });

  router.get("/containers/v2", keycloak.protect(), (req, res) => {
    Train.find({}, function (err, docs) {
      if (err) {
        return res.status(404).send(err.message);
      } else if (docs.length > 0) {
        let options = {
          uri: `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}/containers/json?all=1`,
          method: "GET",
          agentOptions: getAgentOptions(),
        };

        request(options, function (error, response, body) {
          if (error) {
            return res.status(404).send(error.message);
          } else {
            let containers = [];
            let data = JSON.parse(body);
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < data[i].Names.length; j++) {
                for (var k = 0; k < docs.length; k++) {
                  if ("/" + docs[k].jobid === data[i].Names[j]) {
                    containers.push({
                      Id: data[i].Id,
                      Name: data[i].Names[j],
                      JobId: docs[k].jobid,
                      Image: data[i].Image,
                      State: data[i].State,
                      Status: data[i].Status,
                      NextTag: docs[k].nextstation,
                      Repo: docs[k].trainstoragelocation,
                      TrainClassId: docs[k].trainclassid,
                    });
                    break;
                  }
                }
              }
            }
            res.send({ containers });
          }
        });
      } else {
        res.send({ containers: [] });
      }
    });
  });

  router.get("/federated/v2", keycloak.protect(), async (req, res) => {
    //Load all jobs from the Db
    var fedJobs = await FLJob.find({});
    res.send(fedJobs);
  });

  /**
   * Reads the label from the image
   */
  router.get(
    "/federated/createContainer/v2",
    keycloak.protect(),
    async (req, res) => {
      const {
        jobid,
        trainclassidlearning,
        learningstoragelocation,
        currentround,
        maxrounds,
        pid,
      } = req.query;

      try {
        //check if vault is available
        await vault.healthStatus();

        readLabelForImage(learningstoragelocation, (labels) => {
          if (labels == undefined) {
            return res
              .status(400)
              .send("Failed to load information from learning image");
          }

          //Parse the envars and result vaul paths, then redirect
          let { envVariableList, containerMount } = parseEnvVarList(labels);
          const hostMount = process.env.HOST_MOUNT_DIRECTORY;
          resolveVaultPathList((pathList) => {
            res.send({
              jobid,
              trainclassidlearning,
              learningstoragelocation,
              currentround,
              maxrounds,
              pid,
              envVariableList,
              paths: pathList,
              hostMount: hostMount || "",
              containerMount: containerMount || "",
            });
          });
        });
      } catch (error) {
        res.status(400).send(error);
      }
    }
  );

  router.post(
    "/federated/startLearning/v2",
    keycloak.protect(),
    async (req, res) => {
      const {
        jobid,
        trainclassidlearning,
        learningstoragelocation,
        currentround,
        maxrounds,
        bindMount,
        shmSize,
        pid,
        envs,
        privacysetting,
      } = req.body;

      const job = await FLJob.findOne({ jobid: jobid });
      if (job !== null && job.state !== FLJobState.WAIT_FOR_ACCEPT) {
        //Job was already started
        console.log(`The job ${jobid} did already start learning.`);
        return res
          .status(400)
          .send(`The job ${jobid} did already start learning.`);
      }

      //Load environment variables
      let env_array;
      try {
        await vault.healthStatus();
        console.log("Creating envs array");
        env_array = await environment.createEnvsArray(envs);
        console.log("Done");
      } catch (error) {
        console.log(`Something went wrong while creating envs array: ${error}`);
        return res.status(500).send();
      }

      let mount = undefined;
      if (bindMount.hostSource && bindMount.containerDestination) {
        //Creates a binding string in the format expected by docker
        mount = `${bindMount.hostSource}:${bindMount.containerDestination}${
          bindMount.readOnly ? ":ro" : ""
        }`;
      }

      let sharedMemSize = 67108864; // 64 MB by default
      if (shmSize && shmSize > 0) {
        sharedMemSize = parseInt(shmSize) * 1048576; // shmSize is in MB, multiply to convert it to Bytes
      }

      //Create new worker
      var manager = new FLJobManager();
      var worker = await manager.createNewWorker(
        jobid,
        pid,
        trainclassidlearning,
        learningstoragelocation,
        currentround,
        maxrounds,
        env_array,
        mount,
        sharedMemSize,
        privacysetting === "inspect-results"
          ? FLPrivacySetting.INSPECT_RESULTS
          : FLPrivacySetting.DO_NOT_INSPECT_RESULTS
      );

      //Start the worker
      worker
        .start()
        .then(async () => {
          console.log(`The job ${jobid} has started learning.`);
          res.status(200).send();
        })
        .catch(async (err) => {
          console.log(`The job ${jobid} could not start learning: ${err}`);
          res.status(500).send();
        });
    }
  );

  router.get("/create/container/v2", keycloak.protect(), (req, res) => {
    const { jobId, image, labels } = req.query;

    //Parse the envars and result vaul paths, then redirect
    let { envVariableList, containerMount } = parseEnvVarList(labels);
    const hostMount = process.env.HOST_MOUNT_DIRECTORY;
    resolveVaultPathList((pathList) => {
      res.send({
        image,
        jobId,
        paths: pathList,
        envVariableList,
        hostMount: hostMount || "",
        containerMount: containerMount || "",
      });
    });
  });

  router.get("/metadata", keycloak.protect(), async (req, res) => {
    const host =
      process.env.METADATAPROVIDER_ENDPOINT || "http://metadataprovider:9988";
    var descriptionList = [];
    var list, useAllowList, stationIdentifier, ready;
    var succeeded = true;
    const t1 = axios
      .get(host + "/descriptionList")
      .then((response) => {
        descriptionList = response.data["descriptionList"];
      })
      .catch((err) => {
        console.log(err);
        succeeded = false;
      });
    const t2 = axios
      .get(host + "/filter")
      .then((response) => {
        list = response.data["list"];
        useAllowList = response.data["useAllowList"];
        console.log("USE ALLOW LIST RESPONSE: " + String(useAllowList));
      })
      .catch((err) => {
        console.log(err);
        succeeded = false;
      });
    const t3 = axios
      .get(host + "/configuration")
      .then((response) => {
        stationIdentifier = response.data["stationIdentifier"];
        ready = response.data["ready"];
      })
      .catch((err) => {
        console.log(err);
        succeeded = false;
      });
    await t1;
    await t2;
    await t3;
    if (succeeded) {
      res.send(200);
    } else {
      console.error("Error while connecting to metadata provider!");
      res.status(400).send("Error while connecting to metadata provider!");
    }
  });

  return router;
};
