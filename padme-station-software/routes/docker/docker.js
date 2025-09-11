const fs = require("fs");
const path = require("path");
const tar = require("tar");
const tarStream = require("tar-stream");
const { Readable } = require("stream");
const { spawn, spawnSync } = require("child_process");
const diff2Html = require("diff2html");
const requestPromise = require("request-promise");
const express = require("express");
const router = express.Router();
const request = require("request");

const Train = require("../../models/Train");
const { FLStatusUpdates } = require("../../federated/flConstants.js");
const TransactionLog = require("../../models/TransactionLog");
const { getAgentOptions } = require("../../dind-certs-client");
const {
  utility,
  vault,
  trainConfigUtil,
  cryptoUtil,
  environment,
} = require("../../utils");
const {
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
} = require("./helpers");
const {
  make_iri_with_jobid,
  notifyMetadataProviderImageFinished,
  notifyMetadataProviderImageFinishedDownloading,
  notifyMetadataProviderImageRejected,
  notifyMetadataProviderImageStartedDownloading,
  notifyMetadataProviderImageStartedRunning,
} = require("../../utils/MetadataNotifier");
const { resolveCentralServiceAccessToken } = require("../../validation/auth");
const { DockerClient } = require("../../client");

const dockerContainerChangesKind = { 0: "Modified", 1: "Added", 2: "Deleted" };
const DOCKER_URL = `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}`;

