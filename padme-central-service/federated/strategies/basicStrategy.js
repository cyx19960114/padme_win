const Jobinfo = require('../../models').fl_jobinfo;
const JobState = require('./../jobState.js').JobState;
const _ = require('lodash'); 

/**
 * Implements a Basic Learning Strategy
 */
class BasicStrategy
{
    constructor() {}

    canLearningStart(jobInfo)
    {
        return jobInfo.currentstate == JobState.WAIT_FOR_ACCEPT && _.every(jobInfo.Stations, ['doneWithCurrentState', true]);
    }

    shouldAbortLearning(jobInfo)
    {
        return jobInfo.currentstate == JobState.WAIT_FOR_ACCEPT && _.some(jobInfo.Stations, ['doneWithCurrentState', false]);
    }

    jobFailed(jobInfo)
    {
        return _.some(jobInfo.Stations, ['failedCurrentRound', true]);
    }

    canAggregationStart(jobInfo)
    {
        return jobInfo.currentstate == JobState.RUNNING && _.every(jobInfo.Stations, ['doneWithCurrentState', true]);
    }
}

module.exports = BasicStrategy