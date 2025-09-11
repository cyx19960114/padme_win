const _ = require('lodash')
const harborUtil = require('../utils').harbor;
const { FLRepositoryName, FLRepositoryLearningImageName, FLRepositoryAggregationImageName} = require('../federated/constants.js');
const JobManager = require('../federated/jobManager');
const TrainRepositoryName = "train_class_repository";

function pushRepoTagsToArray(repository, array)
{
    _.forEach(repository.tags, (tag) =>
    {
        if(tag != null)
        {
            var tagObject = {};
            tagObject.tag = tag.name;
            tagObject.trainclass = repository.name + ":" + tag.name;
            array.push(tagObject); 
        }
    });
}

async function getRepositoriesFromTrainClass(trainclass, req, res, next)
{
    let harborApiClient = harborUtil.getHarborApiClient(req, true);

    //GET ALL REPOSITORIES FROM train_class_repository
    let repositories = [];
    try {
        let RepositoryApi = new harborApiClient.RepositoryApi();
        let opts = { 'pageSize': 0 };
        let result = await RepositoryApi.listRepositories(trainclass, opts);
        repositories = result.body;
    } catch (error) {
        console.log(error);
        next(error);
    }

    let repoPromises = [];
    _.forEach(repositories, async (repo) => {

        // console.log(repo.name);
        //GET ARTIFACTS FOR EACH REPOSITORY (With Tags)
        let ArtifactApi = new harborApiClient.ArtifactApi();
        var opts = { 'withTag': true };
        let projectName = repo.name.split("/")[0];
        let repoName = repo.name.replace(/^.+?\//, '');
        repoPromises.push(ArtifactApi.listArtifacts(projectName, repoName, opts));
    });

    let promiseResult = [];
    try {
        promiseResult = await Promise.all(repoPromises);
    } catch (error) {
        console.log(error);
        next(error);
        return;
    }

    let artifacts = promiseResult.map(a => a.body);
    _.forEach(repositories, (repo, i) => {
        let repoArtifacts = artifacts[i];
        repo.tags = repoArtifacts.map(a => a.tags) 
        repo.tags = _.flatten(repo.tags);
    });
    return repositories;
}

/**
 * Ensures that the train class repositories for both incremental and federated exists.
 * If they do not exist, they will be created, with retention policy set for both.
 */
const ensureTrainClassRepositoriesExists = async () => {
    let auth = {};
    harborUtil.authAsAdmin(auth, async (err) => {
        if (err) {
            console.error(`Error authenticating as admin to Harbor`, err);
            return;
        }
        try {
            const trainRepo = harborUtil.ensureProjectExists(auth, TrainRepositoryName, true, true);
            const flTrainRepo = harborUtil.ensureProjectExists(auth, FLRepositoryName, true, true);
            Promise.all([trainRepo, flTrainRepo]).then(() => {
                console.log(`Ensured both train class repositories exist`);
            }).catch((error) => {
                console.error(`Error ensuring both train class repositories exist`, error);
            });
        } catch (error) {
            console.error(`Error ensuring both train class repositories exist`, error);
        }
    });
}

ensureTrainClassRepositoriesExists();

module.exports = {

    async getProjects(req, res, next) {

        let harborApiClient = harborUtil.getHarborApiClient(req);

        //GET PROJECTS - USER LEVEL ACCESS
        try {
            let harborProjectApi = new harborApiClient.ProjectApi();
            let getProjectResult = await harborProjectApi.listProjects();
            console.log(getProjectResult.body);
            let projects = getProjectResult.body;
            
            //GET REPOSITORIES FOR EACH PROJECT
            let repoPromises = [];
            _.forEach(projects, (project) => {
                let RepositoryApi = new harborApiClient.RepositoryApi();
                repoPromises.push(RepositoryApi.listRepositories(project.name));
            });

            let repoPromisesResult = await Promise.all(repoPromises);
            let repositories = repoPromisesResult.map(a => a.body);
            repositories.map((repo, i) => {
                if (!repo)
                    repo = [];
                projects[i].repositories = repo;
            });

            let tagPromises = [];
            _.forEach(projects, (project) => {
                _.forEach(project.repositories, (repo) => {
                    let ArtifactApi = new harborApiClient.ArtifactApi();
                    var opts = { 'withTag': true };
                    let projectName = project.name;
                    let repoName = repo.name.replace(/^.+?\//, '');
                    tagPromises.push(ArtifactApi.listArtifacts(projectName, repoName, opts));
                });
            });

            tagPromisesResult = await Promise.all(tagPromises);
            let artifacts = tagPromisesResult.map(a => a.body);
            _.forEach(projects, (project) => {
                _.forEach(project.repositories, (repo, i) => {
                    let repoArtifacts = artifacts[i] || [];
                    repo.tags = repoArtifacts.map(a => a.tags)
                    repo.tags = _.flatten(repo.tags);
                });
            });

            res.status(200).send(projects);

        } catch (error) {
            console.error(error);
            next(error);
        }
    },

    async getTrainClassRepositories(req, res, next) {
        try {
            var repositories = await getRepositoriesFromTrainClass(TrainRepositoryName, req, next); 
            res.status(200).send(repositories);
        } catch (error) {
            console.log(error);
            next(error);
            return;
        }        
    },

    async getFederatedTrainClassRepositories(req, res, next) {

        var repositories;
        
        try {
            repositories= await getRepositoriesFromTrainClass(FLRepositoryName, req, next); 
        } catch (error) {
            console.log(error);
            next(error);
            return;
        }
        
        //Restructure the data so that training/aggregation image are in the same project
        var projects = [];
        let jobManager = new JobManager();
        _.forEach(repositories, (repository) => {
            var project = {};
            //Skip repos that have the wrong format
            if (repository.name.lastIndexOf('/') == repository.name.indexOf('/')) return;

            project.name = repository.name.substring(repository.name.indexOf('/') + 1, repository.name.lastIndexOf('/'));
            project.processing = jobManager.isProcessing(project.name);
            
            //Add project if not already exists
            var existingProject = _.find(projects, ['name', project.name]);
            if (existingProject == undefined)
            {
                projects.push(project);
                existingProject = project;
            }

            //Add tags for project type
            var projectType = repository.name.substring(repository.name.lastIndexOf('/') + 1);
            if (projectType === FLRepositoryLearningImageName)
            {
                existingProject.learning = [];
                pushRepoTagsToArray(repository, existingProject.learning);
            }
            else if (projectType === FLRepositoryAggregationImageName)
            {
                existingProject.aggregation = [];
                pushRepoTagsToArray(repository, existingProject.aggregation);
            }
        });

        res.status(200).send(projects);
    }
}