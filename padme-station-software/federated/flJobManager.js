const { FLJob, FLJobState } = require('../models/FLJob');
const FederatedLogger = require('./federatedLogger.js');
const FLJobWorker = require('./flJobWorker.js');
const EventEmitter = require('events');
const _ = require('lodash');

class JobUpdate
{
    /**
     * 
     * @param {number} id the id of the update
     * @param {number} jobId the id of the job that is affected from this update
     * @param {FLJobState} state the new state of the job
     * @param {number} round the new round of the job
     */
    constructor(id, jobId, state, round)
    {
        this.id = id;
        this.jobId = jobId;
        this.state = state;
        this.round = round;
    }
}

class FLJobManager extends EventEmitter
{
    //------------------ Properties ------------------
    #logger;
    #jobUpdates;
    #jobUpdateId;
    #jobUpdateListeners;
    #workers;

    //------------------ Constructor ------------------

    /**
     * 
     * @returns A singleton JobManager object
     */
    constructor() {
        super();
        //Ensure only one JobManager can be created
        if (FLJobManager._instance) {
            return FLJobManager._instance;
        }
        FLJobManager._instance = this;

        //Properties
        this.#workers = {}
        this.#jobUpdates = {};
        this.#jobUpdateListeners = {};
        this.#jobUpdateId = 0;
        this.#logger = new FederatedLogger();
    }

    //------------------ private Methods ------------------

    /**
     * Restarts the given job
     * @param {FLJobWorker} jobWorker 
     */
    async #restartJob(job, jobWorker)
    {  
        //Check if job needs to started or restarted
        //Since the job was already stored in the DB, accepting the job seemed to have failed last time
        if (job.state == FLJobState.WAIT_FOR_ACCEPT)
        {
            try {
                await jobWorker.start();
                console.log(`job ${job.jobid} started`);
            } catch (err)
            {
                console.log(`(Re)Starting job with id ${job.jobid} failed`); 
                console.log(err);
            }
        } else
        {
            jobWorker.restart();
            console.log(`job ${job.jobid} restarted`);
        }
    }

    /**
     * @param {number} jobId 
     * @returns {FLJobWorker} A new job worker instance for the given job id
     */
    #createJobWorkerForId(jobId)
    {
        const self = this;
        //Create the worker
        const worker = new FLJobWorker(jobId); 
        this.#workers[jobId] = worker;
        //Subscribe to event updates
        this.#jobUpdateListeners[jobId] = (state, round) => {
            //Only add if the worker has not been removed
            if (self.#workers[jobId])
            {
                //Only keep the last update of each job (constant memory overhead)
                self.#jobUpdates[jobId] = new JobUpdate(++self.#jobUpdateId, jobId, state, round);
                self.emit('newJobUpdates', self.#jobUpdateId);
            }
        };
        worker.on('stateChanged', this.#jobUpdateListeners[jobId]);
        return worker;
    }
 
    //------------------ public Methods ------------------
    /**
     * Creates a new FL jobWorker that is stored in the DB
     * @param {*} jobId If of the job
     * @param {*} pid metadata id of the job
     * @param {*} trainclassidlearning train that should be used for learning
     * @param {*} learningstoragelocation the location where to pull the learning image from
     * @param {*} currentround The current run of the job
     * @param {*} maxrounds Max number of rounds the job should run
     * @param {*} envs The array with environment variables
     * @param {*} mount Infos about the mount point if any
     * @param {*} shmSize Shared Memory Size
     * @param {PrivacySetting} privacySetting Which privacy mode should be used for this job
     * @returns 
     */
    async createNewWorker(
        jobId, pid, trainclassidlearning, learningstoragelocation, 
        currentround, maxrounds, envs, mount, shmSize, privacySetting)
    {
        this.#logger.log(`Creating new JobWorker for job ${jobId}`);
        this.#logger.log(`Creating new entry in database for job ${jobId}`);
        
        // save pulled job information on local db
        await FLJob.create({
            "jobid": jobId,
            "pid": pid,
            "trainclassidlearning": trainclassidlearning,
            "trainstoragelocation": learningstoragelocation,
            "currentround": currentround,
            "maxrounds": maxrounds,
            "envs": envs, 
            "binding": mount,
            "shmSize": shmSize,
            "privacyMode": privacySetting
        });
        this.#logger.log(`Database entry successfully created`);

        return this.#createJobWorkerForId(jobId);
    }

    /**
     * 
     * @param {string} jobId The id of the job the worker should be returned for
     * @returns {FLJobWorker} A job worker object for the given jodId or undefined if none could be found
     */
    lookupJobWorker(jobId)
    {
        return this.#workers[jobId];
    }

    /**
     * Creates new JobWorker for all jobs that are not yet finished
     * Can be used to restart Jobs after e.g. the Station has been stopped
     * @param {*} jobId 
     */
    async restartPendingJobs()
    {
        //Get all jobs
        let jobs = await FLJob.find();

        //Create a worker for each job
        for (let job of jobs)
        {
            if (!this.#workers[job.jobid])
            {
                
                //Create new worker
                const worker = this.#createJobWorkerForId(job.jobid);
                
                //Check if restart is needed
                if (job.state != FLJobState.ERROR &&
                    job.state != FLJobState.CANCELED && 
                    job.state != FLJobState.FINISHED)
                {
                    //Restart that job
                    console.log(`Restarting job ${job.jobid}`);
                    this.#restartJob(job, worker);
                }
            }
        }
    }

    /**
     * 
     * @param {number} updateId The first update id not to include
     * @returns {JobUpdate[]} The job update elements that have bigger ids than the provided one
     */
    getJobUpdatesSince(updateId)
    {
        return _.filter(Object.values(this.#jobUpdates), (update) => update.id > updateId);
    }

    /**
     * Removes the jobWorker with the given id from the lookup
     * @param {*} jobId The id of the job the worker should be removed
     */
    async removeJobWorkerIfExists(jobId)
    {
        if (this.#workers[jobId])
        {
            this.#workers[jobId].off('stateChanged', this.#jobUpdateListeners[jobId]);
            delete this.#workers[jobId];
            delete this.#jobUpdateListeners[jobId];

            //Also remove the latest update if exist
            if (this.#jobUpdates[jobId]) {
                delete this.#jobUpdates[jobId];
            }
        }
    }
}

module.exports = FLJobManager