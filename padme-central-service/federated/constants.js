/**
* Returns the fileName that should be used for minio for a station and a specific round
* @param {string} stationId 
* @param {int} round
* @returns the fileName for the learning results for the provided station and round
*/
const getResultFileName = (stationId, round) => 
{
    return `result_${round}_${stationId}.tar`;
}

/**
 * Returns the fileName that should be used for minio for storing global storage of a station of the aggregation
 * @param {*} identifier Identifier of the Station or Aggregation 
 * @returns 
 */
const getGlobalStorageFileName = (identified) => 
{
    return `global_storage_${identified}.tar`;    
}

/**
 * Returns the fileName that should be used for minio for storing local storage of the aggregation
 * @param {*} identifier Identifier of the Aggregation 
 * @returns 
 */
 const getLocalStorageFileName = (identified) => 
 {
     return `local_storage_${identified}.tar`;    
 }

/**
 * Returns the Harbor project name for the FL project name
 * Example project Name: output_test will result into federated_output_test
 */
const getProjectHarborName = (projectName) => 
{
    return `federated_${projectName}`;
}

/**
 * Return the complete harbor name for a projectName and project Type
 * E.g. projectName output_test and and projectType learning will result into federated_output_test/learning
 */
const getHarborName = (projectName, projectType) => 
{
    return `${getProjectHarborName(projectName)}/${projectType}`
}

/**
 * @param {string} user name of the user that started the job
 * @returns the name of the project where the result should be stored
 */
const getResultsHarborName = (user) => 
{
    return `${user}_jobs`;
}

/**
 * Possible States of the Station used in the status update endpoint
 */
const FLStationStates =
{
    ACCEPTED: "ACCEPTED", //Station has accepted the job
    REJECTED: "REJECTED", //Station has rejected the job
    FAILED: "FAILED", //The current round failed at the station
}

module.exports = {
    FLBasePath: "/federated/",
    FLModelPath: "/federated/model/",
    FLModelPathEnvName: "FEDERATED_MODEL_PATH",
    FLGlobalStorageEnvName: "FEDERATED_GLOBAL_STORAGE",
    FLGlobalStoragePath: "/federated/global_storage",
    FLLocalStorageEnvName: "FEDERATED_LOCAL_STORAGE", 
    FLLocalStoragePath: "/federated/local_storage",
    FLAggregationPath: "/federated/aggregation/",
    FLAggregationPathEnvName: "FEDERATED_AGGREGATION_PATH", 
    FLAggregationPathsEnvName: "FEDERATED_AGGREGATION_PATHS", 
    FLModelFileName: "model.tar",
    FLRepositoryName: "federated_train_class_repository",
    FLRepositoryLearningImageName: "learning", 
    FLRepositoryAggregationImageName: "aggregation",
    FLStationStates, 
    getResultFileName, 
    getHarborName,
    getProjectHarborName, 
    getResultsHarborName,
    getGlobalStorageFileName,
    getLocalStorageFileName   
}