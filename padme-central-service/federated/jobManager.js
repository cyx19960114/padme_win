const _ = require('lodash'); 
const JobWorker = require('./jobWorker.js');
const FederatedLogger = require('./federatedLogger.js');
const BasicStrategy = require('./strategies/basicStrategy.js');
const Jobinfo = require('../models').fl_jobinfo;

class JobManager
{
    //------------------ Properties ------------------
    #logger;
    #workers;
    #processing
    #cleanupInterval; 

    //------------------ Constructor ------------------

    /**
     * 
     * @returns A singleton JobManager object
     */
    constructor() {
        //Ensure only one JobManager can be created
        if (JobManager._instance) {
            return JobManager._instance;
        }
        JobManager._instance = this;

        //Properties
        this.#workers = {}
        this.#processing = [];
        this.#logger = new FederatedLogger();
        this.#cleanupInterval = undefined;
    }

    //------------------ private Methods ------------------
    /**
     * Method that is executed to cleanup old Job worker instances after a certain time
     */
    async #removeOldWorker(self)
    {
        self.#logger.log(`Cleanup of old job workers started`);

        //Check if worker can be disposed, if yes, remove
        let startCount = _.keys(self.#workers).length;
        for (let worker of _.keys(self.#workers))
        {
            if (self.#workers[worker] && await self.#workers[worker].disposable())
            {
                self.#logger.log(`Cleaning up worker for job with id ${self.#workers[worker].getJobId()}`);
                delete self.#workers[worker];
            }
        }
        let endCount = _.keys(self.#workers).length;
        self.#logger.log(`Cleanup of old job workers finished, removed ${startCount - endCount} workers, ${endCount} remaining`);
    }

    //------------------ public Methods ------------------

    createNewWorker(jobId)
    {
        this.#logger.log(`Creating new JobWorker for job ${jobId}`);
        var worker = new JobWorker(jobId, new BasicStrategy()); 
        this.#workers[jobId] = worker;
        return worker;
    }

    /**
     * 
     * @param {string} jobId The id of the job the worker should be returned for
     * @returns {JobWorker} A job worker object for the given jodId or undefined if none could be found
     */
    async lookupJobWorker(jobId)
    {
        let exists = this.#workers[jobId];
        if (exists)
        {
            return exists;     
        }

        //Lookup in DB (if job exists, the worker has been suspended because it was finished)
        try
        {
            await Jobinfo.findOne({ where: { jobid: jobId } });

            //Job exists in db, lets recreate the worker
            var worker = new JobWorker(jobId, new BasicStrategy());
            this.#workers[jobId] = worker;
            return worker;
        } catch(error)
        {
            return undefined;
        }
    }

    /**
     * Add project to List of projects that are currently processed
     * @param {string} project project to add
     */
    addProjectToProcessingList(project)
    {
        if (this.#processing.indexOf(project) == -1)
        {
            this.#processing.push(project);
        }
    }

    /**
     * Removes project from List of projects that are currently processed
     * @param {string} project project to remove
     */
    removeProjectFromProcessingList(project)
    {
        if (this.#processing.indexOf(project) > -1)
        {
            this.#processing = this.#processing.filter(element => element !== project);
        }
    }

    /**
     * @returns a list of projects that are currently being processed
     */
    getProcessingList()
    {
        return this.#processing;
    }

    /**
     * Returns whether a project is currently being processed
     * @param {string} project project to remove
     */
    isProcessing(project)
    {
        return this.#processing.indexOf(project) > -1;
    }


    /**
     * Starts a interval in the background that cleanups old jobWorker instances from the lookupTable
     */
    startCleanup()
    {
        if (!this.#cleanupInterval)
        {
            //Call removeOldWorker every 15 minutes
            let time_ms = 1800000;
            let self = this;
            this.#logger.log(`Starting background interval for cleanup. Executing every ${time_ms/1000} sek.`);
            this.#cleanupInterval = setInterval(this.#removeOldWorker, time_ms, self);
        }
    }
    
    /**
     * Stops the background cleanup interval
     */
    dispose()
    {
        if(this.#cleanupInterval)
        {
            this.#logger.log(`Stopping background interval for cleanup`);
            clearInterval(this.#cleanupInterval);
        }
    }
}

module.exports = JobManager