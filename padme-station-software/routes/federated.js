const _ = require("lodash");
const path = require("path");
const express = require("express");
const router = express.Router();
const tarStream = require("tar-stream");
const { Readable } = require("stream");
const WaitQueue = require("wait-queue");

const {
  FLGlobalStoragePath,
  FLModelPath,
} = require("../federated/flConstants");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const GridFsClient = require("../federated/flGridFsClient.js");
const FLJobManager = require("../federated/flJobManager");
const dockerUtil = require("../federated/flDocker");
const { FLJob } = require("../models/FLJob");

const modelName = FLModelPath.substring(FLModelPath.indexOf("/", 1) + 1);
const globalStorageName = FLGlobalStoragePath.substring(
  FLGlobalStoragePath.indexOf("/", 1) + 1
);

//------------------ Methods ------------------

/**
 * Returns a list of the files contained in the provided archive
 * Copied from the Jobresults in the CS
 * @param {*} archiveStream stream for the archive
 * @param {string} prefix A prefix path that should be used for the fileList
 */
const getFileListFromArchive = async (archiveStream, prefix = "") => {
  return new Promise((accept) => {
    let changes = [];

    let extractListOfContents = tarStream.extract();
    extractListOfContents
      .on("entry", function (header, stream, next) {
        // header is the tar header
        // stream is the content body (might be an empty stream)
        // call next when you are done with this entry

        // clear stream - just file name is enough
        if (header.type == "file") {
          changes.push(path.join(prefix, header.name));
        }

        stream.on("end", function () {
          next(); // ready for next entry
        });

        stream.resume(); // just auto drain the stream
      })
      .on("finish", function () {
        accept(changes);
      });

    archiveStream.pipe(extractListOfContents);
  });
};

/**
 * Creates tree from the tar changes array
 * Credit: https://stackoverflow.com/a/57344801/5589776
 * Copied from the Jobresults in the CS
 * @param {*} dataset
 * @returns
 */
const createDataTree = (dataset) => {
  let result = [];
  let level = { result };

  dataset.forEach((path) => {
    path.split("/").reduce((r, name, i, a) => {
      if (!r[name]) {
        r[name] = { result: [] };
        r.result.push({
          name,
          path: a.slice(0, i + 1).join("/"),
          children: r[name].result,
        });
      }

      return r[name];
    }, level);
  });
  return result;
};

//Extracts the file at the given path from the archive
const extractFileFromArchive = (archiveStream, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      let extractContents = tarStream.extract();
      var data = [];
      extractContents
        .on("entry", function (header, stream, next) {
          //Read file content
          stream.on("data", function (chunk) {
            if (header.name == filePath) data.push(chunk);
          });

          //Get next element
          stream.on("end", function () {
            next();
          });
        })
        .on("finish", function () {
          resolve(data);
        });
      archiveStream.pipe(extractContents);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Handles the download of the whole archive or specific files
 * @param {*} req
 * @param {*} res
 * @param {*} archiveStream
 * @returns
 * Copied from the Jobresults endpoint in CS
 */
const handleFileDownload = async (req, res, jobId, path, archiveStream) => {
  console.log("Downloading file " + path + " for " + jobId);

  let fileData = await extractFileFromArchive(archiveStream, path);
  if (fileData === undefined || fileData.length == 0) {
    console.log("Could not find requested file " + path);
    res
      .status(404)
      .send(
        "File not found. Possibly the job finished " +
          "the next round and new results are available. Try refreshing the page"
      );
    return;
  }

  console.log("File " + path + " successfully extracted");
  //Write file as response
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": "attachment; filename=" + path.split("/").pop(),
  });

  Readable.from(fileData).pipe(res);
};

/**
 * Repacks the provided tarstream and prefixes the provided foldername to every file
 * @param {*} stream Existing tar stream that should be repacked
 * @param {*} folderName The new prefix to use
 * @param {*} target Target tar tream that is pipeable
 * @returns
 */
