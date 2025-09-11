
/**
 * Possible States of the Station used in the status update endpoint
 */
 const FLStatusUpdates =
 {
     ACCEPTED: "ACCEPTED", //Station has accepted the job
     REJECTED: "REJECTED", //Station has rejected the job
     FAILED: "FAILED", //The current round failed at the station
 }

module.exports = {
    FLModelPath: "/federated/model",
    FLModelPathEnvName: "FEDERATED_MODEL_PATH",
    FLGlobalStorageEnvName: "FEDERATED_GLOBAL_STORAGE",
    FLGlobalStoragePath: "/federated/global_storage",
    FLLocalStorageEnvName: "FEDERATED_LOCAL_STORAGE", 
    FLLocalStoragePath: "/federated/local_storage",
    FLStatusUpdates, 
}