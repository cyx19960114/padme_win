const { FLRepositoryLearningImageName,getHarborName, getProjectHarborName, FLStationStates} = require('../federated/constants.js');
const { asyncHandler } = require('../utils').asyncHandler;
const JobManager = require('../federated/jobManager');
const Jobinfo = require('../models').fl_jobinfo;
const AggregationLog = require('../models').AggregationLog;
const Station = require('../models').fl_station;
const harborUtil = require('../utils').harbor;
const WaitQueue = require('wait-queue');
const { v1: uuidv1 } = require('uuid');
const { Readable } = require("stream");
const { Op } = require("sequelize");
const _ = require('lodash');
const zlib = require('node:zlib');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a DTO object for a given StationEvent
 * @param {*} Event 
 * @returns 
 */
function makeEventDTO(event)
{
    return {
        id: event.id, 
        eventtype: event.eventtype, 
        round: event.round
    };
}

/**
 * Reads the variable from the query if possible and returns the default otherwise
 * @param {*} variable The query variable to read from
 * @param {*} defaultValue The value to use of the query does not contain the variable
 */
function readFromQuery(variable, defaultValue)
{
    if (typeof variable !== 'undefined' && !(variable  === ""))
    {
        return variable; 
    }
    return defaultValue;
}

/**
 * Ensures that the given request provides content in the expected format
 * Send a 400 response with a suitable error message otherwise
 * @param {*} req 
 * @param {*} res 
 * @param {*} expectedType 
 * @returns whether the expected type was met
 */
function ensureContentType(req, res, expectedType)
{
    //Check if the supplied req contains a data stream
    if (req.get('Content-Type') != expectedType)
    {
        console.log(`Result should be ${expectedType} archive but is ${req.get('Content-Type')}`);
        res.status(400).send(`Result should be ${expectedType} archive but is ${req.get('Content-Type')}`);
        return false;
    }
    return true;
}

/**
 * Tries to get the worker for the given job. 
 * If none could be found, the method sends an appropriate error message 
 * via the provided res object 
 * @param {*} res Results object from express
 * @param {*} jobId the if of the job to search the worker for
 * @returns the worker object or undefined if none could be found
 */
async function getJobWorker(res, jobId)
{
    var worker = await new JobManager().lookupJobWorker(jobId); 
    if (worker == undefined)
    {
        console.log("JobId not found or job id finished");
        res.status(400).send("JobId not found or job id finished");
        return;
    }
    return worker;
}


async function getLogsForAggregationJob(jobId, since) {
    return await AggregationLog.findAll({
        where: {
            jobid: jobId,
            id: {
                [Op.gt]: since
            }
        },
        order: [
            'createdAt'
        ]
    });
}

