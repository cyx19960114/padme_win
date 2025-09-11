//const Hook = require('../models').Hook;
const Jobinfo = require('../models').jobinfo;
const request = require('request');
const harborUtil = require('../utils').harbor;
const dockerUtil = require('../utils').docker;
const _ = require('lodash');
const { FLRepositoryName, FLRepositoryLearningImageName,
        getHarborName, getProjectHarborName } = require('../federated/constants.js');
const JobManager = require('../federated/jobManager');
        
const handler = async (req, res) => {

    try {
        const now = new Date();
        console.log("Hook detected");
        console.log(now.toLocaleString());
        //console.log(JSON.stringify(req.headers, undefined, 2));
        //console.log(JSON.stringify(req.body, undefined, 2));
        var bodyJSON = JSON.parse(JSON.stringify(req.body, undefined, 2));
    
        console.log(bodyJSON.type);
    
        var webhookType = bodyJSON.type;
        var operator = bodyJSON.operator;
    
        //Check if the hook is federated -> Copy image to new repo, etc.
        if (webhookType == "PUSH_ARTIFACT" && bodyJSON.event_data.repository.namespace == FLRepositoryName)
        {
            console.log(`Federated Hook detected`);
            
            await handleFederated(req, bodyJSON)
                .then(res.sendStatus(200))
                .catch(err => {
                    console.error(err);
                    res.sendStatus(500);
                });
            return;
        }


    
        console.log(`***********${operator}**************`)
    
        //React only to stations
        const regex = new RegExp(`(^harbor-ui$)|(^${process.env.HARBOR_ADMIN_USER}$)|(^robot[$][0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$)|(^auto$)`);
        if (!regex.test(operator)) {
            //PULL IMAGE HOOK
            if (webhookType === 'PULL_ARTIFACT') {
                var jobID = bodyJSON.event_data.repository.name;
    
                //Update the Database such that the current status is 'pulled'
                Jobinfo.update(
                    { currentstate: 'pulled' },
                    { where: { jobid: jobID } }
                )
            }
            //PUSH IMAGE HOOK
            else if (webhookType === 'PUSH_ARTIFACT') {
                var jobID = bodyJSON.event_data.repository.name;
    
                Jobinfo.findOne(
                    { where: { jobid: jobID } }
                ).then(async (currentJob) => {
    
                    userID = currentJob.userid;
                    currentJobID = currentJob.jobid;
    
    
                    currentJobCurrentStation = currentJob.currentstation;
                    currentJobNextStation = currentJob.nextstation;
    
                    currentJobRoute = currentJob.route;
                    currentJobVisited = currentJob.visited;
    
                    //Placeholder for error handling. assume that the tag indicates an error
                    if (false) {
    
                        //Update database indicating that the train has an error
                        Jobinfo.update(
                            { currentstate: 'reject' },
                            { where: { jobid: jobID } }
                        )
    
                        //No error occured
                    } else {
    
                        //Negative number indicates that there is no next station. This means that the train finished the last station
                        if (currentJobNextStation == 'final') {
    
                            //all stations were visited
                            //currentJobVisitedFinished = new Array(currentJobVisited.length).fill(-1);
                            let currentJobCurrentStationIndex = _.indexOf(currentJobVisited, currentJobCurrentStation);
                            currentJobVisited[currentJobCurrentStationIndex] = -1;
    
                            console.log("FINAL STATION!");
    
                            console.log(currentJobCurrentStation);
                            console.log(userID);
                            console.log(currentJobID);
    
                            let harborApiClient_ADMIN = harborUtil.getHarborApiClient(req, true);
                            try {
    
                                console.log("1.1");
    
                                //ADD TO USERS PROJECT WITH FINAL CONTAINER IMAGE
                                let destId = userID;
                                let destProjectName = `${userID}_jobs`;
                                let destRepoName = currentJobID;
                                let destTagName = 'final';
                                let sourceProjectName = `station${currentJobCurrentStation}_jobs`;
                                let sourceRepoName = currentJobID;
                                let sourceTagName = currentJobNextStation;
                                await harborUtil.retagImage(req, destProjectName, destRepoName, destTagName, sourceProjectName, sourceRepoName, sourceTagName, destId);
    
                                // let ArtifactApi = new harborApiClient_ADMIN.ArtifactApi();
                                // let copyArtifactResult = await ArtifactApi.copyArtifact(destProjectName, destRepoName, `${sourceProjectName}/${sourceRepoName}:${sourceTagName}`);
                                // console.log(`copyArtifact: ${sourceProjectName}/${sourceRepoName}:${sourceTagName} -> ${destProjectName}/${destRepoName}`);
                    
    
                                //If the prev steps is successful: delete repo from station project
                                console.log("1.2");
    
                                let RepositoryApi = new harborApiClient_ADMIN.RepositoryApi();
                                let deleteRepoResult = await RepositoryApi.deleteRepository(`station${currentJobCurrentStation}_jobs`, currentJobID);
                                console.log(`deleted repository (${currentJobID}) for station (${currentJobCurrentStation})`);
    
                                //Set corresponding train location. The final train is transferred to the user repo
                                currentTrainStorageLocation = new URL(`${userID}_jobs/${currentJobID}`, harborUtil.getUrl()).toString().replace("https://", "");
    
                                return Jobinfo.update(
                                    {
                                        currentstate: 'finished',
                                        nextstation: -1,
                                        currentstation: 'final',
                                        visited: currentJobVisited,
                                        trainstoragelocation: currentTrainStorageLocation
                                    },
                                    { where: { jobid: jobID } })
                                    .then(() => {
                                        return;
                                    })
                                    .catch((error) => console.log(error))
    
                            } catch (error) {
                                console.log(error);
                                throw new Error(error);
                            }
    
                        }
                        //IF IT WASNT THE LAST STATION
                        else if (currentJobNextStation != 'final') {
    
                            //find right tag for history of the format: stationID.#numberOfTimesItWasVisited
                            numberOfVisitations = 1
                            for (i = 0; i < currentJobRoute.length; i++) {
    
                                if (currentJobRoute[i] == currentJobCurrentStation && currentJobVisited[i] == -1) {
                                    numberOfVisitations++
                                }
                            }
    
                            tagForUserProject = currentJobCurrentStation + "." + numberOfVisitations
    
                            let harborApiClient_ADMIN = harborUtil.getHarborApiClient(req, true);
                            try {
    
                                //Move image to user repo, to keep track of the containers
                                let destId = userID;
                                let destProjectName = `${userID}_jobs`;
                                let destRepoName = currentJobID;
                                let destTagName = tagForUserProject;
                                let sourceProjectName = `station${currentJobCurrentStation}_jobs`;
                                let sourceRepoName = currentJobID;
                                let sourceTagName = currentJobNextStation;
                                await harborUtil.retagImage(req, destProjectName, destRepoName, destTagName, sourceProjectName, sourceRepoName, sourceTagName, destId);
    
                                //IF Success: Put image in next Station repository + put link into
                                destId = currentJobNextStation;
                                destProjectName = `station${currentJobNextStation}_jobs`;
                                destRepoName = currentJobID;
                                destTagName = currentJobNextStation;
                                sourceProjectName = `station${currentJobCurrentStation}_jobs`;
                                sourceRepoName = currentJobID;
                                sourceTagName = currentJobNextStation;
                                await harborUtil.retagImage(req, destProjectName, destRepoName, destTagName, sourceProjectName, sourceRepoName, sourceTagName, destId);
                                
                                // let ArtifactApi = new harborApiClient_ADMIN.ArtifactApi();
                                // let copyArtifactResult = await ArtifactApi.copyArtifact(destProjectName, destRepoName, `${sourceProjectName}/${sourceRepoName}:${sourceTagName}`);
                                // console.log(`copyArtifact: ${sourceProjectName}/${sourceRepoName}:${sourceTagName} -> ${destProjectName}/${destRepoName}`);
    
                                if (currentJobCurrentStation !== currentJobNextStation) {
                                    let RepositoryApi = new harborApiClient_ADMIN.RepositoryApi();
                                    let deleteRepoResult = await RepositoryApi.deleteRepository(`station${currentJobCurrentStation}_jobs`, currentJobID);
                                    console.log(`deleted repository (${currentJobID}) for station (${currentJobCurrentStation})`);
                                }
    
                                //Set corresponding train location
                                trainLocation = new URL(`/station${currentJobNextStation}_jobs/${currentJobID}`, harborUtil.getUrl()).toString().replace("https://", "");
    
                                //Update visited array - find next station
                                let currentJobCurrentStationIndex = _.indexOf(currentJobVisited, currentJobCurrentStation);
                                currentJobVisited[currentJobCurrentStationIndex] = -1;
                                let currentJobNextStationIndex = _.indexOf(currentJobVisited, currentJobNextStation, currentJobCurrentStationIndex);
    
                                let remainingStations = _.filter(currentJobVisited, (station, index) => {
                                    if (index <= currentJobNextStationIndex || station == -2)
                                        return false
                                    return true;
                                });
    
                                console.log("currentJobCurrentStationIndex", currentJobCurrentStationIndex);
                                console.log("currentJobNextStationIndex", currentJobNextStationIndex);
                                console.log("remainingStation", remainingStations);
    
                                let currentJobNextNextStation = 0;
                                let currentState = 'wait_for_pull';
    
                                if (remainingStations.length == 0) {
                                    currentJobNextNextStation = 'final';
                                }
                                else
                                    currentJobNextNextStation = remainingStations[0];
    
                                console.log("currentJobNextNextStation", currentJobNextNextStation);
    
                                return Jobinfo.update(
                                    {
                                        currentstate: currentState,
                                        currentstation: currentJobNextStation,
                                        nextstation: currentJobNextNextStation,
                                        visited: currentJobVisited,
                                        trainstoragelocation: trainLocation
                                    },
                                    { where: { jobid: jobID } });
    
                            } catch (error) {
                                console.log(error);
                                throw new Error(error);
                            }
                        }
                    }
                }).catch((error) => {
                    console.log(error);
                    throw new Error(error);
                });
            }
        }
    
        res.sendStatus(200);
        
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
   
};

/**
 * Handles the federated Hooks
 * @param {*} req 
 * @param {*} jsonBody 
 * @returns 
 */
const handleFederated = async (req, jsonBody) => {
    
    //return on unexpected data format
    if (!jsonBody.event_data.repository.name) return;

    //Check if the image is a learning image
    let repository = jsonBody.event_data.repository;
    let projectType = repository.name.substring(repository.name.lastIndexOf('/') + 1);
    if (projectType !== FLRepositoryLearningImageName) return;

    console.log(`Updating learning image with name ${repository.name}`);

    //Catch in outer context
    let projectName = repository.name.substring(0, repository.name.lastIndexOf('/'));
    try
    {
        //Ensure the project exists in harbor
        new JobManager().addProjectToProcessingList(projectName); 
        const project = getProjectHarborName(projectName);
        await harborUtil.ensureProjectExists(req, project, true, true);

        // Copy the learning image from federated_train_class_repository to individual project repository
        let tag = jsonBody.event_data.resources[0].tag;
        const sigRegex = /\.sig$/;
        const isSignature = sigRegex.test(tag);
        
        // If a signature is pushed, delete the existing image first, so that image with signature can be copied.
        if (isSignature) {
            console.log('Signature artifact detected, deleting old image first');
            tag = 'latest';
            await harborUtil.deleteArtifact(req, project, projectType, tag, true);
        }
        
        const from = `${repository.repo_full_name}:${tag}`;
        
        await harborUtil.copyArtifact(req, project, projectType, from, true);
    } finally {
        new JobManager().removeProjectFromProcessingList(projectName); 
    }  
};

module.exports = {
    handler,
};