const repackTarStream = async (source, folderName, target) => {
  return new Promise((accept, reject) => {
    let extract = tarStream.extract();

    extract.on("entry", function (header, stream, callback) {
      try {
        //Prefix files with given folderName
        header.name = path.join(folderName, header.name);
        stream.pipe(target.entry(header, callback));
      } catch (err) {
        reject(err);
      }
    });

    extract.on("finish", function () {
      // all entries done - lets finalize it
      accept(target);
    });

    source.pipe(extract);
  });
};

/**
 * Combines the global storage with the model and returns everything as one
 * tar archive
 * @param {*} req
 * @param {*} res
 * @param {*} jobId
 * @returns
 */
const handleAllFileDownload = async (req, res, jobId) => {
  console.log("Downloading all files for job" + jobId);

  //Get both streams
  let modelStream = await getResultStream(jobId, res);
  if (!modelStream) return;

  let result = tarStream.pack();

  //Directly start pipeing (and therefore reading, otherwise the stream gets stuck)
  res.writeHead(200, {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": "attachment; filename=result" + jobId + ".tar",
  });

  result.pipe(res);

  //Repack model contents in subfolder
  await repackTarStream(modelStream, modelName, result);

  //Repack global_storage in subfolder if exists
  let storageStream = await getStorageStream(jobId, res);
  if (storageStream) {
    await repackTarStream(storageStream, globalStorageName, result);
  }

  //Finalize result and pipe as http answer
  result.finalize();

  console.log(`Repacking done for job ${jobId}, stream returned`);
};

/**
 * Handles downloads that want to extract a specific file
 * @param {*} req
 * @param {*} res
 * @param {*} path
 * @param {*} jobId
 * @returns
 */
const handleSpecificFileDownload = async (req, res, path, jobId) => {
  //Determine where to load the result from depending on the prefix
  //Remove the modelName/global storage name and '/' from the string
  let prefixFreePath, stream;
  if (path.startsWith(modelName)) {
    prefixFreePath = path.substring(modelName.length + 1);
    stream = await getResultStream(jobId, res);
  } else if (path.startsWith(globalStorageName)) {
    prefixFreePath = path.substring(globalStorageName.length + 1);
    stream = await getStorageStream(jobId, res);
  } else {
    res.status(404).send();
    return;
  }

  //Handle Download
  if (stream == null) return;
  await handleFileDownload(req, res, jobId, prefixFreePath, stream);
};

/**
 * @param {number} jobId id of the job that the results stream should be returned for
 * @param {*} res
 * @returns a jobworker instance
 */
const getJobWorker = (jobId, res) => {
  let jobManager = new FLJobManager();
  let worker = jobManager.lookupJobWorker(jobId);

  if (!worker) {
    res.status(404).send();
    return null;
  }
  return worker;
};

/**
 * @param {number} jobId id of the job that the results stream should be returned for
 * @param {*} req
 * @returns A stream with thre results of this job or null if none exists
 */
const getResultStream = async (jobId, res) => {
  let worker = getJobWorker(jobId, res);
  if (!worker) return;

  //Get results
  let resultsStream = await worker.getLastResultStream();

  //Check if results exist
  if (resultsStream == null) {
    console.log(`View: job with id ${jobId} does not yet have results`);
    res.status(400).send();
    return null;
  }

  return resultsStream;
};

/**
 * @param {number} jobId id of the job that the results stream should be returned for
 * @param {*} req
 * @returns A stream with the global storage of this job or null if none exists
 */
const getStorageStream = async (jobId, res) => {
  let worker = getJobWorker(jobId, res);

  //Get results
  return await worker?.getLastGlobalStorageStream();
};

