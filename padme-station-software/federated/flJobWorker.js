const {
    FLModelPath, FLModelPathEnvName,
    FLGlobalStorageEnvName, FLGlobalStoragePath,
    FLLocalStorageEnvName, FLLocalStoragePath } = require('./flConstants.js');
const { FLJob, FLJobState, FLPrivacySetting } = require('../models/FLJob');
const FederatedLogger = require('./federatedLogger.js');
const { EventType } = require('./flEventType.js');
const FLApiClient = require('./flApiClient.js');
const dockerUtil = require('./flDocker');
const WaitQueue = require('wait-queue');
const EventEmitter = require('events');
var Mutex = require('async-mutex').Mutex;
const GridFsClient = require('./flGridFsClient.js');

class JobCanceledError extends Error {
    constructor() {
        super("");
        this.name = "JobCanceledError";
    }
}

/**
 * Emits the newLogs event whenever a new log is available
 * Emit the stateChanged event when the state of the Job changes.
 * This event provides two parameters: the new state and the current round id
 */
class FLJobWorker extends EventEmitter
{
    //------------------ Properties ------------------
    #jobId;
    #logger; 
    #apiClient;
    #clientLogQueue;
    #disposePromiseResolve;
    #disposePromise;
    #cancelPromiseResolve;
    #cancelPromise;
    #userApprovalPromiseResolve;
    #userInspectResultPromiseResolve;
    #jobInfoLock;

    //------------------ Constructor ------------------

