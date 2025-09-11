const request = require('request');
var HarborApi = require('../harbor-client');
const dockerUtil = require('./docker');
const trainConfigUtil = require('./train-config');
const _ = require('lodash');

function getAdminAuthRequestOptions() {

    let authServer = new URL('/auth/realms/pht/protocol/openid-connect/token', `https://${process.env.AUTH_SERVER_ADDRESS}`);
    authServer.port = process.env.AUTH_SERVER_PORT;
    var options = {
        'url': authServer.toString(),
        'headers': {
            'Content-Type': 'application/json',
        },
        form: {

            grant_type: "password",
            client_id: "central-service",
            username: process.env.HARBOR_ADMIN_USER,
            password: process.env.HARBOR_ADMIN_PASSWORD,
            scope: "openid profile email offline_access",
        }
    };

    return options;

}

/**
 * Sets the proper tokens in the req object to be authenticated as administrator
 * @param {*} req 
 * @param {*} callback 
 */
const authAsAdmin = (req, callback) =>
{
    if (!req.harbor) {
        req.harbor = { auth: {} };
    }

    let options = getAdminAuthRequestOptions();
    request.post(options, (error, response) => {

        if (error) {
            callback(error);
            return;
        }

        let body = JSON.parse(response.body);
        req.harbor.auth.admin_access_token = body.access_token;
        //req.harbor.auth.access_token = req.kauth.grant.access_token.token;

        callback(undefined);
    });
}