/**
 * Abstract implementation of a long polling worker.
 * This method first tries to query existing data and then listens to the eventQueue and
 * a timeout for further processing
 *
 * @param {*} res The express res object
 * @param {*} queryData A (async) method that can be used to query the required data
 * @param {*} newEventsQueue A queue that gets an element as soon as new data becomes available
 * @returns
 */
const genericLongPollingWorker = async (res, queryData, newEventsQueue) => {
  const timeout = 30 * 1000; //Default -> 30 seconds
  const finish = new Date(new Date().getTime() + timeout);

  //Check if there is already data that can be send
  let data = await queryData();
  if (data.length > 0) {
    res.write(JSON.stringify(data));
    res.end();
    return;
  }

  //Retry to find data till success or time is up
  while (Date.now() < finish && data.length == 0) {
    let difference = finish - Date.now();

    //Wait the remaining time
    const promiseTimeout = new Promise((resolve) => {
      setTimeout(resolve, difference, "timeout");
    });

    //Wait for the Timeout or the WaitQueue to finish
    let value = await Promise.any([promiseTimeout, newEventsQueue.shift()]);

    //Check if the timeout or the queue finished
    if (value != "timeout") {
      //Wait 500ms to have the possibility to get concurrent data
      //->reduces number of packets transmitted and should not be
      //noticable for the user
      await delay(500);
      data = await queryData();
    }
  }

  //Send result
  res.write(JSON.stringify(data));
  res.end();
};