    /**
     * Creates a new jobWorker instance for the provided jobId
     * !!important Should be disposed with the dispose method because of loops used in the object
     * @param {string} jobId The id of the job the worker should handle
     */
    constructor(jobId)
    {
        super();
        this.#jobId = jobId;
        this.#logger = new FederatedLogger();
        this.#apiClient = new FLApiClient(this.#jobId);
        this.#clientLogQueue = new WaitQueue();
        //Should be used when accessing the jobInfo object to prevent concurrency issues
        this.#jobInfoLock = new Mutex();
        const self = this;
        //Create Promise and resolve method for disposing this flWorker instance
        this.#disposePromise = new Promise((resolve) => {
            self.#disposePromiseResolve = (value) => {
                resolve(value);
            }
        });
        //Promise and resolve method that are called when the job is canceled
        this.#cancelPromise = new Promise((resolve) => {
            self.#cancelPromiseResolve = (value) => {
                resolve(value);
            }
        });
        //Subscribe to new FL Events
        this.#apiClient.on('flEvent', (event) => self.#handleFlEvent(self, event));
        //Start working the userlog queue
        this.#workUserLogs();
    }


    //------------------ private Methods ------------------
    #addLogToJob(flJob, logId, value)
    {
        flJob.logs.push({ id: logId, content: value });
    }

    #drainLogsQueue(flJob, queue, logId)
    {
        for (const logValue of queue) 
        {
            this.#addLogToJob(flJob, logId++, logValue);
        }
        return logId;
    }

    /**
     * Asynchronously saves the user logs to the DB
     * Needed to ensure the logs are saved in the correct order
     */
    async #workUserLogs() {
        let logId = 1;
        let disposed = false;
        while (!disposed) {
            //Wait for item from queue or disposal of this object
            const value = await Promise.any([this.#disposePromise, this.#clientLogQueue.shift()]);
            const job = await FLJob.findOne({ jobid: this.#jobId });

            //Check if should stop
            if (value == "disposed")
            {
                //Drain the remaining queue items
                logId = this.#drainLogsQueue(job, this.#clientLogQueue, logId);
                disposed = true;
                console.log(`Stopped to work userLogs for id ${this.#jobId}`);
            } else
            {
                this.#addLogToJob(job, logId++, value)
            }

            if (job.isModified()) {
                //Add to DB (without lock!, we update the logs directly)
                //Otherwise we get a build up at this position and logs are only ingested
                //veery slowly. Also: We do not need any locking here..
                await job.save();
                this.emit('newLogs', logId);
            }
        }
    }

    /**
     * @returns a jobInfo object from the DB
     * CAUTION: This method should only be called while holding the jobInfoLock
     */
    async #loadJobInfo()
    {   
        //Unfortunately mongoose does not support parallel save 
        //(more than one call to save in the same tick)
        //Therefore, we will load the object from the DB each time and then update it
        //As suggested by the mongoose author
        //see: https://github.com/Automattic/mongoose/issues/8132 
        return FLJob.findOne(
        {
            jobid: this.#jobId
        });
    }

    /**
     * Supplies the current JobInfo to the provided callback and afterwards persist the changes
     * @param {*} self 
     * @param {function(jobInfo)} callback
     * @returns {any} the result of the provided callback
     */
    async #updateJobInfo(self, callback)
    {
        return self.#jobInfoLock.runExclusive(async () => {
            let jobInfo = await self.#loadJobInfo();
            const res = await callback(jobInfo);
            await jobInfo.save();
            return res;
        });
    }

    /**
     * Emits a new stateChanged event providing the given state as update
     * @param {FLJobState} newState the new state that the job is in
     * @param {number} round the round this job is currently processing 
     */
    #emitStateChangedEvent(self, newState, round)
    {
        self.emit('stateChanged', newState, round);
    }

    /**
     * Updates the JobInfo state to be the provided state
     * @param {FLJobState} newState the state that the job info should be updated to
     */
    async #updateJobInfoState(self, newState)
    {
        const round = await self.#updateJobInfo(self, (info) => {
            info.state = newState;
            return info.currentround;
        }); 
        self.#emitStateChangedEvent(self, newState, round);
    } 

    /**
     * Checks whether the job is currently in the given state
     * @param {*} self Reference for a current JobWorker object
     * @param {FLJobState} state The job state to check against
     * @param {JobInfo} jobInfo An already loaded job info object.
     * If this is not provided, one will be loaded form the DB 
     * @returns 
     */
    async #jobIsInState(self, state, jobInfo)
    {
        return jobInfo != undefined ? Promise.resolve(jobInfo.state === state) : self.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await self.#loadJobInfo();
            return jobInfo.state === state;
        });
    }

    /**
     * Checks if the current job has been canceled and 
     * if this is a case, throws a new JobCanceledError
     * @param {*} self Reference for a current JobWorker object
     * @param {JobInfo} jobInfo An already loaded job info object.
     * If this is not provided, one will be loaded form the DB 
     */
    async #throwErrorWhenCancled(self, jobInfo)
    {
        if (await self.#jobIsInState(self, FLJobState.CANCELED, jobInfo))
        {
            throw new JobCanceledError();
        }
    }

    /**
     * Updates the job info to the given state if the job is not canceled.
     * @throws {JobCanceledError} When the job is canceled
     * @param {*} self Reference for a current JobWorker object
     * @param {FLJobState} newState the state that the job info should be updated to
     */
    async #updateJobInfoStateWhenNotCanceled(self, state)
    {
        const round = await self.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await self.#loadJobInfo();
            await self.#throwErrorWhenCancled(self, jobInfo);
            jobInfo.state = state;
            await jobInfo.save();
            return jobInfo.currentround;
        });
        self.#emitStateChangedEvent(self, state, round);
    }

    /**
     * Logs a new log message for this worker
     * @param {*} content 
     * @param {bool} visibileToUser Wheter this los should also be shown as a log visible to the user
     */
    async #log(content, visibleToUser = false)
    {
        this.#logger.log(`${this.#jobId} - ${content}`);
        if (visibleToUser)
        {
            this.#addUserLog(this, content);
        }
    }

    /**
     * Logs a new message form the container that executes the FL learning Task
     * @param {string} content 
     */
    #logContainerOutput(content)
    {
        this.#logger.log(`${this.#jobId} CONTAINER - ${content}`);
        //Needs to be queued or something and then put from the queue to the DB
        this.#addUserLog(this, `CONTAINER - ${content}`);
    }

    /**
     * Logs a new message that is shown to the user of the FL task
     * @param {*} content The content to log
     */
    #addUserLog(self, content)
    {
        //Adds the logs to the queue (ensures correct order of the logs)
        //This Queue then gets cleared ansynchronously and added to the FL object
        self.#clientLogQueue.push(content);
    }   

    /**
     * Function that handles when a new FL event happens
     * @param {*} event The event that has happened
     */
    #handleFlEvent(self, event)
    {
        self.#log(`Received new FL Event ${event.eventtype}`);
        switch (event.eventtype)
        {
            case EventType.NEW_LEARNING_ROUND:
                //No wait here, should run async -> Otherwise the emit method of the caller is blocked
                self.#handleNewLearningRound(self, event);
                break;
            case EventType.ABORTED:
                //No wait here, should run async -> Otherwise the emit method of the caller is blocked
                self.#log(`Job has been canceled by the central component. Will cancel local execution if applicable.`, true);
                self.#handleJobAborted(self);
                break; 
        }
    }

    /**
     * Performs all actions needed to cancel the job locally
     * @param {*} self Reference for a current JobWorker object
     * @param {*} jobInfo The jobInfo object to use
     */
    async #cancelJob(self, jobInfo)
    {
        //Log the correct message according to the current execution state
        self.#log(`Local execution canceled: no further learning round will be executed.`, true);
        if (jobInfo.state === FLJobState.WAITING_FOR_NEXT_ROUND)
        {
            self.#log(`Job has been canceled and can now be removed.`, true);
        } else {
            self.#log(`Please wait for running tasks to finish.`, true);
        }

        //Update the JobState to CANCELED
        jobInfo.state = FLJobState.CANCELED;
        await jobInfo.save();
        
        //Stop listening for new Events
        self.#apiClient.StopListeningForJobEvents();

        //Resolve the cancel promise
        self.#cancelPromiseResolve("canceled");
    }

    /**
     * Handles that the job has been abortet (for whatever reason)
     * @param {*} self A reference to the current flJobWorker object
     * @returns {boolean} Wheter the job has been aborted
     */
    async #handleJobAborted(self)
    {
        let round;
        const canceled = await self.#jobInfoLock.runExclusive(async () => {
            let jobInfo = await self.#loadJobInfo();
            round = jobInfo.currentround;
            //Check if stop is already in state where cancellation does not make a difference
            if (jobInfo.state != FLJobState.ERROR && jobInfo.state != FLJobState.CANCELED && jobInfo.state != FLJobState.FINISHED)
            {
                await self.#cancelJob(self, jobInfo);
                return true;
            } else 
            {
                self.#log(`Cancellation of local execution skipped: Job is already in state ${jobInfo.state}.`, true);
                return false;
            }
        });

        //emit state change outside of lock (preventing potential deadlocks)
        if (canceled)
        {
            self.#emitStateChangedEvent(self, FLJobState.CANCELED, round);
        }
        return canceled;
    }

    /**
     * Updates the Model of the container when a new model was provided for this
     * learning round
     * @param {*} self 
     * @param {*} modelStream 
     * @param {*} container 
     */
    async #updateContainerModel(self, modelStream, container)
    {
        //Put model in container when needed
        if (modelStream != null)
        {
            self.#log("Putting model into container", true); 
            await container.putArchive(modelStream, { path: FLModelPath });
            self.#log("Model successfully put into container", true);
        }
    }

    /**
     * Returns the name that the container of this job should have
     * @param {*} self 
     * @returns A string with the container name
     */
    #getContainerName(self)
    {
        return self.#jobId;
    }

    /**
     * Deletes the docker container for this job if it exists
     * @param {*} self 
     */
    async #ensureJobContainerIsDeleted(self)
    {
        await dockerUtil.ensureContainerWithNameDoesNotExist(self.#getContainerName(self));
    }

    /**
     * Restores LogFiles if they already exists in the GridFS
     * @param {*} self object with a reference to this object
     * @param {*} jobInfo jobInfo object for the current FL job
     * @param {*} container the container for this round
     */
    async #restoreStorageFilesIfNeeded(self, jobInfo, container)
    {
        if (jobInfo.lastLocalStorageGridId || jobInfo.lastGlobalStorageGridId)
        {
            self.#log("Putting existing storage files into container", false);
            
            if (jobInfo.lastLocalStorageGridId)
            {
                let localStorage = await GridFsClient.readFromGridFs(jobInfo.lastLocalStorageGridId);
                await container.putArchive(localStorage, { path: FLLocalStoragePath });
            }

            if (jobInfo.lastGlobalStorageGridId)
            {
                let globalStorage = await GridFsClient.readFromGridFs(jobInfo.lastGlobalStorageGridId);
                await container.putArchive(globalStorage, { path: FLGlobalStoragePath });
            }
            
            self.#log("Existing log files successfully put into container", false);
        }
    }

    /**
     * Creates a container for the current learning round
     * @param {*} self 
     * @param {*} modelPath 
     * @returns 
     */
    async #createContainerForRound(self, modelStream)
    {
        return new Promise(async (res, rej) => 
        {
            try {
                self.#log("Creating Container", true);

                //Ensure container does not already exist 
                //Could be because the job was terminated before
                await self.#ensureJobContainerIsDeleted(self);

                //Set the env variables variable to the correct values
                const container = await self.#jobInfoLock.runExclusive(async () => {
                    const jobInfo = await self.#loadJobInfo(); 
                    let envs = jobInfo.envs.concat([
                        `${FLModelPathEnvName}=${FLModelPath}`,
                        `${FLGlobalStorageEnvName}=${FLGlobalStoragePath}`,
                        `${FLLocalStorageEnvName}=${FLLocalStoragePath}`
                    ]);
                    const container = await dockerUtil.createContainerFromImage(
                        jobInfo.trainstoragelocation,
                        self.#getContainerName(self),
                        envs,
                        jobInfo.binding,
                        jobInfo.shmSize
                    );

                    //Ensure the all needed paths exist
                    await dockerUtil.ensurePathExistsInContainer(container, FLModelPath);
                    await dockerUtil.ensurePathExistsInContainer(container, FLGlobalStoragePath);
                    await dockerUtil.ensurePathExistsInContainer(container, FLLocalStoragePath);
                    
                    //Update model when needed
                    await self.#updateContainerModel(self, modelStream, container);
                    
                    //Restore Logs of they exist
                    await self.#restoreStorageFilesIfNeeded(self, jobInfo, container);
                    return container;
                });

                self.#log("Container created successfully", true);
                res(container);
            } catch (err)
            {
                rej(err)
            }
        }); 
    }

    /**
     * Try to remove the given container and logs a message and updates
     * the job status if removing fails
     * @param {*} self 
     * @param {*} container 
     */
    async #cleanupContainerAfterRound(self, container)
    {   
        try
        {
            //Cleanup container
            self.#log(`Removing container for learning round`, true);
            await dockerUtil.removeContainer(container);
            self.#log(`Container successfully removed`, true);
        } catch (err)
        {
            self.#log(`Training failed: ${err}`, true)
            await self.#updateJobInfoState(self, FLJobState.ERROR);
        }
    }

    #logStartBanner(self, currentRound, numberOfRounds)
    {
        let banner = "###############";
        let roundNumber = (currentRound + "").length;
        let numberOfRoundsNumber = (numberOfRounds + "").length;
        let between = ""
        for (let i = 0; i < roundNumber + numberOfRoundsNumber + 3; i++)
        {
            between += "#"
        }
        self.#log(banner + between + banner, true);
        self.#log(`${banner} ${currentRound}/${numberOfRounds} ${banner}`, true);
        self.#log(banner + between + banner, true);
    }

    /**
     * Handles the start of a new Learning round
     * @param {*} self 
     */
    async #handleNewLearningRound(self, roundEvent) {
        const shouldLearn = await self.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await self.#loadJobInfo();
            
            //DO NOT start the new round when it was canceled
            if (jobInfo.state === FLJobState.CANCELED) return false;
            
            self.#addUserLog(self, "Received event for start of new learning round");
            self.#logStartBanner(self, roundEvent.round, jobInfo.maxrounds);
            self.#log(`Starting training for round ${roundEvent.round} of ${jobInfo.maxrounds}.`, true);
            
            //Update Job Info
            jobInfo.currentround = roundEvent.round;
            jobInfo.state = FLJobState.DOWNLOADING_NEW_MODEL;
            await jobInfo.save();
            return true;
        });
        
        if (shouldLearn) {
            //Learn
            self.#emitStateChangedEvent(self, FLJobState.DOWNLOADING_NEW_MODEL, roundEvent.round);
            await self.#performLearning(self);
        }
    }

    /**
     * Waits for the container to exit and checks wheter the return code indicates success
     * @throws {Error} When the container exit code is not 0
     * @throws {JobCanceledError} When the job has been canceled while the container was running
     * @param {*} self 
     * @param {*} container The container the method should wait for
     */
    async #waitForContainerAndCheckSucess(self, container)
    {
        //Wait for the container to exit or the job to be canceled
        const result = await Promise.any([self.#cancelPromise, container.wait()]); 

        if (result === "canceled")
        {
            //Cancel -> Kill the container (force stop)
            self.#log('Killing running container...', true);
            await container.kill();
            self.#log('...container killed.', true);
            throw new JobCanceledError();
        } else if (result.StatusCode != 0)
        {
            throw new Error(`Learning failed because container exited with code ${result.StatusCode} and message ${result.Error?.Message}`, true);
        }
    }

    /**
     * @param {JobWorker} self A refrence to this class
     * @returns the filename in the gridFS that should be used for the result model
     */
    #getGridFsModelFileName(self)
    {
        return `${self.#jobId}_model`;
    }

    /**
     * @param {JobWorker} self A refrence to this class
     * @returns the filename in the gridFS that should be used for the global storage
     */
    #getGridFsGlobalStorageFileName(self)
    {
        return `${self.#jobId}_global_storage`;
    }

    /**
     * @param {JobWorker} self A refrence to this class
     * @returns the filename in the gridFS that should be used for the local storage
     */
    #getGridFsLocalStorageFileName(self)
    {
        return `${self.#jobId}_local_storage`;
    }

    /**
     * Stores the given stream in the gridFs with the provided filename and updates the given jobInfo property with the new id
     * @param {*} self 
     * @param {*} extractedLogsStream 
     * @returns {*} an readable stream from the gridFS with the stored file
     */
    async #storeStreamInGridFSAndUpdateJobInfo(self, extractedStream, filename, infoProperty)
    {
        try {
            await self.#jobInfoLock.runExclusive(async () => {
                let jobInfo = await self.#loadJobInfo();
                self.#log(`Putting ${filename} into gridFs from stream`, false);
                
                //Remove if old id exists, then store new stream
                await GridFsClient.removeFromGridFsIfDefiend(jobInfo[infoProperty])
                let id = await GridFsClient.storeInGridFs(filename, extractedStream);
                //Store the new ids in the db
                jobInfo[infoProperty] = id;
                jobInfo.save();
            });
            
            self.#log(`Putting ${filename} into gridFs from stream success`, false);
        } catch (err)
        {
            self.#log(`Something went wrong while storing ${filename} in gridFS: ${err}`, true)
            throw new Error(`Learning failed because something went wrong during gridFs storage one of the job results`);
        }
    }

    /**
     * Pushes the model and global storage as the learning results of this round to the CS
     * @param {*} self Instance to this class (selfreference)
     */
    async #pushGlobalStorageAndModelToCs(self)
    {
        await self.#jobInfoLock.runExclusive(async () => {
            //Load the Job
            const jobInfo = await self.#loadJobInfo();
    
            //Push global storage first since a model might directly lead to aggregation (if this is the last model)
            //And then the jobs are potentially missing in the output
    
            //Important: pushing the global storage is not mission critical, therefore the job does
            //not fail when the global storage cannot be pushed
            //silent failure in this case
            //-> Since global storage are restored every round, the next round (if any) will retry sending them
            try {
                //Push Logs to CS
                self.#log("Pushing Global Storage... ", true);
                let storageStream = await GridFsClient.readFromGridFs(jobInfo.lastGlobalStorageGridId);
                await self.#apiClient.PushGlobalStorage(storageStream);
                self.#log("done.", true);
            } catch (err)
            {
                self.#log(`Something went wrong while pushing the global storage to the CS: ${err}`, true)
            }
    
            //Push Model to CS
            try
            {    
                self.#log("Pushing Model... ", true);
                let modelStream = await GridFsClient.readFromGridFs(jobInfo.lastResultGridId);
                await self.#apiClient.PushModel(modelStream);
                self.#log("done.", true);
            } catch (err)
            {
                self.#log(`Something went wrong while pushing the results to the CS: ${err}`, true)
                throw new Error(`Learning failed because something went wrong while pushing the learning results to the CS to the CS`);
            }
        });
    }

    /**
     * Extracts the results, stores them in gridFS and updates the JobInfo accordingly
     * @param {*} self 
     * @param {*} container 
     */
    async #extractResults(self, container)
    {
        //Extract, store in gridFS
        //Important: This needs to be done after one another, you cannot read all archives
        //and then store in gridFS (you need to read, store, read, store)
        //The reason for this is that the docker API waits for the first request for finish before 
        //executing the second request after a certain file size is reached. This then results in the
        //second request pending forever and the station to not progress at all...
        let extractedModelStream = await dockerUtil.extractArchive(container, FLModelPath);
        await self.#storeStreamInGridFSAndUpdateJobInfo(
            self, extractedModelStream,
            self.#getGridFsModelFileName(self),
            'lastResultGridId'
        );
        let extractedGlobalStorage = await dockerUtil.extractArchive(container, FLGlobalStoragePath);
        await self.#storeStreamInGridFSAndUpdateJobInfo(
            self, extractedGlobalStorage,
            self.#getGridFsGlobalStorageFileName(self),
            'lastGlobalStorageGridId'
        );
        let extractedLocalStorage = await dockerUtil.extractArchive(container, FLLocalStoragePath);
        await self.#storeStreamInGridFSAndUpdateJobInfo(self, extractedLocalStorage,
            self.#getGridFsLocalStorageFileName(self),
            'lastLocalStorageGridId'
        );
    }

    /**
     * Returns the jobs current privacy settings as selected by the user
     * @param {*} self Instance to this class (self-reference)
     */
    async #getJobPrivacySetting(self) 
    {
        return self.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await self.#loadJobInfo();
            return jobInfo.privacyMode;
        });
    }

    /**
     * Intiailizes a new promise and corresponding resolve function. The resolve function is provided via the callback.
     * After the creation, the method waits for either the new promise or the cancelPromise to resolve.
     * @param {FLJobWorker} self reference to this object
     * @param {*} resolveFunctionCallback Callback function that will be called with the resolve function for the created promise
     * @throws {JobCanceledError} When the cancelPromise is resolved before the newly created promise
     */
    async #initializeAndWaitForPromise(self, resolveFunctionCallback)
    {
        //Create new promise
        const promise = new Promise((resolve) => {
            resolveFunctionCallback((value) => {
                resolve(value);
            })
        });

        //Wait for the new promise or a cancellation
        const result = await Promise.any([self.#cancelPromise, promise]);
        //reset the resolver to undefined
        resolveFunctionCallback(undefined);
        if (result === "canceled")
        {
            throw new JobCanceledError();
        }
    }

    /**
     * Approves a promise trough the given approval function if the function is defined
     * and the job not cancelled
     */
    async #resolvePromiseIfDefined(promiseResolve, resolvelValue)
    {
        const self = this;
        return await self.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await self.#loadJobInfo();
            if (typeof promiseResolve === "function" && jobInfo.state !== FLJobState.CANCELED)
            {
                promiseResolve(resolvelValue)
            }
        });
    }


    /**
     * This method waits for the user to approve the
     * transmission of analysis results
     * @param {*} self Instance to this class (selfreference)
     */
    async #waitForUserApprovalToSubmitResults(self) 
    {
        self.#log('Approval required: Waiting for your approval before transmitting results.', true);
        self.#log('Please inspect and approve the results or cancel the job.', true);
        //Workflow: First user needs to inspect, then approve. Wait for inspection
        await self.#updateJobInfoStateWhenNotCanceled(self, FLJobState.WAITING_FOR_INSPECTION);
        await self.#initializeAndWaitForPromise(self, (resolver) => {
            self.#userInspectResultPromiseResolve = resolver;
        });
        self.#log('User inspected results, waiting for approval.');

        //User inspected results -> Wait for approval
        await self.#updateJobInfoStateWhenNotCanceled(self, FLJobState.WAITING_FOR_APPROVAL);
        await self.#initializeAndWaitForPromise(self, (resolver) => {
            self.#userApprovalPromiseResolve = resolver;
        });
       
        self.#log('Received approval for result transmission by user.', true);
    }   

    /**
     * If needed, this method waits for the user to approve the
     * transmission of analysis results
     * @param {*} self Instance to this class (selfreference)
     */
    async #ifNeededWaitForUserApprovalToSubmitResults(self)
    {   
        self.#log('Checking if approval by user is required to submit results.', true);

        const privacySetting = await self.#getJobPrivacySetting(self);
        if (privacySetting !== FLPrivacySetting.INSPECT_RESULTS)
        {
            self.#log('Approval not required. Step skipped.', true);
            return;
        }

        await self.#waitForUserApprovalToSubmitResults(self);
    }

    /**
     * Runs one FL round
     * @param {*} self 
     */
    async #performLearning(self)
    {
        let container = undefined;
        try {
            await self.#throwErrorWhenCancled(self);
            //Download Training model and create container with updated model
            self.#log("Starting Model download", true);
            let modelStream = await self.#apiClient.DownloadModel();
            container = await self.#createContainerForRound(self, modelStream);
            
            //Learn
            await self.#updateJobInfoStateWhenNotCanceled(self, FLJobState.LEARNING);  
            self.#log("Starting learning", true); 
            await container.start();
            dockerUtil.writeContainerLogsToLogger(container, (content) => self.#logContainerOutput(content));
            await self.#waitForContainerAndCheckSucess(self, container);
            self.#log("Learning successfully finished", true);

            //Extract results
            await self.#updateJobInfoStateWhenNotCanceled(self, FLJobState.GATHERING_RESULTS);
            self.#log("Extracting results...", true);
            await self.#extractResults(self, container);
            self.#log("...Results extracted.", true);

            //wait for user approval for transmission, if needed
            await self.#ifNeededWaitForUserApprovalToSubmitResults(self);

            //Push model and global storage to CS
            await self.#updateJobInfoStateWhenNotCanceled(self, FLJobState.PUSHING_RESULTS);
            self.#log("Pushing results.", true);
            await self.#pushGlobalStorageAndModelToCs(self)
            self.#log("Results pushed successfully", true);
            
            //Make decision for next round
            await self.#decideNextRound(self);
        } catch (err)
        {
            //Do nothing on cancle
            if (!(err instanceof JobCanceledError))
            {
                self.#log(`Training failed: ${err}`, true)
                await self.#updateJobInfoState(self, FLJobState.ERROR);
                this.#apiClient.StopListeningForJobEvents();
                //Send failure message to the CS
                await this.#apiClient.SendJobFailed();
            }
        }

        await self.#cleanupContainerAfterRound(self, container);
        await self.#logMessageOnCancel(self); 
    }

    /**
     * Logs a last message after job cancellation
     * @param {*} self 
     */
    async #logMessageOnCancel(self)
    {
        if (await self.#jobIsInState(self, FLJobState.CANCELED))
        {
            self.#log(`Job has been canceled and can now be removed.`, true);
        }        
    }

    /**
     * Decides if more training rounds are needed or if the job is finished
     * @param {*} self 
     */
    async #decideNextRound(self)
    {
        let round;
        const state = await self.#updateJobInfo(self, async (info) => {
            //When canceled throw error and dont do anything
            await self.#throwErrorWhenCancled(self, info);
            //When there are still rounds left
            round = info.currentround;
            if (round < info.maxrounds)
            {
                self.#log(`Finished round ${info.currentround} of ${info.maxrounds}, waiting for next round to start.`, true);
                info.state = FLJobState.WAITING_FOR_NEXT_ROUND; 
            } else {
                self.#log(`Finished learning job with last round ${info.currentround} of ${info.maxrounds} rounds.`, true);
                info.state = FLJobState.FINISHED;
                this.#apiClient.StopListeningForJobEvents();
            }
            return info.state;
        });

        if (state !== undefined)
        {
            self.#emitStateChangedEvent(self, state, round);
        }
    }

    //------------------ public Methods ------------------
    
    /**
     * Starts the jobWorker which will start learning as soon as the cs is ready
     * Should only be called once!
     * @return whether the worker could be started
     * @returns A promise that is accepted when learning was started successful and rejected otherwise
     */
    async start() {
        this.#log("Accepting FL Job");

        return new Promise(async (res, rej) => {
            try
            {
                await this.#apiClient.AcceptJob();
                await this.#updateJobInfoState(this, FLJobState.WAITING_FOR_NEXT_ROUND);
                //Start listening for new FL events from the CS
                this.#log("Accepted FL Job. Waiting for FL Events", true);
                this.#apiClient.StartListeningForJobEvents();
                res();
            } catch (err)
            {
                rej(err);
            }
        });
    }

    /**
     * Restarts an already accepted Job that was terminated because the station terminated
     */
    restart()
    {
        this.#apiClient.StartListeningForJobEvents();
        this.#log(`FL Job ${this.#jobId} restarted`);
    }

    /**
     * Should be called when the user inspected the results for the current learning round
     */
    async handleUserInspectedResults()
    {
        return this.#resolvePromiseIfDefined(this.#userInspectResultPromiseResolve, "inspected");
    }

    /**
     * Should be called when the users approves that the current results
     * are pushed to the CS.
     */
    async approveTransmittingResults()
    {
        return this.#resolvePromiseIfDefined(this.#userApprovalPromiseResolve, "approved");
    }

    /**
     * Cancels the current job if it is running
     */
    async cancel() 
    {
        this.#log(`Received request to cancel local execution.`, true);
        const canceled = await this.#handleJobAborted(this);
        if (canceled === true)
        {
            //Send message to CS that job was canceled
            this.#log('Sending cancellation notification to CS.');
            await this.#apiClient.SendJobCanceled();
        }
    }

    /**
     *  Performs cleanup such that the object can be removed
     */
    async dispose()
    {
        //ensure container is removed (e.g. when the job is interrupted this might not be the case)
        await this.#ensureJobContainerIsDeleted(this);
        //Resolve the promise (needed to stop the log worker)
        this.#disposePromiseResolve("disposed");
        //Unsubscribe from events
        this.#apiClient.off('flEvent', (event) => this.#handleFlEvent(this, event));
    }

    /**
     * @param {number} since Return only logs that are > this given logId
     * @returns an array of objects containing a logid and string content
     */
    async getLogs(since = 0) {
        //We use mongo directly here instead of the existing functions and locks.
        //The reason for this is to not have this operation blocking/need locking
        //Otherwise the UI will be slowed down a lot!
        //Moreover, we need this bit more complex aggregation query to only get the needed data
        const jobs = await FLJob.aggregate([
            {
                $match: {
                    jobid: this.#jobId
                }
            },
            //Remove the ids from the logs and project
            {
                $project: {
                    "logs._id": 0,
                    "_id": 0
                }
            },
            //filter the logs to only contain the relevant elements
            {
                $project: {
                    logs: {
                        $filter: {
                            input: "$logs",
                            as: "item",
                            cond: { $gt: [ "$$item.id", Number(since) ] }
                        }
                    }
                }
            }
        ]);
        //We expect exactly one job to be found
        return jobs[0] ? jobs[0].logs : [];
    }

    /**
     * @returns {ReadableStream} A stream of an tar archieve that contains the last results or null if non exist yet
     */
    async getLastResultStream()
    {
        return await this.#jobInfoLock.runExclusive(async () => {
            let jobInfo = await this.#loadJobInfo();
            //No results stored yet
            if (!jobInfo.lastResultGridId)
            {
                return null;
            }

            //Get stream from GridFS Client
            return await GridFsClient.readFromGridFs(jobInfo.lastResultGridId);
        });
    }

    /**
     * @returns {ReadableStream} A stream of an tar archieve that contains the last global storage or null if non exist yet
     */
    async getLastGlobalStorageStream()
    {
        return await this.#jobInfoLock.runExclusive(async () => {
            const jobInfo = await this.#loadJobInfo();
            //No global storage stored yet
            if (!jobInfo.lastGlobalStorageGridId)
            {
                return null;
            }
    
            //Get stream from GridFS Client
            return await GridFsClient.readFromGridFs(jobInfo.lastGlobalStorageGridId);
        });  
    }
}

module.exports = FLJobWorker