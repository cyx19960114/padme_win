const {
    FLModelPath, FLModelPathEnvName, FLAggregationPath,
    FLAggregationPathEnvName, FLAggregationPathsEnvName,
    FLGlobalStorageEnvName, FLGlobalStoragePath,
    FLLocalStorageEnvName, FLLocalStoragePath,
    getResultFileName, getGlobalStorageFileName,
    getLocalStorageFileName
} = require('./constants.js');
const minioClient = require('../utils/minio').minioClient;
const FederatedLogger = require('./federatedLogger.js');
const WaitQueue = require('wait-queue');
const Jobinfo = require('../models').fl_jobinfo;
const AggregationLog = require('../models').AggregationLog;
const harborUtil = require('../utils/harbor');
const dockerUtil = require('../utils').docker;
const EventEmitter = require('events');
const _ = require('lodash'); 
const path = require('path');


class Aggregator extends EventEmitter
{
    //------------------ Properties ------------------
    #jobId; 
    #logger;
    #jobInfo;
    #logQueue;
    #disposeLogWorkPromise;
    #disposeLogWorkResolve;

    //------------------ Constructor ------------------
   /** 
    * Job Worker that handles the aggregation for one specific federated learning job and one learning round
    * The following events are emitted: 
    * - aggregationFinished | Called whenever an aggregation that was triggered finished
    *                         The event contains an error message as a string, which is empty on success
    * @param {*} jobId The id of the job that should be aggregated
    */
    constructor(jobId)
    {
        super();

        this.#jobInfo = undefined;
        this.#jobId = jobId;
        this.#logger = new FederatedLogger();
        this.#logQueue = new WaitQueue();
        //Create Promise and resolve method for stopping the log worker
        const self = this;
        this.#disposeLogWorkPromise = new Promise((resolve) => {
            self.#disposeLogWorkResolve = (value) => {
                resolve(value);
            }
        });
        //Start the log worker
        this.#workLogs();
    }

    //------------------ private Methods ------------------

    /**
     * Stores the given logContent to the AggregationLog table
     * @param {string} content the log content to store 
     * @returns 
     */
    async #storeLogInDb(content)
    {
        return await AggregationLog.create({ jobid: this.#jobId, log: content });
    }

    /**
     * Drains all elements of the logQueue into the DB as aggregation log
     * @returns {AggregationLog[]} A list of AggregationLogs that has been created in the db
     */
    async #drainLogQueueToDb()
    {
        const stored = [];
        for(const logValue of this.#logQueue) 
        {
            stored.push(await this.#storeLogInDb(logValue));
        }
        return stored;
    } 

    /**
     * Takes the logs out of the queue and stores them into the db
     */
    async #workLogs()
    {
        let disposed = false;
        this.#logger.log(`Started to work aggregation logs for id ${this.#jobId}`);
        while (!disposed) {
            //Wait for item from queue or disposal of this method
            const value = await Promise.any([this.#disposeLogWorkPromise, this.#logQueue.shift()]);
        
            if (value === "disposed")
            {
                //Drain queue & dispose
                const drained = await this.#drainLogQueueToDb();
                this.emit('newLog', drained.pop()?.id);
                disposed = true;
                this.#logger.log(`Stopped to work aggregation logs for id ${this.#jobId}`);
            } else {
                const newLog = await this.#storeLogInDb(value);
                this.emit('newLog', newLog.id);
            }           
        }  
    }

    async #loadJobInfo() {
        //IMPORTANT: Read-only, no altering
        await Jobinfo.findOne(
            {
                where: {
                    jobid: this.#jobId
                },
                include: 'Stations'
            })
            .then((data) => {
                this.#jobInfo = data;
            })
            .catch((error) => {
                this.#logger.log("Error while loading jobInfo object");
                this.#logger.log(error);
            });
    }

    /**
     * logs a new log message for this aggregator
     * @param {*} content 
     */
    #log(content)
    {
        this.#logger.log(`${this.#jobId} AGGREGATOR - ${content}`);
        //push to queue (will asynchronously be written to DB)
        this.#logQueue.push(`AGGREGATOR - ${content}`);
    }

    #logContainerOutput(content)
    {
        this.#logger.log(`${this.#jobId} AGGREGATOR CONTAINER - ${content}`);
        //push to queue (will asynchronously be written to DB)
        this.#logQueue.push(`AGGREGATOR CONTAINER - ${content}`);
    }
    
    #logSelf(self, content)
    {
        self.#log(content);
    }

    /**
     * Returns all stations that submitted a result for the aggregation
     * @returns an array of station objects
     */
    #getFinishedStations()
    {
        return _.filter(this.#jobInfo.Stations, ['doneWithCurrentState', true]);
    }

    /**
     * Resolves all paths that will be created in the container for aggregation targets as a dictionary with the station uid as key
     * @returns 
     */
    #resolveAggregationPaths()
    {
        let paths = {};
        let stations = this.#getFinishedStations();

        for (let station of stations)
        {
            //Create a path for each station
            paths[station.uid] = path.join(FLAggregationPath, station.uid) + "/";
        }
        return paths;
    }

    /**
     * Extracts the archives with the station results to the provided aggregation container
     * @param {*} container The container to put the results in
     * @param {*} aggregationPaths The paths were the results should be put in
     */
    async #putStationResultsInContainer(container, aggregationPaths)
    {
        this.#log("Putting station results in container");
        //For each of the target paths, ensure it exists
        for (let key in aggregationPaths) {
            await dockerUtil.ensurePathExistsInContainer(container, aggregationPaths[key]);
        }
        
        //For each of the results, extract to container
        let stations = this.#getFinishedStations();
        for(let station of stations)
        {
            let target = aggregationPaths[station.uid];
            this.#log(`Pushing results from station ${station.uid} to ${target}`);
            let stream = await minioClient.getObject(this.#jobId, getResultFileName(station.uid, this.#jobInfo.currentround));
            if (stream == null) throw "Could not find results for station in minio";
            await container.putArchive(stream, { path: target });
        }  

        this.#log("Station results successfully copied to container");
    }

    /**
     * 
     * @param {*} container 
     */
     async #restoreStorage(container)
     {
        //Check if storage from previous aggregation exists and restore if this is the case
        this.#log("Restoring local and global storage for aggregation");
        
        //Global Storage
        let stream = await minioClient.getObject(this.#jobId, getGlobalStorageFileName(this.#jobId));
        if (stream != null) {
            await container.putArchive(stream, { path: FLGlobalStoragePath });
            this.#log("Global Storage restored");
        }
         
        //local Storage
        stream = await minioClient.getObject(this.#jobId, getLocalStorageFileName(this.#jobId));
        if (stream != null) {
            await container.putArchive(stream, { path: FLLocalStoragePath });
            this.#log("Local Storage restored");
        }
         
        this.#log("Successfully restored local and global storage for aggregation");
     } 
    
    /**
     * 
     * @param {*} aggregationPaths 
     */
    async #createContainer()
    {
        return new Promise(async (res, rej) => {
            try {
                this.#log("Creating Container");

                let aggregationPaths = this.#resolveAggregationPaths();

                //Create comma separated from aggregationPath
                let aggregationPathsVal = _.values(aggregationPaths);
            
                //Set the environment variables to the correct value
                let container = await dockerUtil.createContainerWithEnv(
                    path.join(harborUtil.getHost(), this.#jobInfo.trainclassidaggregation), 
                    this.#jobInfo.jobid,
                    [
                        `${FLModelPathEnvName}=${FLModelPath}`,
                        `${FLGlobalStorageEnvName}=${FLGlobalStoragePath}`,
                        `${FLLocalStorageEnvName}=${FLLocalStoragePath}`,
                        `${FLAggregationPathEnvName}=${FLAggregationPath}`,
                        `${FLAggregationPathsEnvName}=${aggregationPathsVal}`,
                    ], 
                );

                //Ensure the needed paths exist in the container
                await dockerUtil.ensurePathExistsInContainer(container, FLModelPath);
                await dockerUtil.ensurePathExistsInContainer(container, FLGlobalStoragePath);
                await dockerUtil.ensurePathExistsInContainer(container, FLLocalStoragePath);
                await dockerUtil.ensurePathExistsInContainer(container, FLAggregationPath);
                
                //Put each of the station results into the container
                await this.#putStationResultsInContainer(container, aggregationPaths);
                
                //Restore the Logs from previous rounds if exists
                await this.#restoreStorage(container);

                this.#log("Container created successfully");
                res(container);
            } catch (err) {
                rej(err)
            }
        });
    }

    /**
     * Starts the container and waits for it to finish
     * @param {*} container 
     */
    async #performAggregation(container)
    {
        this.#log("Starting aggregation");
        await container.start(); 

        //Attach to the container logs
        dockerUtil.writeContainerLogsToLogger(container, (content) => this.#logContainerOutput(content));

        //Wait for container to finish, then check return code
        let response = await container.wait();
        if (response.StatusCode != 0)
        {
            throw new Error(`Aggregation failed because container exited with code ${response.StatusCode} and message ${response.Error?.Message}`);
        }

        this.#log("Aggregation finished");
    }

    /**
     * Try to remove the given container and logs a message and updates
     * the job status if removing fails
     * @param {*} container 
     */
    async #cleanupContainerAfterRound(container)
    {   
        //Cleanup container
        this.#log(`Removing container for aggregation`);
        await dockerUtil.removeContainer(container);
        this.#log(`Container successfully removed`);
    }

    //------------------ public Methods ------------------
    /**
     * Starts the aggregation container, aggregates the results for the round
     * and puts the resulting model to minio
     * @param {*} resultExtractor Extractor providing a extractResult method
     */
    async aggregate(resultExtractor)
    {
        try
        {
            //Load data, create aggregation container
            await this.#loadJobInfo();
            this.#log(`Starting aggregation of round ${this.#jobInfo.currentround}/${this.#jobInfo.maxrounds}.`);

            let container = await this.#createContainer();

            //Perform aggregation
            await this.#performAggregation(container);

            //Extract results
            let self = this;
            let logger = (content) => self.#logSelf(self, content);
            await resultExtractor.extractResult(
                container, this.#jobId,
                this.#jobInfo.userid, FLAggregationPath,
                FLModelPath, FLGlobalStoragePath,
                FLLocalStoragePath, logger
            );
            
            //Remove container
            await this.#cleanupContainerAfterRound(container);

            //Emit the finished event
            this.emit('aggregationFinished', "")
            this.#log(`Finished aggregation of round ${this.#jobInfo.currentround}/${this.#jobInfo.maxrounds}.`);
        } catch (err)
        {
            this.#log(`Aggregation in round ${this.#jobInfo.currentround} failed: ${err}`); 
            this.emit('aggregationFinished', err);
        }
        this.#disposeLogWorkResolve("disposed");
    }
}
module.exports = Aggregator