module.exports = (keycloak) => {
  //Cancel (stop) the job with the given id
  router.put("/cancel/:id/v2", keycloak.protect(), async (req, res) => {
    const jobId = req.params.id;
    console.log(`Canceling FL job with id ${jobId}`);

    let jobManager = new FLJobManager();
    let worker = jobManager.lookupJobWorker(jobId);
    if (worker === undefined) {
      console.log(
        `No job with id ${jobId} was found or the job has already been removed.`
      );
      return res
        .status(404)
        .send(
          `No job with id ${jobId} was found or the job has already been removed.`
        );
    }

    await worker.cancel();

    //Success
    console.log(`Send cancellation request for job with id ${jobId}.`);
    res.status(200).send();
  });

  //Approve that the current changes for the job with the given id are allowed to be transmitted
  router.put("/approve/:id/v2", keycloak.protect(), async (req, res) => {
    const jobId = req.params.id;
    console.log(`Approving changes for FL job with id ${jobId}`);

    let jobManager = new FLJobManager();
    let worker = jobManager.lookupJobWorker(jobId);
    if (worker === undefined) {
      console.log(
        `No job with id ${jobId} was found or the job has already been removed.`
      );
      return res
        .status(404)
        .send(
          `No job with id ${jobId} was found or the job has already been removed.`
        );
    }

    await worker.approveTransmittingResults();

    //Success
    console.log(`Approved changes for job wiht id ${jobId} for transmission.`);
    res
      .status(200)
      .send(`Approved changes for job wiht id ${jobId} for transmission.`);
  });

  //Removes this FL Job from the local DB, etc.
  router.put("/delete/:id/v2", keycloak.protect(), async (req, res) => {
    const jobId = req.params.id;

    let jobManager = new FLJobManager();
    let worker = jobManager.lookupJobWorker(jobId);

    //Dispose the worker if it is still instantiated
    if (worker) {
      await worker.dispose();
    }

    //Try finding the job in the DB
    const job = await FLJob.findOne({ jobid: jobId });
    if (job === null) {
      console.log(
        `No job with id ${jobId} was found or the job has already been removed.`
      );
      res
        .status(404)
        .send(
          `No job with id ${jobId} was found or the job has already been removed.`
        );
      return;
    }

    //Try deleting the GridFS files, docker image, and the job
    try {
      //Delete existing gridFS entries
      await GridFsClient.removeFromGridFsIfDefiend(job.lastResultGridId);
      await GridFsClient.removeFromGridFsIfDefiend(job.lastGlobalStorageGridId);
      await GridFsClient.removeFromGridFsIfDefiend(job.lastLocalStorageGridId);

      //Delete docker image when not used by anybody else
      let otherJobs = await FLJob.find({
        trainstoragelocation: job.trainstoragelocation,
        jobid: { $ne: job.jobid },
      });
      if (otherJobs == undefined || otherJobs.length == 0) {
        await dockerUtil.removeImage(job.trainstoragelocation);
      }

      //Delete Job
      await job.remove();
    } catch (err) {
      console.log(
        `Something went wrong while removing the job and associated data: ${err}`
      );
      res
        .status(500)
        .send(
          `Something went wrong while removing the job and associated data: ${err}`
        );
      return;
    }

    //Try delete from jobManager (might not have an associated jobWorker instance)
    jobManager.removeJobWorkerIfExists(jobId);

    //Success
    console.log(`FL job with id ${jobId} sucessfully removed`);
    res.status(200).send();
  });

  /**
   * Endpoint to view the results of FL
   */
  router.get("/results/:id/v2", keycloak.protect(), async (req, res) => {
    const jobId = req.params.id;
    const worker = getJobWorker(jobId, res);
    if (worker === null) return;

    console.log(`Viewing results for FL job with id ${jobId}`);

    let resultsStream = await getResultStream(jobId, res);
    if (resultsStream == null) return;

    //Results exist -> Get the json representation
    let changes = await getFileListFromArchive(resultsStream, modelName);
    let storageStream = await getStorageStream(jobId, res);
    if (storageStream) {
      let storageChanges = await getFileListFromArchive(
        storageStream,
        globalStorageName
      );
      changes = _.union(changes, storageChanges);
    }

    //Update the worker that the user inspected the results
    await worker.handleUserInspectedResults();
    res.status(200).send(JSON.stringify(createDataTree(changes)));
  });

  /**
   * Endpoint to download results of FL
   */
  router.get(
    "/results/:id/download/v2",
    keycloak.protect(),
    async (req, res) => {
      const jobId = req.params.id;
      const { path } = req.query;

      console.log(`Downloading results for FL job with id ${jobId}`);

      try {
        //Download all files
        if (path == undefined) {
          await handleAllFileDownload(req, res, jobId);
        } else {
          await handleSpecificFileDownload(req, res, path, jobId);
        }
      } catch (err) {
        console.log(
          "Download: Error while downloading results of FL job " + jobId
        );
        console.log(err);
        res.status(500).send(err);
      }
    }
  );

  /**
   * Long polling endpoint to fetch changes in the available FL jobs
   */
  router.get("/updates", keycloak.protect(), async (req, res) => {
    const { since = 0 } = req.query;

    const jobManager = new FLJobManager();
    const queryData = async () => {
      return await jobManager.getJobUpdatesSince(since);
    };

    const queue = new WaitQueue();
    const eventListener = (id) => {
      if (id > since) {
        queue.push(id);
      }
    };
    jobManager.on("newJobUpdates", eventListener);
    await genericLongPollingWorker(res, queryData, queue);
    jobManager.off("newJobUpdates", eventListener);
  });

  /**
   * Log polling endpoint that sends the log files for a FL job
   */
  router.get("/logs/:id", keycloak.protect(), async (req, res) => {
    const jobId = req.params.id;
    const { since = 0 } = req.query;

    const jobManager = new FLJobManager();
    const worker = jobManager.lookupJobWorker(jobId);
    if (!worker) {
      res.status(404).send(`Could not find job with id ${jobId}`);
      return;
    }

    const queryData = async () => {
      return await worker.getLogs(since);
    };

    const queue = new WaitQueue();
    const eventListener = (id) => {
      if (id > since) {
        queue.push(id);
      }
    };
    worker.on("newLogs", eventListener);
    await genericLongPollingWorker(res, queryData, queue);
    worker.off("newLogs", eventListener);
  });

  return router;
};
