const { getResultFileName, getGlobalStorageFileName, FLGlobalStoragePath, FLModelFileName, FLStationStates, FLLocalStoragePath, getLocalStorageFileName} = require('./constants.js');
const minioClient = require('../utils/minio').minioClient;
const FederatedLogger = require('./federatedLogger.js');
const EventType = require('./eventType.js').EventType;
const StationEvent = require('../models').fl_event;
const JobState = require('./jobState.js').JobState;
const Jobinfo = require('../models').fl_jobinfo;
const FLEvents =  require('../models').fl_event;
const Station = require('../models').fl_station;
const Aggregator = require('./aggregation.js');
var Mutex = require('async-mutex').Mutex;
const EventEmitter = require('events');
const _ = require('lodash'); 
const MinioExtractor = require('./resultExtractor/minioExtractor.js');
const HarborExtractor = require('./resultExtractor/harborExtractor.js');

/**
 * Job Worker that handles the learning for one specific federated learning job
 * The following events are emitted: 
 * - newEvents | Called whenever new events for the stations of the job are available. 
 *               The event contains an array with all uids of stations for which an update exists
 */
class JobWorker extends EventEmitter
{
    //------------------ Properties ------------------
    #jobId; 
    #jobInfo = undefined; 
    #strategy = undefined;
    #logger;
    #jobInfoLock;
    #aggregator = undefined;
    #extractor = undefined;
    
    //------------------ Constructor ------------------

    /**
     * Creates a new jobWorker instance for the provided jobId
     * @param {string} jobId The id of the job the worker should handle
     * @param {object} strategy The strategy that should be used for learning. This decides e.g. when the learning starts or is finished
     */
    constructor(jobId, strategy)
    {
        super();
        this.#jobId = jobId;
        this.#strategy = strategy;
        this.#logger = new FederatedLogger();
        this.#jobInfoLock = new Mutex();
    }

