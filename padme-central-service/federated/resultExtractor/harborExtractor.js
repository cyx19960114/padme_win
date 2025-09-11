const dockerUtil = require('../../utils').docker;
const harborUtil = require('../../utils').harbor;
const { getResultsHarborName } = require('../constants.js');
const minioClient = require('../../utils/minio').minioClient;
var path = require('path');
const { harbor } = require('../../utils');

/**
 * Extracts results form a learning round into minio
 */
class HarborExtractor
{
    //------------------ Properties ------------------
    #imagePath = "";
    #stationIds = [];
    #getGlobalStorageFileName;

    //------------------ Constructor ------------------
    
    /**
     * 
     * @param {string[]} stationLogIds The ids of stations from which teh logs should be put into the image
     * @param {function} getStorageNameForStation A function that returns the correct name for the logs of a given station id
     */
    constructor(stationLogIds, getGlobalStorageFileName)
    { 
        this.#stationIds = stationLogIds;
        this.#getGlobalStorageFileName = getGlobalStorageFileName;
    }
    
    //------------------ internal Methods ------------------
    /**
     * Returns Stream for the station with id
     * @param {string} station id of the station
     * @param {string} jobId the id of the current job
     * @param {*} logger function allowing to log messages regarding the progress
     * @returns 
     */
    async #getStreamForStation(station, jobId, logger)
    {
        let objectName = this.#getGlobalStorageFileName(station);
        let objectStream = undefined;
        try {  
            //This might fail because the station did not provide any logs
            objectStream = await minioClient.getObject(jobId, objectName);
        } catch (err)
        {   
            logger(`station with id ${station} did not have any logs`);
        }
        return objectStream;
    }

    /**
     * Moves 
     * @param {*} container 
     * @param {*} jobId 
     * @param {*} globalStoragePath 
     * @param {*} logger 
     */
    async #moveGlobalStorageInSubfolder(container, jobId, globalStoragePath, logger)
    {
        //Temporarily store the global Storage back in minio
        logger("Moving current global storage in minio...");
        let minioName = this.#getGlobalStorageFileName(jobId);
        var archiveStream = await dockerUtil.extractArchive(container, globalStoragePath);
        await minioClient.putObject(jobId, minioName, archiveStream); 
        logger("Current global storage put into minio.");

        //Clear folder
        await dockerUtil.clearFolderContents(container, globalStoragePath);

        //Get global Storage from minio into in subfolder
        logger("Putting current global storage in subfolder");
        let targetPath = path.join(globalStoragePath, 'aggregation');
        await dockerUtil.ensurePathExistsInContainer(container, targetPath);
        let stream = await minioClient.getObject(jobId, minioName);
        await container.putArchive(stream, { path: targetPath });
        logger("Current global storage put into subfolder.");
    }

    /**
     * Puts the logs from the stations into this container
     * @param {*} container container to put the logs in
     * @param {string} jobID the id of the current job
     * @param {*} logger function allowing to log messages regarding the progress
     */
    async #putGlobalStorage(container, jobId, globalStoragePath, logger) {

        //First, ensure global storage path exists
        await dockerUtil.ensurePathExistsInContainer(container, globalStoragePath); 

        //Put current content in subfolder
        await this.#moveGlobalStorageInSubfolder(container, jobId, globalStoragePath, logger);

        //Now, put the global storage in for each station
        for (let station of this.#stationIds)
        {
            logger(`Putting global storage from station with id ${station}`);
            let objectStream = await this.#getStreamForStation(station, jobId, logger);

            //If log exists
            if (objectStream != undefined && objectStream != null)
            {
                let targetPath = path.join(globalStoragePath, station);
                await dockerUtil.ensurePathExistsInContainer(container, targetPath);
                await container.putArchive(objectStream, { path: targetPath });
                logger(`Global storage from station with id ${station} done`);
            }
        }
    }

    /**
     * Ensures that the harbor project for the user exists
     * @param {*} user 
     * @returns A Promise
     */
    async #ensureHarborProject(user)
    {
        return new Promise((accept, reject) =>
        {   
            //Authenticate
            let auth = {};
            harborUtil.authAsAdmin(auth, async (err) =>
            {  
                if(err)
                {
                    reject(err); 
                    return;
                }

                //Create Project if needed
                try {
                    await harborUtil.ensureProjectExists(auth, user, true);
                } catch(error)
                {
                    reject(error);
                    return;
                }
                accept();
            })
        })

       
    }

    //------------------ public Methods ------------------

    /**
     * Extracts results from the provided path in the container to the minio instance for this job
     * @param {*} container The container containing the aggregation results
     * @param {*} jobId The id of the job
     * @param {*} dataPath the path inside the container that should be extracted
     * @param {string} globalStoragePath The path for the global storage
     * @param {string} localStoragePath The path for the local storage
     * @param {*} logger function allowing to log messages regarding the progress
     */
    async extractResult(container, jobId, user, sourcePath, dataPath, globalStoragePath, localStoragePath, logger)
    {
        logger("Extracting results into new docker image");
        let projectName = getResultsHarborName(user);
        let repoName = jobId;
        let dest = `${harborUtil.getHost()}/${projectName}/${repoName}`;

        //Ensure the project exists in harbor
        logger(`Ensuring harbor project for user ${user} exists`);
        await this.#ensureHarborProject(projectName)
        logger(`Ensured harbor project for user ${user} exists.`);

        //Remove the aggregation sources from the image
        await dockerUtil.clearFolderContents(container, sourcePath);

        //Clear the local storage folder
        await dockerUtil.clearFolderContents(container, localStoragePath);

        logger("Extraction done");
        logger("Putting global storage into the image");

        //Put the Logs into the image
        await this.#putGlobalStorage(container, jobId, globalStoragePath, logger);    
    
        //Commit the aggregation results into a new image
        await container.commit(
            {
                repo: dest
            }
        );
        logger(`New image ${dest} committed`);

        logger(`Pushing image to target...`);
        let image = dockerUtil.instance.getImage(dest);
        await dockerUtil.pushImageWithAuth(image);
        this.#imagePath = dest;
        logger("Image successfully pushed");
    }

    /**
     * 
     * @returns the path for the image that was committed
     */
    getImagePath()
    {
        return this.#imagePath;
    }
}
 
 module.exports = HarborExtractor