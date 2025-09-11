module.exports = {
    //Be careful, this is only for easier access to the states
    //Changes here should also be reflected in the db and 
    //Might require migrations etc.
    JobState :
    {
        WAIT_FOR_ACCEPT: "wait_for_acceptance",
        RUNNING: "running", 
        AGGREGATING: 'aggregating',
        REJECTED: "rejected",
        FINISHED: "finished",
        ERROR: "error"
    }
}