    //------------------ private Methods ------------------
    /**
     * Loads the JobInfo object from the DB
     * @param {boolean} forceReload specifies whether the JobInfo object should be forced to reload (needed from time to time)
     */
    async #loadJobInfo(forceReload= false)
    {   
        if (this.#jobInfo == undefined || forceReload)
        {
            //Load from DB (include all associated models and their associations (recursive))
            await Jobinfo.findOne(
                {
                    where: {
                        jobid: this.#jobId
                    }, 
                    include: { all: true, nested: true }
                })
                .then((data) => 
                {
                    this.#jobInfo = data;
                })
                .catch((error) =>
                {
                    this.#logger.log("Error while loading jobInfo object");
                    this.#logger.log(error);
                });
        }
    }

    /**
     * logs a new log message for this worker
     * @param {*} content 
     */
    #log(content)
    {
        this.#logger.log(`${this.#jobId} - ${content}`);
    }

    /**
     * Creates a new event of the provided Type in the db for each station and emits the node event
     * Should only be called with proper locking
     * @param {EventType} eventType 
     */
    async #createStationEvents(eventType)
    {
        console.log(`Creating Station events ${eventType}`);
        //Create the Events in the DB
        var events = await Promise.all(
            this.#jobInfo.Stations.map(async station => 
            {
                var event = await this.#jobInfo.createEvent({
                    stationid: station.id,
                    eventtype: eventType,
                    round: this.#jobInfo.currentround,
                    jobid: this.#jobInfo.id
                })
                station.Events.push(event);
                return event;
            })
        );

        //Add all events to the project (spread operator)
        //Needs to be done outside, otherwise a race condition could occur
        this.#jobInfo.Events.push(...events);

        //Notify with the station uids that had need events created
        this.emit('newEvents', this.#jobInfo.Stations.map(station => station.uid));

        console.log(`Finished Creating Events for ${eventType}`);
    }

    /**
     * Updates the jobInfo jobState
     * Should only be called with proper locking in place
     * @param {JobInfo} jobInfo 
     * @param {JobState} jobState 
     */
    async #updateState(jobInfo, jobState)
    {
        jobInfo.currentstate = jobState;
        await jobInfo.save();
    }

    /**
     * Increases the current round property of the jobInfo object
     * Should only be called with proper locking in place
     * @param {JobInfo} jobInfo 
     */
    async #increaseRound(jobInfo)
    {
        jobInfo.currentround += 1;
        await jobInfo.save();
    }

    /**
     * Resets the doneWithCurrentState value for all stations
     * This way we can reuse the value to track the progress over several states
     * @param {JobInfo} jobInfo 
     */
    async #resetStationsProgressForState(jobInfo)
    {
        for (let i = 0; i < jobInfo.Stations.length; i++) {
            jobInfo.Stations[i].doneWithCurrentState = null;
            jobInfo.Stations[i].failedCurrentRound = null;
            await jobInfo.Stations[i].save();
        }
    }

    /**
     * Starts the next learning Round
     */
    async #startNextLearningRound(jobInfo)
    {
        this.#log(`Starting learning`);
        await this.#updateState(jobInfo, JobState.RUNNING);
        await this.#increaseRound(jobInfo);
        await this.#resetStationsProgressForState(jobInfo);
        await this.#createStationEvents(EventType.NEW_LEARNING_ROUND);
        this.#log(`Learning successfully started`);
    }

    /**
     * Checks whether the learning can initially start (enough stations accepted)
     */
    async #checkClientsReady()
    {
        await this.#jobInfoLock.runExclusive(async () =>
        {
            await this.#loadJobInfo();
                
            this.#log(`Checking if learning can start`);

            //Check if learning can start or needs to be aborted
            if(this.#strategy.canLearningStart(this.#jobInfo))
            {
                await this.#startNextLearningRound(this.#jobInfo);
            } else if (this.#strategy.shouldAbortLearning(this.#jobInfo))
            {
                await this.#updateState(this.#jobInfo, JobState.REJECTED);
                await this.#createStationEvents(EventType.ABORTED);
                this.#log(`Job got rejected`);
            }
        });
    }

    /**
     * Checks whether this has have failed the execution
     * (e.g. to many stations failed)
     */
    async #checkJobFailed()
    {
        await this.#jobInfoLock.runExclusive(async () =>
        {
            await this.#loadJobInfo();
                
            this.#log(`Checking if job failed`);

            if (this.#strategy.jobFailed(this.#jobInfo))
            {
                this.#log(`Job Failed`);

                await this.#updateState(this.#jobInfo, JobState.ERROR);
                //Clear all current events, add new event for abort
                await this.#clearCurrentStationEvents(this, true);
                await this.#createStationEvents(EventType.ABORTED);
                this.#log(`Update job state and send event successfully`);    
            }
        });
    }

    /**
     * Should be called when everything is finished, will perform cleanup steps
     * e.g. remove the minio bucket, etc.
     * Should only be called with proper locking in place
     * @param {JobINfo} jobInfo 
     */
    async #cleanupOnFinishedJob(jobInfo)
    {
        //Update result storage location (Works because extractor is of type harborExtractor)
        jobInfo.resultstoragelocation = this.#extractor.getImagePath();
        await jobInfo.save();

        //Remove minio bucket (not needed anymore)
        //Do not check for errors here, if this fails the job was still successful...
        this.#log("Removing minio bucket");
        let res = await minioClient.removeBucket(this.#jobId);
        this.#log(`Removing minio bucket successful: ${res}`);
    }

    /**
     * Checks whether there are learning rounds left and returns the result
     * @param {*} jobInfo An up to date jobInfo object
     * @returns Whether there are learning rounds left to be executed
     */
    #roundsLeft(jobInfo)
    {
        return jobInfo.currentround < jobInfo.maxrounds;
    }

    /**
     * Checks if the next learning round should be started or if we are finished
     * @param {*} self 
     */
    async #checkNextLearningRound(self)
    {
        await self.#jobInfoLock.runExclusive(async () =>
        {
            await self.#loadJobInfo();

            //If there are still rounds left
            if (self.#roundsLeft(self.#jobInfo))
            {
                self.#log(`Finished round ${self.#jobInfo.currentround} of ${self.#jobInfo.maxrounds}. Starting next round.`);
                await self.#startNextLearningRound(self.#jobInfo);
            } else
            {
                self.#log(`Finished round ${self.#jobInfo.currentround} of ${self.#jobInfo.maxrounds}. Job is finished`);
                self.#log(`Performing cleanup`);
                await self.#cleanupOnFinishedJob(self.#jobInfo);
                await self.#updateState(self.#jobInfo, JobState.FINISHED);
                self.#log(`Cleanup done`);
            }
        });
    }

    /**
     * Acquires the Mutex for the method when specified
     * @param {*} method The method to execute
     * @param {*} locking Whether to acquire the mutex
     */
    async #useLockingWhenNeeded(self, method, locking)
    {
        if (locking)
        {
            await self.#jobInfoLock.runExclusive(async () => {
                //Load JobInfo
                await self.#loadJobInfo();
                //Execute
                await method();
            }); 
        } else {
            await method();
        }
    }

    /**
     * Clears all currently present Station Events
     * @param {*} self Reference to an instance of this jobWorker
     * @param {boolean} locked Indicating whether the external caller already has proper locking in place
     */
    async #clearCurrentStationEvents(self, locked = false)
    {
        await self.#useLockingWhenNeeded(self, async () => {
             //Clear
             self.#log(`Clearing station events from last round`);
             await FLEvents.destroy({ where: { jobid: self.#jobInfo.id } });
 
             //Force reload of JobInfo object to contain the deleted events
             await self.#loadJobInfo(true);
 
             self.#log(`Events successfully cleared`);

        }, !locked);
    }

    /**
     * Callback function for when the aggregation is finished
     */
    async #aggregationFinished(self, error)
    {
        this.#aggregator.removeListener('aggregationFinished', this.#aggregationFinished);

        //Remove all station events from the last round 
        //(Otherwise stations that are terminated might get old events)
        //-> New events on new round, otherwise ABORTED event
        await this.#clearCurrentStationEvents(self);

        if (error != "") {
            //An error occurred during aggregation
            this.#log(`Aggregation failed: ${error}`);
            await this.#updateState(this.#jobInfo, JobState.ERROR);
            //Notify the stations that the job failed, but only if this was not the last round
            await self.#jobInfoLock.runExclusive(async () => {

                await this.#loadJobInfo();
                
                if (this.#roundsLeft(self.#jobInfo)) {
                    await this.#createStationEvents(EventType.ABORTED);
                }
            });
        } else {
            //Success, lets check if we can start the next round
            //No wait, run async
            self.#checkNextLearningRound(self);
        }
    }

    /**
     * Creates a new extractor that can be used in the aggregator, depending on the current state of the JobInfo
     * Should only be called with proper locking in place
     * @param {JobInfo} jobInfo 
     */
    #createExtractor(jobInfo)
    {
        //Check if last round, then aggregate to image, otherwise use minio
        if (jobInfo.currentround == jobInfo.maxrounds)
        {
            return new HarborExtractor(jobInfo.Stations.map(station => station.uid), getGlobalStorageFileName);
        } else
        {
            return new MinioExtractor(getGlobalStorageFileName, getLocalStorageFileName);
        }
    }

    /**
     * Checks whether aggregation can start for this learning round
     */
    async #checkAggregation()
    {
        await this.#jobInfoLock.runExclusive(async () =>
        {
            await this.#loadJobInfo();
                
            this.#log(`Checking if aggregation can start`);

            //Check if aggregation can be started
            if(this.#strategy.canAggregationStart(this.#jobInfo))
            {
                await this.#updateState(this.#jobInfo, JobState.AGGREGATING);
                this.#log(`Starting aggregation in round ${this.#jobInfo.currentround}`);

                this.#aggregator = new Aggregator(this.#jobId); 

                var self = this;
                this.#aggregator.on('aggregationFinished', (err) => self.#aggregationFinished(self, err));
                this.#aggregator.on('newLog', (newLogId) => self.emit('newLog', newLogId));

                //Resolve extractor, then Start aggregation; no wait, should run in background
                this.#extractor = this.#createExtractor(this.#jobInfo);
                this.#aggregator.aggregate(this.#extractor);
            } else
            {
                this.#log(`No yet ready to aggregate`);
            }
        });
    }

    /**
     * Updates the station to either having accepted or rejected the job
     * @param {*} station Sequelize Station object
     * @param {*} accepted whether the station accepted or rejected
     * @param {*} message The message from the station
     * @returns an empty string on success and a error message otherwise
     */
    async #handleStationAcceptRejectUpdated(station, accepted, message)
    {
        if (station.doneWithCurrentState != null)
        {
            this.#log("Station status already set, cannot be updated");
            return "Station status already set, cannot be updated";
        }

        //Update
        station.doneWithCurrentState = accepted; 
        station.message = message;
        await station.save();

        this.#log(`Updating status for station ${station.uid} successfully`);
        
        //await missing on purpose (can be executed async but we don't need to wait here)
        this.#checkClientsReady();

        return "";
    }

    /**
     * Updates the station to have failed the execution of the current round
     * @param {*} station Sequelize Station object
     * @param {*} message The message from the station
     * @returns an empty string on success and a error message otherwise
     */
     async #handleStationFailed(station, message)
     {
         //Do not check if this is already set (multiple retries might send this message multiple times)
         station.failedCurrentRound = true;
         station.doneWithCurrentState = false;
         if (message)
         {
            station.message = message;
         } else 
         {
            station.message = "Execution failed at station";    
         }
         await station.save();
         
         this.#log(`Updated Station with id ${station.uid} to status failed.`);
         
         //await missing on purpose (can be executed async but we don't need to wait here)
         this.#checkJobFailed();
 
         return "";
     }

    //------------------ public Methods ------------------
    /**
     * @returns the id of the job the worker "works"
     */
    getJobId()
    {
        return this.#jobId;
    }

    /**
     * @returns whether this worker can be disposed (cleaned up) 
     */
    async disposable()
    {
        return await this.#jobInfoLock.runExclusive(async () => {
            await this.#loadJobInfo();
            return this.#jobInfo.currentstate == 'rejected' || this.#jobInfo.currentstate == 'finished' || this.#jobInfo.currentstate == 'error';
        });
    }

    /**
     * 
     * @param {string} uid the id of the station that sends the status update
     * @param {FLStationStates} status whether the station accepts the job
     * @param {string} message reason when the job is not accepted
     * @returns {string} error message of empty string on success
     */
    async handleStationStatusUpdate(uid, status, message)
    {
        //Run Exclusive because of the access to the jobInfo objects
        var res = await this.#jobInfoLock.runExclusive(async () =>
        {
            await this.#loadJobInfo();

            this.#log(`Updating status for station ${uid} to ${status} with reason ${message}`);
            var station = _.find(this.#jobInfo.Stations, ['uid', uid]);

            //Check errors
            if (station == undefined)
            {
                this.#log("Station not found in project");
                return "Station not found in project";
            }

            //Handle update
            switch (status)
            {
                case FLStationStates.ACCEPTED: 
                case FLStationStates.REJECTED:
                    return await this.#handleStationAcceptRejectUpdated(station, status == FLStationStates.ACCEPTED, message);
                case FLStationStates.FAILED: 
                    return await this.#handleStationFailed(station, message);
                default:
                    this.#log(`Received unknown Status update with status ${status} from station ${uid}`);
                    return `Unknown status ${status}`;
            }            
        });

        return res;
    }

    /**
     * 
     * @param {string} uid The uid of the station for which the events should be returned
     * @param {int} since The id of the event excluding which the events should be returned
     * @returns 
     */
    async getStationEvents(uid, since)
    {
        return await this.#jobInfoLock.runExclusive(async () => {
            this.#log(`Getting events for station ${uid} since ${since}`);

            await this.#loadJobInfo();

            var station = _.find(this.#jobInfo.Stations, ['uid', uid]);

            //Check errors
            if (station == undefined)
            {
                this.#log("Station not found in project");
                return "Station not found in project";
            }
            
            console.log(`Station has ${station.Events.length} events`);

            //Return all events with an id greater than since
            return _.filter(station.Events, ({ id }) => id > since);
        });
    }

    /**
     * Returns the latest Training model as a FileStream
     * @return A FileStream containing the model file or undefined if something goes wrong. If the file was not found null is returned
     */
    async getTrainingModel()
    {
        if (await minioClient.ensureBucket(this.#jobId))
        {
            return await minioClient.getObject(this.#jobId, FLModelFileName);
        } else
        {
            return undefined;
        }
    }
    
    /**
     * @returns the filename for the training model
     */
    getModelFileName()
    {
        return FLModelFileName;
    }

    /**
     * Saves the given stream as a training result for the station
     * @return An empty string if the results could be handled, an error message otherwise
     */
     async handleStationTrainingResult(stationId, stream)
     {
        return await this.#jobInfoLock.runExclusive(async () => {
            await this.#loadJobInfo();
            this.#log(`Handling training result for Station ${stationId} in round ${this.#jobInfo.currentround}`);

            var station = _.find(this.#jobInfo.Stations, ['uid', stationId]);
            //Check errors
            if (station == undefined)
            {
                this.#log(`Handling training results - Station ${stationId} not found in project`);
                return "Station not found in project";
            }

            //ensure bucket exists
            if (!await minioClient.ensureBucket(this.#jobId)) {

                this.#log(`Handling training results for Station ${stationId} in round ${this.#jobInfo.currentround}: Failed to create bucket`);
                return "Failure while creating bucket";
            }

            //Check if file is already given (one result per station and round)
            var filename = getResultFileName(stationId, this.#jobInfo.currentround);
            if (await minioClient.objectExists(this.#jobId, filename))
            {
                this.#log(`Handling training results for Station ${stationId} in round ${this.#jobInfo.currentround}: Station already supplied result for the round`);
                return "Result for round already exists";
            }

            //Put it into the bucket
            if (!await minioClient.putObject(this.#jobId, filename, stream))
            {
                this.#log(`Handling training results for Station ${stationId} in round ${this.#jobInfo.currentround} : Failed to store learning results`);
                return "Failed to store learning results";  
            } 

            //Check if object in bucket actually exists
            //Does not exist if the stream stopped during putting the object in the bucket
            //e.g. because the station was terminated
            if (!await minioClient.objectExists(this.#jobId, filename))
            {
                this.#log(`Handling training results for Station ${stationId} in round ${this.#jobInfo.currentround}: Stream was empty`);
                return "Stream was empty, please provide a valid tar archive";
            }

            //Update the Station to be finished with the current round
            station.doneWithCurrentState = true;
            await station.save();  
            
            //Check if aggregation can start (wait missing on purpose)
            this.#checkAggregation();

            this.#log(`Handling training results for Station ${stationId} in round ${this.#jobInfo.currentround}: Successfully saved results`);
            return "";
        });
     }
    
     /**
     * Saves the given stream as a training result for the station
     * @return An empty string if the results could be handled, an error message otherwise
     */
      async handleStationStorageUpdate(stationId, stream)
      {
         return await this.#jobInfoLock.runExclusive(async () => {
             await this.#loadJobInfo();
             this.#log(`Handling global storage for Station ${stationId}`);
 
             var station = _.find(this.#jobInfo.Stations, ['uid', stationId]);
             //Check errors
             if (station == undefined)
             {
                 this.#log(`Handling global storage - Station ${stationId} not found in project`);
                 return "Station not found in project";
             }
 
             //ensure bucket exists
             if (!await minioClient.ensureBucket(this.#jobId)) {
 
                 this.#log(`Handling global storage for Station ${stationId}: Failed to create bucket`);
                 return "Failure while creating bucket";
             }
 
             //Check if file is already given (one result per station and round)
             var filename = getGlobalStorageFileName(stationId);

             //Put it into the bucket
             if (!await minioClient.putObject(this.#jobId, filename, stream))
             {
                 this.#log(`Handling global storage for Station ${stationId}: Failed to store global storage`);
                 return "Failed to store global storage results";  
             } 
 
             //Check if object in bucket actually exists
             //Does not exist if the stream stopped during putting the object in the bucket
             //e.g. because the station was terminated
             if (!await minioClient.objectExists(this.#jobId, filename))
             {
                 this.#log(`Handling global storage for Station ${stationId}: Stream was empty`);
                 return "Stream was empty, please provide a valid tar archive";
             }
              
             this.#log(`Handling global storage for Station ${stationId}: Successfully saved results`);
             return "";
         });
      }
    
}

module.exports = JobWorker