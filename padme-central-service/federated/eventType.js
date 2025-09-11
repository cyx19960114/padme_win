module.exports = {
    //Be careful, this is only for easier access to the Types
    //Changes here should also be reflected in the db and 
    //Might require migrations etc.
    EventType:
    {
        NEW_LEARNING_ROUND: "new_learning_round",
        ABORTED: "aborted", 
        FINISHED: "finished",
    }
}