module.exports = {

    auth: (req, res, next) => {

        if (!req.harbor) {
            req.harbor = { auth: {} };
        }

        req.harbor.auth.preferred_username = req.kauth.grant.access_token.content.preferred_username;
        req.harbor.auth.access_token = req.kauth.grant.access_token.token;

        authAsAdmin(req, (err) => {
            if (err) {
                return res.status(400).send(err)
            }
            return next();
        });
    },
    authAsAdmin,
    authWebhookSecret: (req, res, next) => {

        if (!req.harbor) {
            req.harbor = { auth: {} };
        }

        let reqSecret = req.headers.authorization;
        let isAuthenticated = (reqSecret === process.env.HARBOR_WEBHOOK_SECRET ? true : false);

        if (!isAuthenticated) {
            console.log("*Unauthorized webhook request*");
            console.log(JSON.stringify(req.headers), null, 2);
            return res.status(401).send("Unauthorized");
        }

        let options = getAdminAuthRequestOptions();
        request.post(options, (error, response) => {

            if (error) {
                return res.status(400).send(error)
            }

            let body = JSON.parse(response.body);
            req.harbor.auth.admin_access_token = body.access_token;
            //req.harbor.auth.access_token = req.kauth.grant.access_token.token;
            return next();
        });

    },

    getUrl: () => {
        let url = new URL(`https://${process.env.HARBOR_ADDRESS}`);
        url.port = process.env.HARBOR_PORT;
        return url.toString();
    },

    getHost: function () {
        let url = new URL(this.getUrl());
        return url.host;
    },

    getApiAddress: function () {
        let url = new URL("/api/v2.0", this.getUrl());
        return url.toString();
    },

    getLoginAddress: function () {
        let url = new URL("/c/oidc/login", this.getUrl());
        return url.toString();
    },

    getHarborRequestOptions: function (req, isAdmin = false) {

        let options = {
            url: this.getApiAddress(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${isAdmin ? req.harbor.auth.admin_access_token : req.harbor.auth.access_token}`,
            },
        };
        return options;
    },

    getHarborApiClient: function (req, isAdmin = false) {

        let defaultClient = HarborApi.ApiClient.instance;
        defaultClient.basePath = this.getApiAddress();
        defaultClient.authentications['APIKeyHeader'].apiKeyPrefix = 'Bearer'
        defaultClient.authentications['APIKeyHeader'].apiKey = (isAdmin ? req.harbor.auth.admin_access_token : req.harbor.auth.access_token);
        return HarborApi;
        
    },

    /**
     * Returns the id for the project with the given name
     * Throws error on failure (need to be catched in outer context)
     * @param {*} client authenticated harbor client instance
     * @param {string} projectName name of the project
     * @returns the id of the project or -1 if non could be found
     */
    getIdForNamedProject: async function (client, projectName)
    {
        let api = new client.ProjectApi();
        let projectRes = await api.getProject(projectName);
        if (projectRes.statusCode != 200)
        {
            throw Error(`Could not find project, harbor answered with ${projectRes.statusCode}`);    
        }
        return projectRes.body.project_id;
    },

    /**
     * Returns the names for all existing clients in the project
     * Throws error on failure (need to be catched in outer context)
     * @param {*} client authenticated harbor client instance
     * @param {*} projectId id of the project
     * @returns 
     */
    getExistingMemberNamesFromProject: async function (client, projectId)
    {
        let api = new client.ProductsApi();
        let existingRes = await api.projectsProjectIdMembersGet(projectId);
        if (existingRes.statusCode != 200)
        {
            throw Error("Could not load existing project members")    
        }
        return existingRes.body.map((el) => el.entity_name);
    },

    /**
     * Adds the given list of members to the provided project
     * Throws error on failure (need to be catched in outer context)
     * @param {*} client authenticated harbor client instance
     * @param {*} projectId id of the project
     * @param {*} members Names of the members to add
     * @param {*} roleId Id of the role the new members should have. default = 5 (Limited Guest)
     */
    addMembersToProject: async function (client, projectId, members, roleId = 5)
    {
        let api = new client.ProductsApi();
        for (let member of members)
        {
            //Form json request
            let reqJson = {
                projectMember: {
                    role_id: roleId,
                    member_user: { username: member }
                }
            };
            let addRes = await api.projectsProjectIdMembersPost(projectId, reqJson);
            if (addRes.statusCode != 201)
            {
                throw Error(`Could not add user ${member} to harbor project`);
            }
            console.log(`Added user: ${member}`);
        }
    }, 

    /**
     * Checks if all users exist in the given project-name and adds them as a Limited Guest if they do not yet exist
     * Throws error on failure (need to be catched in outer context)
     * @param {*} req The request object, needed for harbor credentials
     * @param {*} project The name of the harbor project to add the users to
     * @param {*} userIds list of the user Ids (station Ids) that should be ensured
     */
    ensureProjectUsers: async function (req, project, userIds)
    {
        console.log(`ensuring the following user have access to project ${project}:`);
        console.log(userIds);

        //Get client and project Id
        let client = this.getHarborApiClient(req, true);
        let projectId = await this.getIdForNamedProject(client, project);
        console.log(`Project has id ${projectId}`);

        //Get the existing Members of the project       
        let existingMember = await this.getExistingMemberNamesFromProject(client, projectId);
        console.log("The following member already exist:"); 
        console.log(existingMember);

        //Get remaining
        let remaining = [];
        userIds.forEach(id => existingMember.includes(id) ? _ : remaining.push(id));

        //Add remaining as Limited Guests (role_id 5)
        await this.addMembersToProject(client, projectId, remaining, 5)
        console.log("Adding all users done");
    },

    /**
     * @param {*} project name of the project that should be added
     * @returns the default json for adding a new project with the provided name to harbor
     */
    getProjectReqJson(project)
    {
        return {
            project_name: project,
            count_limit: -1,
            storage_limit: -1,
            cve_allowlist: {
            },
            metadata: {
                enable_content_trust: "false",
                auto_scan: "true",
                severity: "none",
                reuse_sys_cve_whitelist: "false",
                public: "false",
                prevent_vul: "false"
            }
        };
    },

    /**
     * Ensures that the project with the given name exists in harbor
     * Throws error on failure (need to be caught in outer context)
     * @param {*} req 
     * @param {*} project 
     * @param {bool} isAdmin Whether the calling request has admin parameters set
     * @param {bool} setRetentionPolicy Whether retention policy needs to be set for the project. If set, only tagged images will be retained, rest will be deleted 
     * @returns 
     */
    ensureProjectExists: async function (req, project, isAdmin = false, setRetentionPolicy = false)
    {
        let client = this.getHarborApiClient(req, isAdmin);
        let projectAPI = new client.ProjectApi();

        console.log(`Ensuring project ${project} exists in harbor`);

        try
        {
            //Try to get the project, this fails with code 403 if the project does not exits
            await projectAPI.getProject(project);
            console.log(`Project ${project} exist.`);
        } catch (error)
        {
            //Check for unexpected error code
            // 403 for old harbor version, 404 for new harbor version if project doesn't exist
            if (error.status != 403 && error.status != 404) throw Error(error);

            //Project does not exist yet: Add 
            try {
                //Add project
                let reqJson = this.getProjectReqJson(project);
                let res = await projectAPI.createProject(reqJson);
                if (setRetentionPolicy) {
                    await this.createRetentionPolicy(req, res);
                }
                console.log(`Project ${project} was created.`);
            } catch (error) {
                console.log(`Error adding creating new project ${project}`)
                throw Error(error);
            }
        }
    },

    retagImage: async function (req, destProjectName, destRepoName, destTagName, sourceProjectName, sourceRepoName, sourceTagName, destId) {

        try {

            let sourceImage = `${this.getHost()}/${sourceProjectName}/${sourceRepoName}:${sourceTagName}`;
            let destImage = `${this.getHost()}/${destProjectName}/${destRepoName}:${destTagName}`;

            
            //Create Temp container for given image
            let tempContainer = await dockerUtil.createContainer(sourceImage);

            const trainConfigFileAbsolutePath = trainConfigUtil.getTrainConfigFileAbsolutePath();
            const trainConfigFilePathInContainer = trainConfigUtil.getTrainConfigFilePathInContainer();

            // train_config json model
            let train_config = trainConfigUtil.getTrainConfigJsonBaseModel();

            // check if train_config file exists inside the container
            try {
                // Get the tar archive for the trainConfig
                let getArchiveResult = await dockerUtil.extractFileAsArchive(tempContainer, trainConfigFilePathInContainer)

                // untar the result (train_config.json)
                train_config = await trainConfigUtil.unTarTrainConfigJson(getArchiveResult);

            } catch (error) {
                console.log(error);
            }

            console.log("train_config_before", train_config);

            // update train_config file
            train_config = await trainConfigUtil.updateTrainConfigJson(train_config, { dest: destId, jobId: destRepoName });

            console.log("train_config_after", train_config);

            // create tarball archive, to put files in a container it needs to be a tar archive
            let trainConfigTarArchive = trainConfigUtil.tarTrainConfigJson(train_config);

            let putArchiveResult = await tempContainer.putArchive(trainConfigTarArchive,
                {
                    'path': trainConfigFileAbsolutePath
                }
            );
            // console.log(putArchiveResult);

            // commit updated temp container with dest info (harbor repo)
            let commitTempContainerResult = await tempContainer.commit(
                {
                    repo: `${this.getHost()}/${destProjectName}/${destRepoName}`,
                    tag: destTagName
                }
            );
            // const tempImageId = commitTempContainerResult.Id;

            // push updated image into the destination repo (harbor repo)
            let tempImage = dockerUtil.instance.getImage(destImage);
            let pushTempImageResult = await dockerUtil.pushImageWithAuth(tempImage);
            // console.log(pushTempImageResult);

            console.log(`copyUpdatedArtifact: ${sourceProjectName}/${sourceRepoName}:${sourceTagName} -> ${destProjectName}/${destRepoName}:${destTagName}`);
        } catch (error) {
            console.error(error);
            throw Error(error);
        }

    },

    getWebhookAddress: () => {
        let url = new URL(`${process.env.HOST_BASE ? `/${process.env.HOST_BASE}` : ''}/hook` ,`https://${process.env.HOST_ADDRESS}`)
        url.port = process.env.HOST_PORT;
        return url.toString();
    },

    /**
     * Creates a retention policy whereby all images without tags in all repositories in this project are deleted, the cleanup
     * job is run every Sunday at 00:00
     * @param {*} req 
     * @param {*} res Response object returned from harbor after project is created. The location header has project_id
     */
    createRetentionPolicy: async function (req, res) {
        try {
            let client = this.getHarborApiClient(req, true);
            let retentionAPI = new client.RetentionApi();
            let project_id = Number(res.header.location.split("/").pop());
            const retentionPolicy = {
                "algorithm": "or",
                "rules": [
                  {
                    "action": "retain",
                    "scope_selectors": {
                      "repository": [
                        {
                          "decoration": "repoMatches",
                          "kind": "doublestar",
                          "pattern": "**"
                        }
                      ]
                    },
                    "tag_selectors": [
                      {
                        "decoration": "matches",
                        "extras": "{\"untagged\":false}",
                        "kind": "doublestar",
                        "pattern": "**"
                      }
                    ],
                    "template": "always"
                  }
                ],
                "scope": {
                    "level": "project",
                    "ref": project_id
                  },
                "trigger": {
                  "kind": "Schedule",
                  "settings": {
                    "cron": "0 0 0 * * 0"
                  }
                }
              }
            await retentionAPI.createRetention(retentionPolicy);
            console.log("Retention Policy created");
        } catch (e) {
            console.error(`Error creating retention policy`);
            throw(e);
        }
    },

    /**
     * Copies the artifact with the given reference from the source repository to the destination repository
     * @param {*} req 
     * @param {*} project The name of the project
     * @param {*} repository The name of the repository. If it contains slash, encode it with URL encoding. e.g. a/b -> a%252Fb
     * @param {*} from The artifact from which the new artifact is copied from, the format should be "project/repository:tag" or "project/repository@digest"
     * @param {*} isAdmin Whether this request should be made with admin credentials
     */
    copyArtifact: async function (req, project, repository, from, isAdmin = false) {
        let client = this.getHarborApiClient(req, isAdmin);
        let artifactApi = new client.ArtifactApi();

        console.log(`Copying artifact from ${from} to ${project}/${repository}`);

        try {
            await artifactApi.copyArtifact(project, repository, from);
            console.log(`Successfully copied artifact from ${from} to ${project}/${repository}`);
        } catch (error) {
            console.log(`Error copying artifact ${error}`);
            throw Error(error);
        }
    },

    /**
     * Deletes the artifact with the given reference from the given repository
     * @param {*} req 
     * @param {*} project The name of the project
     * @param {*} repository The name of the repository. If it contains slash, encode it with URL encoding. e.g. a/b -> a%252Fb
     * @param {*} reference The reference of the artifact, can be digest or tag
     * @param {*} isAdmin Whether this request should be made with admin credentials
     */
    deleteArtifact: async function (req, project, repository, reference, isAdmin = false) {
        let client = this.getHarborApiClient(req, isAdmin);
        let artifactApi = new client.ArtifactApi();

        console.log(`Deleting artifact ${project}/${repository}:${reference}`);

        try {
            await artifactApi.deleteArtifact(project, repository, reference);
            console.log(`Deleted artifact ${project}/${repository}:${reference}`);
        } catch (error) {
            console.log(`Error deleting artifact ${error}`);
        }
    }

};