const { FLModelFileName} = require('../constants.js');
const dockerUtil = require('../../utils').docker;
const minioClient = require('../../utils/minio').minioClient;

/**
 * Extracts results form a learning round into minio
 */
class MinioExtractor
{
    //------------------ Properties ------------------
    #getGlobalStorageFileName; 
    #getLocalStorageFileName;

    //------------------ Constructor ------------------
    constructor(getGlobalStorageFileName, getLocalStorageFileName)
    {
        this.#getGlobalStorageFileName = getGlobalStorageFileName; 
        this.#getLocalStorageFileName = getLocalStorageFileName;
    }
    
    //------------------ internal methods ------------------
    /**
     * Extracts an archive from the given container into the provided minio file
     * @param {*} container 
     * @param {*} jobId 
     * @param {*} containerPath 
     * @param {*} minioName 
     * @param {*} logger 
     */
    async #extractArchiveIntoMinIO(container, jobId, containerPath, minioName, logger)
    {   
        logger(`Extracting from container path ${containerPath}`);
        var archiveStream = await dockerUtil.extractArchive(container, containerPath);
        logger(`Path ${containerPath} extracted... Putting into minio...`);
        await minioClient.putObject(jobId, minioName, archiveStream); 
        logger(`Successfully put contents of ${containerPath} into minio as ${minioName}`);
    }

    //------------------ public methods ------------------
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
        logger("Extracting results into MINIO");
        await this.#extractArchiveIntoMinIO(container, jobId, dataPath, FLModelFileName, logger);
        await this.#extractArchiveIntoMinIO(container, jobId, globalStoragePath, this.#getGlobalStorageFileName(jobId), logger);
        await this.#extractArchiveIntoMinIO(container, jobId, localStoragePath, this.#getLocalStorageFileName(jobId), logger);
        logger("Results successfully put into minio");
    }
}
 
 module.exports = MinioExtractor