module.exports = {

    /**
     * Lists all federated Job Requests
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    list(req, res) {

        const userID = req.kauth.grant.access_token.content.preferred_username;

        //Start building the where statement
        let wherestatement = { userid: userID }

        if (typeof req.query.statusFilter !== 'undefined' && !(req.query.statusFilter  === ""))
        {
            //if a Statusfilter is provided, add the filter to the query
            wherestatement.currentstate = { [Op.or]: req.query.statusFilter.split(',') }
        }

        //Execute query
        return Jobinfo
            .findAll({
                where: wherestatement,
                order: [
                    ['createdAt', 'DESC']
                ],
                include: 'Stations'
            })
            .then((data) => res.status(200).send(data))
            .catch((error) => { 
                console.log(error);
                res.status(400).send(error); });
    },
    
    /**
     * List all federated Job Requests for a specific station
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    listForStation(req, res) {
        
        return Jobinfo
            .findAll({
                attributes: ['jobid', 'pid', 'trainclassidlearning', 'learningstoragelocation', 'currentround', 'maxrounds'],
                where: {
                    currentstate: 'wait_for_acceptance'
                }, 
                include:
                {
                    model: Station,
                    as: 'Stations',
                    where: 
                    {
                        uid: req.params.id, 
                        doneWithCurrentState: null
                    },
                    attributes: []  
                }
            })
            .then((data) => res.status(200).send(data))
            .catch((error) => { res.status(400).send(error); });
    },

    /**
     * Creates a new Federated Job request
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    add : asyncHandler(async (req, res, next) => {
        var jobID = uuidv1();
        var userID = req.harbor.auth.preferred_username;

        console.log(`Request to add new FL jo with ID ${jobID}`);

        const pid = `https://registry.padme-pht.com/${uuidv1()}`;

        //Parse information from request
        const learningImage = req.body.trainclassLearning;
        const aggregationImage = req.body.trainclassAggregation;
        const rounds = req.body.rounds;
        const stations = req.body.stations;
        const projectName = learningImage.split("/")[1];

        //Check if project is processing
        if (new JobManager().isProcessing(projectName))
        {
            console.log("Failed to add job because project is still processing");
            res.status(400).send("Project is still processing, please try again later");
            return;
        }

        let harborProject = getProjectHarborName(projectName);
        let harborFullPath = getHarborName(projectName, FLRepositoryLearningImageName);
        let learningTag = learningImage.substring(learningImage.lastIndexOf(':') + 1);

        //Add users to harbor project if needed
        try
        {
            console.log("Ensuring stations have access to harbor project");
            await harborUtil.ensureProjectUsers(req, harborProject, stations);
            console.log("Ensuring stations have access to harbor project done");
        } catch (err)
        {
            console.log(`Something went wrong during creation of job with ID ${jobID}`);
            console.log(err);
            res.status(400).send("Failed to add at least one station to the harbor repo.");
            return 
        }
    
        //Create Object at DB
        Jobinfo.create({
            jobid: jobID,
            pid: pid,
            userid: userID,
            trainclassidlearning: learningImage,
            learningstoragelocation: `${harborUtil.getHost()}/${harborFullPath}:${learningTag}`,
            trainclassidaggregation: aggregationImage,
            maxrounds: rounds,
            currentround: 0,
            currentstate: "wait_for_acceptance"
        }).then(async info => {

            await Promise.all(
                stations.map(station =>
                    info.createStation({
                        uid: station
                    })
                )
            );

            //Let the jobManager create a new worker for this job
            new JobManager().createNewWorker(info.jobid); 
            console.log(`Finished creating job with ID ${jobID}`);

            res.status(201).send(info);
        }).catch(error => {
            console.log(`Something went wrong during creation of job with ID ${jobID}`);
            console.log(error);
            res.status(400).send(error);
        });
    }),

    /**
     * Handles the status updates from the stations for specific federated jobs
     */
    handleStatusUpdate : asyncHandler(async (req, res, next) =>
    {
        var stationId = req.params.stationId; 
        var jobId = req.params.jobId;

        console.log(`Request for status update for station ${stationId} and job ${jobId}`);

        //Read parameter
        var status = req.body.status; 
        var message = req.body.message;

        //Check values
        if (status == null || message == null)
        {
            console.log("Invalid body. Please provide the properties 'status' and 'message'");
            res.status(400).send("Invalid body. Please provide the properties 'status', and 'message'");
            return;
        }

        //Check if status has a valid value
        if(!_.has(FLStationStates, status))
        {
            console.log(`Station specified invalid status: ${status}`);
            res.status(400).send(`Invalid status. Valid status values are: ${_.keys(FLStationStates)}`);
            return;
        }   
        
        //Get Job worker
        var worker = await getJobWorker(res, jobId);
        if (!worker) return;

        //Handle update
        var result = await worker.handleStationStatusUpdate(stationId, status, message);

        if (result == "")
        {
            console.log(`Request for status update for station ${stationId} and job ${jobId} successful`);
            res.status(200).send();
        } else
        {
            console.log(`Something went wrong during request for status update for station ${stationId} and job ${jobId}: ${result}`);
            res.status(400).send(result);
        }
    }), 

    /**
     * Returns the current learning events for a station and job
     */
    getEventsForStation : asyncHandler(async (req, res, next) =>
    {
        var stationId = req.params.stationId; 
        var jobId = req.params.jobId;   
        var since = readFromQuery(req.query.since, -1); //Default -1 -> all events
        var timeout = readFromQuery(req.query.timeout , 30 * 1000); //Default -> 30 seconds

        //Get Job worker
        var worker = await getJobWorker(res, jobId);
        if (!worker) return;
        
        console.log(`Request for events for station ${stationId} and job ${jobId} since event ${since}`);

        //last point in time the request can finish
        var finish = new Date(new Date().getTime() + timeout);
        var result = [];

        //Check if there are already new events for the station
        var result = await worker.getStationEvents(stationId, since);
        if (result.length > 0)
        {
            console.log(`Returning ${result.length} events for station ${stationId} and job ${jobId} since event ${since}`);
            res.status(200).send(result.map(makeEventDTO));
            return;
        }

        //If not -> long polling, lets wait for events to happen
        //Add to the WaitQueue whenever there is a new update to our station
        const queue = new WaitQueue();
        const eventListener = (stations) => {
            if (stations.includes(stationId))
            {
                queue.push(stationId);
            }
        }
        worker.on('newEvents', eventListener);

        //Retry to find events till success or time is up
        while (Date.now() < finish && result.length == 0)
        {
            var difference = finish - Date.now();
            //Wait the remaining time
            const promiseTimeout = new Promise((resolve, reject) => {
                setTimeout(resolve, difference, "timeout");
            });

            //Wait for the Timeout or the WaitQueue to finish
            var value = await Promise.any([promiseTimeout, queue.shift()]); 

            //Check if the timeout or the queue finished 
            if (value != "timeout")
            {
                result = await worker.getStationEvents(stationId, since);
            }
        }

        //Send result
        worker.removeListener('newEvents', eventListener);
        console.log(`Returning ${result.length} events for station ${stationId} and job ${jobId} since event ${since}`);
        res.status(200).send(result.map(makeEventDTO));
    }), 

    /**
     * Returns the current training model for the training station and job id
     */
    getLatestModel: asyncHandler(async (req, res, next) =>
    {
        var jobId = req.params.jobId
        console.log(`Request for learning model for job ${jobId}`);

        //Get Job worker
        var worker = await getJobWorker(res, jobId);
        if (!worker) return;

        var fs = await worker.getTrainingModel();

        //Check errors
        if (fs === undefined) {
            console.log(`Something went wrong during model request for job ${jobId}`);
            res.status(500).send();
            return;
        } else if (fs === null) {
            console.log(`No Model for job ${jobId} found`);
            res.status(204).send();
            return;
        } else {
            console.log(`Returning model for job ${jobId}`);
            //Send the File
            res.writeHead(200, {
                "Content-Type": "application/x-tar",
                "Content-Disposition": "attachment; filename=" + worker.getModelFileName()
            });
    
            Readable.from(fs).pipe(res);
        }
    }),
    
    /**
     * Handles the results of a training round from a specific learning round
     */
     handleStationResult: asyncHandler(async (req, res, next) =>
     {
        var stationId = req.params.stationId; 
        var jobId = req.params.jobId

        console.log(`Request for adding new learning results for station ${stationId} and job ${jobId}`);

        //Get Job worker
        var worker = await getJobWorker(res, jobId);
        if (!worker) return;

        // ensure content is tar archive
        if (!ensureContentType(req, res, "application/x-tar")) return;

        // If compressed with gzip, inflate
        if (req.get('Content-Encoding') === 'gzip') {
            req = req.pipe(zlib.createGunzip());
        }

        var result = await worker.handleStationTrainingResult(stationId, req);

        if (result != "")
        {
            console.log(`Something went wrong during request adding new learning results for station ${stationId} and job ${jobId}: ${result}`);
            res.status(400).send(result);
        } else
        {
            res.status(200).send();
        }
     }),

     /**
     * Handles a station sending new global storage
     */
     handleStationStorage: asyncHandler(async (req, res, next) =>
     {
        var stationId = req.params.stationId; 
        var jobId = req.params.jobId

        console.log(`Request for updating global storage for ${stationId} and job ${jobId}`);

        //Get Job worker
        var worker = await getJobWorker(res, jobId);
        if (!worker) return;

        // ensure content is tar archive
        if (!ensureContentType(req, res, "application/x-tar")) return;

        // If compressed with gzip, inflate
        if (req.get('Content-Encoding') === 'gzip') {
            req = req.pipe(zlib.createGunzip());
        }

        //Handle the log update
        var result = await worker.handleStationStorageUpdate(stationId, req);
        if (result != "")
        {
            console.log(`Something went wrong during request for updating global storage for station ${stationId} and job ${jobId}: ${result}`);
            res.status(400).send(result);
        } else
        {
            res.status(200).send();
        }
     }),

     /**
      * Returns the logs from the aggregation container
      */
     getAggregationLogs: asyncHandler(async (req, res, next) => {
        const jobId = req.params.jobId;
        const { since = 0 } = req.query;
        const timeout = 30 * 1000; // Default timeout 30s
        const finish = new Date(new Date().getTime() + timeout);

        let logs = await getLogsForAggregationJob(jobId, since);

        // Check if logs are present that can be sent
        if (logs.length > 0) {
            res.status(200).send(logs);
            return;
        }

        const worker = await getJobWorker(res, jobId);
        if (!worker) return;

        // If no (new) logs are present currently, long polling and wait for new logs
        const queue = new WaitQueue();
        const eventListener = (id) => {
            if (id > since) {
                queue.push(id);
            }
        }
        worker.on('newLog', eventListener);

        while (Date.now() < finish && logs.length === 0) {
            const difference = finish - Date.now();
            //Wait the remaining time
            const promiseTimeout = new Promise((resolve) => {
                setTimeout(resolve, difference, "timeout");
            });

            //Wait for the Timeout or the WaitQueue to finish
            const value = await Promise.any([promiseTimeout, queue.shift()]); 

            //Check if the timeout or the queue finished 
            if (value != "timeout") {
                //Wait 500ms to have the possibility to get concurrent logs
                //->reduces number of packets transmitted and should not be
                //noticeable for the user
                await delay(500);
                logs = await getLogsForAggregationJob(jobId, since);
            }
        }

        //Send result
        worker.removeListener('newLog', eventListener);
        res.status(200).send(logs);

     })
};