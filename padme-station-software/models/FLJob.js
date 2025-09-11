const mongoose = require('mongoose');

const FLJobState =
{
  WAIT_FOR_ACCEPT: "WAIT_FOR_ACCEPT", 
  WAITING_FOR_NEXT_ROUND: "WAITING_FOR_NEXT_ROUND",
  DOWNLOADING_NEW_MODEL: "DOWNLOADING_NEW_MODEL",
  LEARNING: "LEARNING", 
  GATHERING_RESULTS: "GATHING_RESULTS",
  WAITING_FOR_INSPECTION: "WAITING_FOR_INSPECTION",
  WAITING_FOR_APPROVAL: "WAITING_FOR_APPROVAL",
  PUSHING_RESULTS: "PUSHING_RESULTS",
  FINISHED: "FINISHED", 
  CANCELED: "CANCELED", 
  ERROR: "ERROR"
}

//Which privacy mode is used for the job
const FLPrivacySetting =
{
  INSPECT_RESULTS: "INSPECT_RESULTS",
  DO_NOT_INSPECT_RESULTS: "DO_NOT_INSPECT_RESULTS", 
}

const FedereatedLog = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  }
});

const FederatedSchema = new mongoose.Schema({
  jobid: {
    type: String,
    required: true
  },
  pid:
  {
    type: String,
    required: true
  },
  trainclassidlearning: {
    type: String,
    required: true
  },
  trainstoragelocation: {
    type: String,
    required: true
  },
  currentround:{
    type: Number,
    required: true
  },
  maxrounds: {
    type: Number,
    required: true
  },
  state: {
    type: String,
    enum: FLJobState,
    default: FLJobState.WAIT_FOR_ACCEPT
  },
  privacyMode: {
    type: String,
    enum: FLPrivacySetting,
    //Default for DB = do not inspect results
    //The reason for this is that this setting was the default before the inspection got introduced
    //(In the UI the default is "INSPECT_RESULTS" -> privacy per default)
    default: FLPrivacySetting.DO_NOT_INSPECT_RESULTS
  },
  date: {
    type: Date,
    default: Date.now
  },
  lastResultGridId: 
  {
    type: String,
    required: false
  },
  lastGlobalStorageGridId: 
  {
    type: String,
    required: false
  },
  lastLocalStorageGridId: 
  {
    type: String,
    required: false
  },
  binding: 
  {
    type: String,
    required: false
  },
  shmSize:
  {
    type: Number,
    required: false
  },
  envs: [String],
  logs: [FedereatedLog]
});

const FLJob = mongoose.model('FederatedJob', FederatedSchema);

module.exports =
{
  FLJob,
  FLJobState,
  FLPrivacySetting
}