module.exports = (keycloak) => {
  router.get(
    "/image/pullfederated/v2",
    keycloak.protect(),
    async function (req, res) {
      const { learningstoragelocation } = req.query;

      try {
        //Ensure vault is healty (needed later)
        await vault.healthStatus();
      } catch (error) {
        console.log("error: ", error);
        return res.status(500).send(error);
      }

      //TODO: Replace with the actual train storagelocation
      pullImage(
        req,
        res,
        learningstoragelocation,
        null,
        async function () {
          //Success
          res.end();
        },
        (message) => {
          //Failure
          console.log("error: ", message);
          res.status(500).send(message);
        }
      );
    }
  );

  router.get("/image/pull/v2", keycloak.protect(), async function (req, res) {
    const {
      user,
      jobid,
      trainstoragelocation,
      trainclassid,
      currentstation,
      nextstation,
    } = req.query;

    const train_iri = make_iri_with_jobid(jobid);
    notifyMetadataProviderImageStartedDownloading(train_iri, new Date());

    pullImage(
      req,
      res,
      trainstoragelocation,
      currentstation,
      async function () {
        //Success
        try {
          // save pulled job information on local db
          const train = {
            jobid: jobid,
            trainstoragelocation: trainstoragelocation,
            trainclassid: trainclassid,
            currentstation: currentstation,
            nextstation: nextstation,
            train_iri: train_iri,
          };
          // Insert or Update - If a job with the provided jobid exists, it will update - update: When a job visit the station more than once
          await Train.findOneAndUpdate({ jobid: jobid }, train, {
            upsert: true, // Make this update into an upsert
          });

          // log
          TransactionLog.create({
            user,
            logMessage: `Image ${trainstoragelocation}:${currentstation} pulled`,
          });

          // metadata service
          notifyMetadataProviderImageFinishedDownloading(train_iri, new Date());

          // create an empty temp directory - later is used for inspect changes, encryption, and decryption
          const tempDirPath = getJobTempDir(jobid, true);
          res.end(
            `Image ${trainstoragelocation}:${currentstation} has been pulled.`
          );
        } catch (err) {
          console.log("error: ", err);
          res.end();
        }
      },
      (message) => {
        //Failure
        console.log("error: ", message);
        res.end();
      }
    );
  });

  // Reject Train requests
  router.post(
    "/train/reject/v2",
    keycloak.protect(),
    async function (req, res) {
      const { user, jobid, mode, reason, comment } = req.body;

      let rejectMessage = comment;
      if (reason === "1") {
        rejectMessage = "No anonymity";
      }
      if (reason === "2") {
        rejectMessage = "No access right";
      }

      resolveCentralServiceAccessToken(req, res, (token) => {
        const headers = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        };

        let options;
        if (mode == "federated") {
          console.log(`rejecting federated job with id ${jobid}`);

          options = {
            url: `${utility.getCSTargetURL()}/api/federatedjobinfo/${
              process.env.STATION_ID
            }/${jobid}/status`,
            body: JSON.stringify({
              status: FLStatusUpdates.REJECTED,
              message: rejectMessage,
            }),
            ...headers,
          };
        } else {
          console.log(`rejecting incremental job with id ${jobid}`);
          options = {
            url: `${utility.getCSTargetURL()}/api/jobinfo/reject`,
            body: JSON.stringify({
              jobID: jobid,
              rejectMessage,
            }),
            ...headers,
          };
        }

        request.post(options, function (error, response, body) {
          if (error) {
            return res.status(400).send(error.message);
          }
          if (response.statusCode != 200) {
            return res
              .status(response.statusCode)
              .send("Failed to reject job, server returned error status");
          }

          // Log
          TransactionLog.create({
            user,
            logMessage: "Train rejected with jobID:" + String(jobid),
          });

          // Notify Metadata Provider
          notifyMetadataProviderImageRejected(
            make_iri_with_jobid(jobid),
            rejectMessage,
            new Date()
          );

          res.send(`The job ${jobid} has been rejected.`);
        });
      });
    }
  );

  router.get("/image/remove/v2", keycloak.protect(), function (req, res) {
    const { user, jobId, image } = req.query;

    var options = {
      uri: `${DOCKER_URL}/images/${image}?force=true`,
      method: "DELETE",
      agentOptions: getAgentOptions(),
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }
      if (response.statusCode == 200) {
        TransactionLog.create({
          user,
          logMessage: `Image ${image} has been removed.`,
        });

        // remove temp direcotry
        removeJobTempDir(jobId);

        res.send(`Image ${image} has been removed.`);
      } else {
        console.error(body);
        return res.status(400).send(body);
      }
    });
  });

  router.get("/image/push/v2", keycloak.protect(), function (req, res) {
    const { user, image } = req.query;

    var auth = {
      username: process.env.HARBOR_USER,
      password: process.env.HARBOR_CLI,
      email: process.env.HARBOR_EMAIL,
    };
    var authInfo = Buffer.from(JSON.stringify(auth)).toString("base64");
    var options = {
      uri: `${DOCKER_URL}/images/${image}/push`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Registry-Auth": authInfo,
      },
      json: {},
      agentOptions: getAgentOptions(),
    };

    request(options, async (error, response, body) => {
      if (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }
      if (response.statusCode == 200) {
        // DELETE image after push (to Harbor)
        var options = {
          uri: `${DOCKER_URL}/images/${image}?force=true`,
          method: "DELETE",
          agentOptions: getAgentOptions(),
        };
        request(options, (error, response, body) => {
          if (error) {
            return res.status(400).send(error.message);
          }
          if (response.statusCode == 200) {
            TransactionLog.create({
              user,
              logMessage: `Image ${image} has been pushed.`,
            });

            res.send(`Image ${image} has been pushed.`);
          } else {
            console.error(body);
            return res.status(400).send(body);
          }
        });
      } else {
        console.error(body);
        return res.status(400).send(body);
      }
    });
  });

  router.get("/image/decrypt/v2", keycloak.protect(), async (req, res) => {
    const { jobId, image } = req.query;

    const tempDirPath = getJobTempDir(jobId);
    const encryptedTarArchiveFileName = getEncryptedTarArchiveFileName();
    const encryptedTarArchiveFilePathInContainer =
      getEncryptedTarArchiveFilePathInContainer();

    let tempContainerId = null;
    let extractPath = null;

    // list of files added to the base image on decryption process
    let changes = [];
    let trainConfig = trainConfigUtil.getTrainConfigJsonBaseModel();

    try {
      // check vault health status
      await vault.healthStatus();

      // create a temp container
      let createTempContainerOptions = {
        uri: `${DOCKER_URL}/containers/create`,
        method: "POST",
        json: { Image: image },
        agentOptions: getAgentOptions(),
      };

      let createTempContainerResult = await requestPromise(
        createTempContainerOptions
      );

      tempContainerId = createTempContainerResult.Id;
      extractPath = getTempDir(path.join(jobId, tempContainerId), true);

      try {
        // HEAD - check the existence of the train_config file
        let trainConfigFilePathInContainer =
          trainConfigUtil.getTrainConfigFilePathInContainer();

        let trainConfigFileHeadArchiveOptions = {
          uri: `${DOCKER_URL}/containers/${tempContainerId}/archive?path=${trainConfigFilePathInContainer}`,
          method: "HEAD",
          agentOptions: getAgentOptions(),
        };

        await requestPromise(trainConfigFileHeadArchiveOptions);

        // GET - download and extract train_config file from the temp container (docker api provides tar archive)
        let trainConfigFileGetArchiveOptions = {
          uri: `${DOCKER_URL}/containers/${tempContainerId}/archive?path=${trainConfigFilePathInContainer}`,
          method: "GET",
          agentOptions: getAgentOptions(),
          transform: (body) => Readable.from([body]),
        };

        let trainConfigFileGetArchiveResult = await requestPromise(
          trainConfigFileGetArchiveOptions
        );

        // untar train_config
        trainConfig = await trainConfigUtil.unTarTrainConfigJson(
          trainConfigFileGetArchiveResult
        );

        if (
          trainConfig.hasOwnProperty(
            trainConfigUtil.train_config_constant["symmetric_key"]
          ) &&
          trainConfig[trainConfigUtil.train_config_constant["symmetric_key"]]
        ) {
          const encryptedSymmetricKey =
            trainConfig[trainConfigUtil.train_config_constant["symmetric_key"]];

          const decryptedSymmetricKey =
            await trainConfigUtil.decryptSymmetricKey(encryptedSymmetricKey);

          const symmetricKeyBackup = cryptoUtil.getVaultSymmetricKeyBackupModel(
            jobId,
            decryptedSymmetricKey,
            null,
            { isBase64: true }
          );

          // restore symmetric key to vault
          const symmetricKeyName = jobId;
          await vault.command.write(`transit/restore/${jobId}`, {
            backup: symmetricKeyBackup,
            name: symmetricKeyName,
            // force the restore to proceed even if a key by this name already exists.
            force: true,
          });

          // HEAD - check the existence of the encrypted file
          let headArchiveOptions = {
            uri: `${DOCKER_URL}/containers/${tempContainerId}/archive?path=${encryptedTarArchiveFilePathInContainer}`,
            method: "HEAD",
            agentOptions: getAgentOptions(),
          };
          await requestPromise(headArchiveOptions);

          // GET - download and extract encrypted file from the temp container (docker api provides tar archive)
          await new Promise((resolve, reject) => {
            let options = {
              uri: `${DOCKER_URL}/containers/${tempContainerId}/archive?path=${encryptedTarArchiveFilePathInContainer}`,
              method: "GET",
              agentOptions: getAgentOptions(),
            };

            request(options)
              .pipe(
                tar.extract({
                  cwd: extractPath,
                  sync: true,
                })
              )
              .on("finish", () => {
                resolve();
              })
              .on("error", (error) => {
                console.log(error);
                reject(error);
              });
          }).catch((error) => {
            console.log(error);
            reject(error);
          });

          // read ciphertext
          const encryptedTarArchiveFilePath = path.join(
            extractPath,
            encryptedTarArchiveFileName
          );
          const ciphertext = fs.readFileSync(
            encryptedTarArchiveFilePath,
            "utf8"
          );

          // decrypt
          const decryptionResult = await vault.write(
            `transit/decrypt/${symmetricKeyName}`,
            { ciphertext: ciphertext }
          );
          const plaintextEncoded = decryptionResult.data.plaintext;

          // base64 decode - a tar archive file
          const plaintext = Buffer.from(plaintextEncoded, "base64");

          // List the contents of a tar archive
          const plaintextStream = Readable.from(plaintext);
          let extractListOfContents = tarStream.extract();
          extractListOfContents
            .on("entry", function (header, stream, next) {
              // header is the tar header
              // stream is the content body (might be an empty stream)
              // call next when you are done with this entry

              // clear stream - just file name is enough
              if (header.type == "file") {
                changes.push(header.name);
                stream = Readable.from("");
              }

              stream.on("end", function () {
                next(); // ready for next entry
              });

              stream.resume(); // just auto drain the stream
            })
            .on("finish", function () {
              // all entries read
            });
          plaintextStream.pipe(extractListOfContents);

          // put decrypted file into the container
          let putArchiveOptions = {
            uri: `${DOCKER_URL}/containers/${tempContainerId}/archive?path=/`,
            method: "PUT",
            agentOptions: getAgentOptions(),
            body: plaintext,
          };
          await requestPromise(putArchiveOptions);
        }
      } catch (error) {
        console.log("Decryption requirements are not complete.", error);
        return res.status(400).send(utility.stringifyErrorMsg(error));
      }

      // COMMIT temp container
      // set repo and tag from image name
      const lastIndexOfColon = image.lastIndexOf(":");
      const repo = image.substring(0, lastIndexOfColon);
      const tag = image.substring(lastIndexOfColon + 1);

      let commitTempContainerOptions = {
        uri: `${DOCKER_URL}/commit?container=${tempContainerId}&repo=${repo}&tag=${tag}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        json: {
          Labels: {
            decrypted: "true",
          },
        },
        agentOptions: getAgentOptions(),
      };

      await requestPromise(commitTempContainerOptions);
      res.send(`Image ${image} has been decrypted.`);
    } catch (error) {
      console.log(error);
      res.status(400).send(utility.stringifyErrorMsg(error));
    } finally {
      if (tempContainerId) {
        // DELETE temp container
        var deleteTempContainerOptions = {
          uri: `${DOCKER_URL}/containers/${tempContainerId}`,
          method: "DELETE",
          agentOptions: getAgentOptions(),
        };

        request(deleteTempContainerOptions, (error, response, body) => {
          if (error) {
            console.error(error);
          }
          if (body) {
            console.error(body);
          }
        });
      }

      if (extractPath) {
        // DELETE extraction directory
        fs.rm(extractPath, { recursive: true, force: true }, (err) => {
          if (err) console.log(err);
        });
      }

      // store list of decrypted files
      const prevChangesFileName = getPrevChangesFileName();
      const prevChangesFilePath = path.join(tempDirPath, prevChangesFileName);
      fs.writeFileSync(prevChangesFilePath, JSON.stringify(changes));

      const trainConfigFileName = trainConfigUtil.getTrainConfigFileName();
      const trainConfigFilePath = path.join(tempDirPath, trainConfigFileName);
      fs.writeFileSync(trainConfigFilePath, JSON.stringify(trainConfig));
    }
  });

  // ***** TEMP CODE - DOWNLOAD IMAGE AS A TAR ARCHIVE FILE - START *****
  router.get("/image/export", keycloak.protect(), async (req, res) => {
    const { image } = req.query;
    let options = {
      uri: `${DOCKER_URL}/images/${image}/get`,
      method: "GET",
      agentOptions: getAgentOptions(),
    };

    request(options)
      .on("error", async (err) => {
        console.log("error: ", err);
        res.status(500).send(err);
      })
      .on("response", async (response) => {
        if (response.statusCode == 200) {
          let fileName = `${image}.tar`;
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/x-tar");
        } else {
          let fileName = "error.json";
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/json");
        }
      })
      .on("data", async (data) => {
        res.write(data);
      })
      .on("complete", async (response) => {
        res.end();
      });
  });

  // Create Container
  router.post("/container/create/v2", keycloak.protect(), async (req, res) => {
    const { user, jobId, image, envs, bindMount, shmSize } = req.body;

    let env_array = undefined;
    try {
      env_array = await environment.createEnvsArray(envs);
    } catch (error) {
      return res.status(400).send(error?.message || "Something went wrong");
    }

    // add the station id to the environment variables
    if (process.env.STATION_ID) {
      env_array.push(`STATION_ID=${process.env.STATION_ID}`);
    }
    let options = {
      uri: `${DOCKER_URL}/containers/create?name=${jobId}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      json: {
        Image: image,
      },
      agentOptions: getAgentOptions(),
    };

    if (env_array.length) {
      options.json["Env"] = env_array;
    }

    options.json["HostConfig"] = {};

    if (bindMount.hostSource && bindMount.containerDestination) {
      options.json["HostConfig"] = {
        Mounts: [
          {
            Target: bindMount.containerDestination,
            Source: bindMount.hostSource,
            Type: "bind",
            ReadOnly: bindMount.readOnly == "on",
          },
        ],
      };
    }

    if (shmSize && shmSize > 0) {
      options.json["HostConfig"].ShmSize = parseInt(shmSize);
    }

    // Bind Vault clinet certs to train
    // if (true) {
    //     options.json["HostConfig"] = {
    //         "Binds": ["/pht-vault-certs-client:/certs:ro"]
    //     }
    // }

    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }

      if (response.statusCode == 201) {
        // make a backup from the container before its execution - path: <os_temp_dir>/<job_id>/<container_id>/before/container.tar
        try {
          const container = body.Id.substring(0, 13);
          const tempContainerTarArchiveFileName =
            getTempContainerTarArchiveFileName();
          const tempContainerTarArchiveSubPath =
            getTempContainerTarArchiveSubPath(jobId, container, "before");
          const tempContainerTarArchiveFilePath = path.join(
            getTempDir(tempContainerTarArchiveSubPath, true),
            tempContainerTarArchiveFileName
          );

          let options = {
            uri: `${DOCKER_URL}/containers/${container}/export`,
            method: "GET",
            agentOptions: getAgentOptions(),
          };

          request(options)
            .pipe(fs.createWriteStream(tempContainerTarArchiveFilePath))
            .on("finish", () => {
              TransactionLog.create({
                user,
                logMessage: "Container " + container + " created.",
              });
              res.send(`Container with id (${container}) has been created.`);
            });
        } catch (error) {
          return res.status(400).send(JSON.stringify(error));
        }
      } else {
        return res.status(400).send(JSON.stringify(body));
      }
    });
  });

  router.get("/container/start/v2", keycloak.protect(), function (req, res) {
    const { user, container, jobId } = req.query;
    const options = {
      uri: `${DOCKER_URL}/containers/${container}/start`,
      method: "POST",
      agentOptions: getAgentOptions(),
    };

    // The options for the wait request
    const waiting_options = {
      uri: `${DOCKER_URL}/containers/${container}/wait`,
      method: "POST",
      agentOptions: getAgentOptions(),
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }
      if (response.statusCode == 204) {
        notifyMetadataProviderImageStartedRunning(
          make_iri_with_jobid(jobId),
          new Date()
        );

        TransactionLog.create({ user, logMessage: `Train started: ${jobId}` });

        // waiting on the container and notify when it is stopeed:
        request(waiting_options, (error, response, body) => {
          if (error) {
            console.error(error);
            return res.status(400).send(error.message);
          }
          if (body.StatusCode == 0) {
            notifyMetadataProviderImageFinished(
              make_iri_with_jobid(jobId),
              true,
              new Date()
            );
          } else {
            notifyMetadataProviderImageFinished(
              make_iri_with_jobid(jobId),
              false,
              new Date()
            );
          }
        });

        res.send(`Container ${container} has been started.`);
      } else {
        return res.status(400).send(body);
      }
    });
  });

  router.get("/container/remove/v2", keycloak.protect(), function (req, res) {
    const { user, jobId, container } = req.query;

    var options = {
      uri: `${DOCKER_URL}/containers/${container}`,
      method: "DELETE",
      agentOptions: getAgentOptions(),
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }
      if (response.statusCode == 204) {
        TransactionLog.create({
          user,
          logMessage: `Container (${container}) has been removed`,
        });

        // remove temp direcotry
        removeContainerTempDir(jobId, container);
        res.send(`Container (${container}) has been removed.`);
      } else {
        console.error(body);
        return res.status(response?.statusCode || 400).send(body);
      }
    });
  });

  router.get("/container/logs/v2", keycloak.protect(), function (req, res) {
    const { container } = req.query;

    var options = {
      uri: `${DOCKER_URL}/containers/${container}/logs?stdout=true&stderr=true`,
      method: "GET",
      agentOptions: getAgentOptions(),
    };

    let body = Buffer.from("");
    request(options)
      .on("error", async (err) => {
        return res.status(500).send(err);
      })
      .on("data", async (data) => {
        // Remove header
        if (data[1] == 00 && data[2] == 00 && data[3] == 00)
          data = data.slice(8, data.length);

        body = Buffer.concat([body, data]);
      })
      .on("complete", async (_) => {
        res.json(body.toString("utf-8"));
      });
  });

  router.get("/container/changes/v2", keycloak.protect(), function (req, res) {
    const { container } = req.query;
    var options = {
      uri: `${DOCKER_URL}/containers/${container}/changes`,
      method: "GET",
      agentOptions: getAgentOptions(),
    };

    request(options, (error, response, body) => {
      if (error) {
        console.error(`error: ${error}`);
        res.status(500).send(error);
      }
      if (response.statusCode == 200) {
        try {
          let changes = JSON.parse(body);
          let tree = []; // Important to declare as it is mutated in reduce function i.e. r.tree.push({})
          let level = { tree };

          if (changes) {
            changes.forEach(({ Path, Kind }) => {
              Path.split("/")
                .filter((p) => p !== "")
                .reduce((acc, name) => {
                  if (!acc[name]) {
                    acc[name] = { tree: [] };
                    acc.tree.push({
                      name,
                      path: Path,
                      kindCode: Kind,
                      kindName: dockerContainerChangesKind[Kind],
                      children: acc[name].tree,
                    });
                  }
                  return acc[name];
                }, level);
            });
          }

          res.send(tree);
        } catch (error) {
          console.error(error);
          res.status(400).send(error);
        }
      } else {
        console.error(`error: ${body}`);
        res.status(500).send(body);
      }
    });
  });

  router.get("/container/compare/v2", keycloak.protect(), async (req, res) => {
    const { jobId, container } = req.query;

    const tarFilename = "container.tar";
    const archivePathBeforeExecution = `${jobId}/${container}/before`;
    const archivePathAfterExecution = `${jobId}/${container}/after`;

    const tmpArchivePathBeforeExecution = getTempDir(
      archivePathBeforeExecution
    );
    const tmpArchivePathAfterExecution = getTempDir(archivePathAfterExecution);

    const tmpArchiveFilePathBeforeExecution = `${tmpArchivePathBeforeExecution}/${tarFilename}`;

    try {
      const { data: containerChanges } = await DockerClient.get(
        `/containers/${container}/changes`
      );

      // Exclude sub directories - KEEP FILES ONLY
      let fileList = [];
      containerChanges.forEach((filepath) => {
        let idx = fileList.findIndex((file) =>
          filepath.Path.includes(file.Path)
        );

        if (idx < 0) fileList.push(filepath);
        else fileList.splice(idx, 1, filepath);
      });

      const filePathList = fileList.map((file) => file.Path.substr(1));

      // Extract changes from before execution backup
      if (fs.existsSync(tmpArchiveFilePathBeforeExecution)) {
        // Extract only changed files - before execution version
        tar.extract(
          {
            cwd: tmpArchivePathBeforeExecution,
            file: tmpArchiveFilePathBeforeExecution,
            sync: true,
          },
          filePathList
        );
      } else {
        throw new Error("Could not find backup file (before execution).");
      }

      // Download and extract (piped) changed files from the executed container
      const response = await DockerClient.get(
        `/containers/${container}/export`,
        { responseType: "stream" }
      );

      // Extract only changed files - after execution version
      response.data.pipe(
        tar.extract(
          { cwd: tmpArchivePathAfterExecution, sync: true },
          filePathList
        )
      );

      // Wait for the stream to finish
      await new Promise((resolve, reject) => {
        response.data.on("end", resolve);
        response.data.on("error", reject);
      });

      const binaryFiles = /^Binary files (.*) and (.*) differ/;
      const binaryHead = ["--- ", "+++ ", "@@ -0 +0 @@"].join("\n");

      let promises = [];
      filePathList.forEach((filepath) => {
        const fileBeforeExecution = `${tmpArchivePathBeforeExecution}/${filepath}`;
        const fileAfterExecution = `${tmpArchivePathAfterExecution}/${filepath}`;

        promises.push(
          new Promise((resolve, reject) => {
            let stdout = "";
            let stderr = "";

            // Execute the 'diff' command
            const child = spawn("diff", [
              "--new-file",
              "-u",
              fileBeforeExecution,
              fileAfterExecution,
            ]);

            child.stdout.on("data", (data) => {
              if (binaryFiles.test(data)) {
                data = binaryHead.concat("\n", data);
              }

              stdout = stdout.concat(data);
            });

            child.stderr.on("data", (data) => {
              stderr = stderr.concat(data);
            });

            child.on("close", (code) => {
              // Exit code is 0 if inputs are the same, 1 if different, 2 if trouble.
              if (code === 2) {
                console.error(`spawn() stderr: ${stderr}`);
                reject();
              }

              resolve(stdout);
            });

            child.on("error", (err) => {
              console.error(
                `Error when executing spawn() for file '${filepath}'. ${err}`
              );
              reject();
            });
          })
        );
      });

      const promisesResults = await Promise.all(promises);
      const diffJson = diff2Html.parse(promisesResults.join("\n"));

      // Only Newly Added Lines are displayed
      diffJson.forEach((file) => {
        // strip base path from file name
        file.oldName = file.oldName.replace(tmpArchivePathBeforeExecution, "");
        file.newName = file.oldName;

        /**
         * 0: "Modified"
         * 1: "Added"
         * 2: "Deleted"
         */
        const idx = fileList.findIndex((fl) => file.newName.includes(fl.Path));
        if (fileList[idx].Kind === 1) file.isNew = true;
        else if (fileList[idx].Kind === 2) file.isDeleted = true;

        file.blocks.forEach((fBlock) => {
          fBlock.lines.forEach((line) => {
            if (line.type !== "insert") {
              line.content = `${line.content[0]}***confidential***`;
            }
          });
        });
      });

      res.send(diff2Html.html(diffJson));
    } catch (error) {
      console.error(`Error: ${error}`);
      res.status(500).send(error);
    }
  });

  router.get("/container/archive/v2", keycloak.protect(), async (req, res) => {
    const { container, path } = req.query;

    // ***** TODO : 'path' should be authorized - Only added files can be downloaded *****

    let options = {
      uri: `${DOCKER_URL}/containers/${container}/archive?path=${path}`,
      method: "GET",
      agentOptions: getAgentOptions(),
    };

    request(options)
      .on("error", async (err) => {
        console.log("error: ", err);
        res.status(500).send(err);
      })
      .on("response", async (response) => {
        if (response.statusCode == 200) {
          let fileName = `${container}_${path.replaceAll("/", "_")}.tar`;
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/x-tar");
        } else {
          let fileName = "error.json";
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/json");
        }
      })
      .on("data", async (data) => {
        res.write(data);
      })
      .on("complete", async (_) => {
        res.end();
      });
  });

  router.get("/container/file/v2", keycloak.protect(), async (req, res) => {
    const { jobId, container, filepath } = req.query;

    const tempContainerTarArchiveSubPath_afterExecution =
      getTempContainerTarArchiveSubPath(jobId, container, "after");

    const tempContainerTarArchiveDirPath_afterExecution = getTempDir(
      tempContainerTarArchiveSubPath_afterExecution
    );

    try {
      let options = {
        uri: `${DOCKER_URL}/containers/${container}/archive?path=${filepath}`,
        method: "GET",
        agentOptions: getAgentOptions(),
      };
      await new Promise((resolve, reject) => {
        request(options)
          .pipe(
            tar.extract({
              cwd: tempContainerTarArchiveDirPath_afterExecution,
              sync: true,
            })
          )
          .on("finish", resolve)
          .on("error", (error) => {
            console.log(error);
            reject(error);
          });
      });
      const filePath = filepath.split("/");
      const pathToFileInAfterExecutionDir = path.join(
        tempContainerTarArchiveDirPath_afterExecution,
        filePath[filePath.length - 1]
      );
      const fileContents = fs.readFileSync(pathToFileInAfterExecutionDir);
      res.send(fileContents);
    } catch (error) {
      console.error(`error: ${error}`);
      res.status(500).send(error);
    }
  });

  router.get(
    "/container/changes/file/v2",
    keycloak.protect(),
    async (req, res) => {
      const { jobId, container, filepath } = req.query;

      const tarFilename = "container.tar";
      const archivePathBeforeExecution = `${jobId}/${container}/before`;
      const archivePathAfterExecution = `${jobId}/${container}/after`;

      const tmpArchivePathBeforeExecution = getTempDir(
        archivePathBeforeExecution
      );
      const tmpArchivePathAfterExecution = getTempDir(
        archivePathAfterExecution
      );

      const tmpArchiveFilePathBeforeExecution = `${tmpArchivePathBeforeExecution}/${tarFilename}`;

      try {
        // Extract changes from before execution backup
        if (fs.existsSync(tmpArchiveFilePathBeforeExecution)) {
          // Extract only changed files - before execution version
          tar.extract(
            {
              cwd: tmpArchivePathBeforeExecution,
              file: tmpArchiveFilePathBeforeExecution,
              sync: true,
            },
            [filepath]
          );
        } else {
          throw new Error("Could not find backup file (before execution).");
        }

        // Download and extract (piped) changed files from the executed container
        const response = await DockerClient.get(
          `/containers/${container}/export`,
          { responseType: "stream" }
        );

        // Extract only changed files - after execution version
        response.data.pipe(
          tar.extract({ cwd: tmpArchivePathAfterExecution, sync: true }, [
            filepath,
          ])
        );

        // Wait for the stream to finish
        await new Promise((resolve, reject) => {
          response.data.on("end", resolve);
          response.data.on("error", reject);
        });

        const binaryFiles = /^Binary files (.*) and (.*) differ/;
        const fileBeforeExecution = `${tmpArchivePathBeforeExecution}/${filepath}`;
        const fileAfterExecution = `${tmpArchivePathAfterExecution}/${filepath}`;

        // Execute the 'diff' command
        const child = spawnSync("diff", [
          "--new-file",
          "-u",
          fileBeforeExecution,
          fileAfterExecution,
        ]);

        // If its a binary file, just return its contents.
        if (binaryFiles.test(child.stdout)) {
          return res.send(fs.readFileSync(fileAfterExecution));
        }

        if (child.status === 2) {
          throw new Error(
            `Error when executing spawn() for file '${filepath}'. Error code: ${child.status}`
          );
        }

        let fileContentModified = "";
        const diffJson = diff2Html.parse(child.stdout.toString());

        // Only Newly Added Lines are displayed
        diffJson.forEach((file) => {
          file.blocks.forEach((fBlock) => {
            fBlock.lines.forEach((line) => {
              if (line.type === "insert") {
                fileContentModified = `${fileContentModified}\n${line.content}`;
              }
            });
          });
        });

        res.send(fileContentModified.trim().replaceAll("+", ""));
      } catch (error) {
        console.error(`Error fetching file contents from Docker`);
        console.error(error?.stack);
        res.status(400).send(error.message);
      }
    }
  );

  router.get("/container/commit/v2", keycloak.protect(), async (req, res) => {
    const { user, jobId, container, repo, tag } = req.query;

    const tempDirPath = getJobTempDir(jobId);
    const encryptedTarArchiveFileName = getEncryptedTarArchiveFileName();
    const encryptedTarArchiveFilePathInContainer =
      getEncryptedTarArchiveFilePathInContainer();

    try {
      // check vault health status
      await vault.healthStatus();

      // This includes a list of files that have been modified by previous stations - They are decrypted and must be encrypted again before the train leaves the station
      let prevChanges = [];
      const prevChangesFileName = getPrevChangesFileName();
      const prevChangesFilePath = path.join(tempDirPath, prevChangesFileName);

      if (fs.existsSync(prevChangesFilePath)) {
        const fileContent = fs.readFileSync(prevChangesFilePath);
        prevChanges = JSON.parse(fileContent);
      } else {
        throw new Error(
          "Could not find backup file. Please (re)decrypt the image first."
        );
      }

      // GET a list of changes made by this run
      let containerChangesOptions = {
        uri: `${DOCKER_URL}/containers/${container}/changes`,
        method: "GET",
        agentOptions: getAgentOptions(),
      };
      const containerChangesResult = await requestPromise(
        containerChangesOptions
      );
      const containerChangesResultJson =
        JSON.parse(containerChangesResult) || [];

      // exclude subdirectories (sub changes) from the list of changes - KEEP ONLY FILES
      let fileList = [];
      let deletedFileList = [];
      containerChangesResultJson.forEach((file) => {
        /**
         * 0: "Modified"
         * 1: "Added"
         * 2: "Deleted"
         *
         * Ignore deleted files - deleted files are later deleted from the base image
         */
        if (file.Kind === 2) {
          let index = prevChanges.findIndex((x) => {
            // if needed, consider "/" in comparison
            if (file.Path.startsWith("/")) {
              x = `/${x}`;
            }
            return x.startsWith(file.Path);
          });

          /**
           * Two types of deletion
           * 1. Deleted file is part of the previous changes
           * 2. Deleted file is part of the base image
           */
          if (index > -1) {
            // remove deleted file from prev changes
            prevChanges.splice(index, 1);
          } else {
            deletedFileList.push(file.Path);
          }
          return;
        }

        let index = fileList.findIndex((x) => {
          return file.Path.includes(x.Path);
        });
        if (index < 0) fileList.push(file);
        else fileList.splice(index, 1, file);
      });

      // strip "/" from paths - first character
      let fileListStripped = [];
      fileListStripped = fileList.map((x) => {
        if (x.Path.startsWith("/")) return x.Path.substring(1);
      });

      // append prev changes to current changes
      fileListStripped = prevChanges.concat(fileListStripped);

      // keep unique paths
      fileListStripped = [...new Set(fileListStripped)];

      const tempDirSubPathAfterContainerExecution =
        getTempContainerTarArchiveSubPath(jobId, container, "after");
      const tempDirPathAfterContainerExecution = getTempDir(
        tempDirSubPathAfterContainerExecution
      );

      // download and extract (piped) changes files from the container
      let options = {
        uri: `${DOCKER_URL}/containers/${container}/export`,
        method: "GET",
        agentOptions: getAgentOptions(),
      };

      await new Promise((resolve) => {
        request(options)
          .pipe(
            tar.extract(
              {
                cwd: tempDirPathAfterContainerExecution,
                sync: true,
              },
              fileListStripped
            )
          )
          .on("finish", resolve)
          .on("error", (error) => {
            console.log(error);
            reject(error);
          });
      });

      // create a new tar archive contains all changes
      const tarArchiveFileName = "file.tar";
      const tarArchiveFilePath = path.join(
        tempDirPathAfterContainerExecution,
        tarArchiveFileName
      );

      // No files have changed
      if (!fileListStripped.length) {
        // An empty tar file is a file with 10240 NUL bytes
        // NUL '\u0000'
        const emptyTar = Array(10240).fill("\u0000").join("");
        fs.writeFileSync(tarArchiveFilePath, emptyTar);
      } else {
        tar.create(
          {
            cwd: tempDirPathAfterContainerExecution,
            file: tarArchiveFilePath,
            sync: true,
          },
          fileListStripped
        );
      }

      // Encode tar file to base64 - needed for vault encryption
      let tarFileBase64Encoded = Buffer.from(
        fs.readFileSync(tarArchiveFilePath)
      ).toString("base64");

      // Generate a symmetric key
      const symmetricKeyName = jobId;
      await vault.command.write(`transit/keys/${symmetricKeyName}`, {
        exportable: true,
        allow_plaintext_backup: true,
        type: "aes256-gcm96",
      });

      // encrypt changes with the symmetric key
      let encryptionResult = await vault.command.write(
        `transit/encrypt/${symmetricKeyName}`,
        { plaintext: tarFileBase64Encoded }
      );

      // write ciphertext in a file
      const encryptedTarArchiveFilePath = path.join(
        tempDirPathAfterContainerExecution,
        encryptedTarArchiveFileName
      );
      fs.writeFileSync(
        encryptedTarArchiveFilePath,
        encryptionResult.data.ciphertext
      );

      // export the symmetric key
      let exportSymmetricKeyResult = await vault.command.read(
        `/transit/export/encryption-key/${symmetricKeyName}/1`
      );
      const symmetricKey = exportSymmetricKeyResult.data.keys["1"];

      // FIND base Image Id
      // 1. inspect container for its image
      let inspectContainerOptions = {
        uri: `${DOCKER_URL}/containers/${container}/json`,
        method: "GET",
        agentOptions: getAgentOptions(),
      };
      const inspectContainerResult = await requestPromise(
        inspectContainerOptions
      );
      const inspectContainerResultJson = JSON.parse(inspectContainerResult);

      // 2. inspect history of image for its base image
      const imageId = inspectContainerResultJson.Image;
      let imageHistoryOptions = {
        uri: `${DOCKER_URL}/images/${imageId}/history`,
        method: "GET",
        agentOptions: getAgentOptions(),
      };
      const imageHistoryResult = await requestPromise(imageHistoryOptions);
      const imageHistoryResultJson = JSON.parse(imageHistoryResult);
      const baseImageId = imageHistoryResultJson
        .reverse()
        .find((item) => item.Id !== "<missing>").Id;

      // Dockerfile
      let dockerFileLines = [`FROM ${baseImageId}`];

      // COPY file.enc
      dockerFileLines = dockerFileLines.concat([
        `COPY ${encryptedTarArchiveFileName} ${encryptedTarArchiveFilePathInContainer}`,
      ]);

      // update train_config file
      let trainConfig = trainConfigUtil.getTrainConfigJsonBaseModel();
      const trainConfigFileName = trainConfigUtil.getTrainConfigFileName();
      const trainConfigFilePath = path.join(tempDirPath, trainConfigFileName);
      if (fs.existsSync(trainConfigFilePath)) {
        console.log("train_config");
        const fileContent = fs.readFileSync(trainConfigFilePath);
        trainConfig = JSON.parse(fileContent);
      }
      trainConfig = await trainConfigUtil.updateTrainConfigJson(
        trainConfig,
        symmetricKey
      );
      const updatedTrainConfigFilePath = path.join(
        tempDirPathAfterContainerExecution,
        trainConfigFileName
      );
      fs.writeFileSync(updatedTrainConfigFilePath, JSON.stringify(trainConfig));

      const trainConfigFilePathInContainer =
        trainConfigUtil.getTrainConfigFilePathInContainer();
      // COPY train_config.json
      dockerFileLines = dockerFileLines.concat([
        `COPY ${trainConfigFileName} ${trainConfigFilePathInContainer}`,
      ]);

      // dockerFileLines.push(`LABEL train_config=${JSON.stringify(JSON.stringify(trainConfig))}`);

      // REMOVE files - If a file is removed in this execution, remove it from base image
      dockerFileLines = dockerFileLines.concat(
        deletedFileList.map((filePath) => `RUN rm -rf ${filePath}`)
      );

      // save Dockerfile
      const dockerFileName = "Dockerfile";
      const dockerFilePath = path.join(
        tempDirPathAfterContainerExecution,
        dockerFileName
      );
      fs.writeFileSync(dockerFilePath, dockerFileLines.join("\n"));

      // create tar archive file to build a new image
      const encImageTarArchiveFileName = "encImage.tar";
      const encImageTarArchiveFilePath = path.join(
        tempDirPathAfterContainerExecution,
        encImageTarArchiveFileName
      );
      tar.create(
        {
          cwd: tempDirPathAfterContainerExecution,
          file: encImageTarArchiveFilePath,
          sync: true,
        },
        [encryptedTarArchiveFileName, dockerFileName, trainConfigFileName]
      );

      // build a new image (contains updated train_config.json and file.enc)
      const t = `${repo}:${tag}`;
      let buildOptions = {
        uri: `${DOCKER_URL}/build?t=${t}`,
        method: "POST",
        agentOptions: getAgentOptions(),
      };

      buildOptions.body = fs.createReadStream(encImageTarArchiveFilePath);
      const buildResult = await requestPromise(buildOptions);
      console.log("buildResult", buildResult);

      // DELETE container after encryption and building a new image
      let deleteContainerOptions = {
        uri: `${DOCKER_URL}/containers/${container}`,
        method: "DELETE",
        agentOptions: getAgentOptions(),
      };
      await requestPromise(deleteContainerOptions);

      // DELETE IMAGE
      let deleteImageOptions = {
        uri: `${DOCKER_URL}/images/${imageId}?force=true`,
        method: "DELETE",
        agentOptions: getAgentOptions(),
      };
      await requestPromise(deleteImageOptions);

      TransactionLog.create({
        user,
        logMessage: `Container ${container} has been encrypted and committed.`,
      });

      // remove temp directory
      removeJobTempDir(jobId);

      res.send(`Container ${container} has been encrypted and committed.`);
    } catch (error) {
      console.log(error);
      return res.status(400).send(utility.stringifyErrorMsg(error));
    }
  });

  // ***** TEMP CODE - DOWNLOAD CONTANIER AS A TAR ARCHIVE FILE - START *****
  router.get("/container/export", keycloak.protect(), async (req, res) => {
    const { container } = req.query;
    let options = {
      uri: `${DOCKER_URL}/containers/${container}/export`,
      method: "GET",
      agentOptions: getAgentOptions(),
    };

    request(options)
      .on("error", async (err) => {
        console.log("error: ", err);
        res.status(500).send(err);
      })
      .on("response", async (response) => {
        if (response.statusCode == 200) {
          let fileName = `${container}.tar`;
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/x-tar");
        } else {
          let fileName = "error.json";
          res.set("Content-disposition", "attachment; filename=" + fileName);
          res.set("Content-Type", "application/json");
        }
      })
      .on("data", async (data) => {
        res.write(data);
      })
      .on("complete", async (_) => {
        res.end();
      });
  });

  return router;
};
