const { v1: uuidv1 } = require('uuid');
const _ = require('lodash');
const { Op } = require('sequelize');

const Jobinfo = require('../models').jobinfo;
const harborUtil = require('../utils').harbor;
const { asyncHandler } = require('../utils').asyncHandler;
const trainConfigUtil = require('../utils/crypto').trainConfig;
const { isEmpty } = require('./../utils/common');
const monitoringClient = require('../utils/monitoring-client');

module.exports = {
  list(req, res) {
    const userID = req.kauth.grant.access_token.content.preferred_username;

    //Start building the where statement
    let wherestatement = { userid: userID };

    if (
      typeof req.query.statusFilter !== 'undefined' &&
      !(req.query.statusFilter === '')
    ) {
      //if a Statusfilter is provided, add the filter to the query
      wherestatement.currentstate = {
        [Op.or]: req.query.statusFilter.split(','),
      };
    }

    //Execute query
    return Jobinfo.findAll({
      where: wherestatement,
      order: [['createdAt', 'DESC']],
    })
      .then((data) => res.status(200).send(data))
      .catch((error) => {
        console.log(error);
        res.status(400).send(error);
      });
  },

  listPullableTrains(req, res) {
    console.log(req.params.id);
    return Jobinfo.findAll({
      attributes: [
        'jobid',
        'trainclassid',
        'trainstoragelocation',
        'currentstation',
        'nextstation',
        'pid',
      ],
      where: {
        currentstation: req.params.id,
        currentstate: 'wait_for_pull',
      },
    })
      .then((data) => res.status(200).send(data))
      .catch((error) => {
        res.status(400).send(error);
      });
  },

  add: asyncHandler(async (req, res, next) => {
    let jobID = uuidv1();
    let userID = req.harbor.auth.preferred_username;
    const pid = `https://registry.padme-pht.com/${uuidv1()}`;
    const currentState = 'wait_for_pull';
    const routing = req.body.route.split(',');
    const currentStation = routing[0];
    let nextStation = 'final';
    const trainclassid = req.body.trainclassid;

    //INIT STATION MESSAGE ARRAY
    var stationmessages = [];
    for (var i = 0; i < routing.length; i++) {
      stationmessages[i] = 'No Message from Station';
    }

    if (routing.length >= 2) {
      nextStation = routing[1];
    }

    let stationProjectStatus = await Promise.all(
      _.uniq(routing).map((item) => {
        return checkStationProjectIsCreated(item, req);
      })
    );

    // All elements should have "true" value.
    console.log(stationProjectStatus);

    if (_.indexOf(stationProjectStatus, false) > -1) {
      console.log(`Error adding Project for stations in the route`);
      next();
      return;
    }

    //Add jobs project for user if not exits
    try {
      await harborUtil.ensureProjectExists(req, `${userID}_jobs`, true);
    } catch (error) {
      console.log(error);
      next(error);
      return;
    }

    try {
      // Generate a public private key pair for this job (Vault)
      await trainConfigUtil.generateCentralServiceKeyPair(jobID);
      // INSTANTIATE TRAIN AND ADD TO USERS PROJECT WITH INITIAL TAG
      //Tag initial
      let destId = userID;
      let destProjectName = `${userID}_jobs`;
      let destRepoName = jobID;
      let destTagName = 'initial';
      let sourceProjectName = trainclassid.split('/')[0];
      let sourceRepoName = trainclassid.split(':')[0].replace(/^.+?\//, '');
      let sourceTagName = trainclassid.split(':')[1];
      await harborUtil.retagImage(
        req,
        destProjectName,
        destRepoName,
        destTagName,
        sourceProjectName,
        sourceRepoName,
        sourceTagName,
        destId
      );

      console.log(`Added Image for user:` + userID);
      const transaction = await Jobinfo.sequelize.transaction();
      //IF Success: Put image in Station repository + put link into
      try {
        //Put image in Station repository
        //Tag currentStation
        let destId = currentStation;
        let destProjectName = `station${currentStation}_jobs`;
        let destRepoName = jobID;
        let destTagName = currentStation;
        let sourceProjectName = trainclassid.split('/')[0];
        let sourceRepoName = trainclassid.split(':')[0].replace(/^.+?\//, '');
        let sourceTagName = trainclassid.split(':')[1];
        await harborUtil.retagImage(
          req,
          destProjectName,
          destRepoName,
          destTagName,
          sourceProjectName,
          sourceRepoName,
          sourceTagName,
          destId
        );

        console.log(`Added Image for station:` + currentStation);
        //Set corresponding train location
        console.log(`Adding info in db for job: ${jobID}`);
        let trainLocation = new URL(
          `/station${currentStation}_jobs/${jobID}`,
          harborUtil.getUrl()
        )
          .toString()
          .replace('https://', '');

        const jobinfo = await Jobinfo.create(
          {
            jobid: jobID,
            pid: pid,
            userid: userID,
            trainclassid: req.body.trainclassid,
            traininstanceid: req.body.traininstanceid,
            route: routing,
            visited: routing,
            trainstoragelocation: trainLocation,
            currentstation: currentStation,
            nextstation: nextStation,
            currentstate: currentState,
            stationmessages: stationmessages,
          },
          { transaction }
        );

        // Create job metadata after successful creation
        let trainId = req.body.trainclassid;
        const jobMetadataPayload = {
          identifier: jobID,
          description: req.body.description,
          trainId: trainId.substring(
            trainId.indexOf('/') + 1,
            trainId.lastIndexOf(':')
          ),
          currentStation: currentStation,
          creator: userID,
          plannedRoute: routing,
        };

        const metadataResult = await monitoringClient.createJobMetadata(
          jobMetadataPayload,
          req.kauth.grant.access_token.token
        );

        console.log(`Metadata created for job: ${jobID}`, metadataResult);

        // If reached here, no errors were thrown.
        // Commiting the transaction
        await transaction.commit();
        return res.status(201).send(jobinfo);
      } catch (error) {
        // If reached here, errors were thrown.
        // We rollback the transaction
        console.error(
          'Job info creation failed. Rolling back transaction',
          error
        );
        await transaction.rollback();
        next(error);
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }),

  getById(req, res) {
    return Jobinfo.findByPk(req.params.id)
      .then((data) => {
        if (!data) {
          return res.status(404).send({
            message: 'Not Found',
          });
        }
        return res.status(200).send(data);
      })
      .catch((error) => res.status(400).send(error));
  },

  async rejectJob(req, res) {
    const callerUserId =
      req.kauth.grant.access_token.content.preferred_username;
    const reqBody = req.body;
    const jobId = reqBody.jobID;
    const rejectMessage = reqBody.rejectMessage;

    //Check values
    if (isEmpty(jobId) || isEmpty(rejectMessage)) {
      res
        .status(400)
        .send(
          "Invalid body. Please provide the properties 'jobID', and 'rejectMessage'"
        );
      return;
    }

    console.log(`Got rejection request for job ${jobId} from ${callerUserId}`);
    const job = await Jobinfo.findOne({ where: { jobid: jobId } });

    //Check if the station can reject at the moment
    if (job.currentstation !== callerUserId) {
      console.error(
        `Got request to reject job ${jobId} from invalid user ${callerUserId}`
      );
      res
        .status(403)
        .send(
          `Station is currently not visiting user ${callerUserId}, reject call is forbidden!`
        );
      return;
    }

    //Update the job
    try {
      const index = _.indexOf(job.visited, job.currentstation);
      if (index < 0) {
        throw new Error(
          `Unexpected: Could not find station in list of visited stations`
        );
      }

      //Update the job
      job.currentstate = 'reject';
      const stationmessages = job.stationmessages;
      //Sequelize does not detect the change if we update a single index
      //therefore, we replace the whole array
      const new_stationmessages = [];
      for (let i = 0; i < stationmessages.length; i++) {
        new_stationmessages[i] =
          i == index ? rejectMessage : stationmessages[i];
      }

      job.stationmessages = new_stationmessages;
      await job.save();
    } catch (err) {
      console.error(err);
      res.status(500).send();
      return;
    }

    res.status(200).send();
  },

  async skipCurrentStation(req, res, next) {
    const userID = req.harbor.auth.preferred_username;
    const reqBody = req.body;
    const jobID = reqBody.jobID;
    //Skip all occurrence of current station in the route
    const isAll = reqBody.isAll;

    Jobinfo.findOne({ where: { userid: userID, jobid: jobID } })
      .then(async (currentJob) => {
        let currentJobID = currentJob.jobid;
        let currentJobCurrentStation = currentJob.currentstation;
        let currentJobNextStation = currentJob.nextstation;
        let currentJobVisited = currentJob.visited;

        if (currentJobNextStation == 'final') {
          //Set last station visit value to -2 (skipped)
          let currentJobCurrentStationIndex = _.indexOf(
            currentJobVisited,
            currentJobCurrentStation
          );
          currentJobVisited[currentJobCurrentStationIndex] = -2;

          let harborApiClient_ADMIN = harborUtil.getHarborApiClient(req, true);
          try {
            console.log('1.1');

            //ADD TO USERS PROJECT WITH FINAL CONTAINER IMAGE
            let destId = userID;
            let destProjectName = `${userID}_jobs`;
            let destRepoName = currentJobID;
            let destTagName = 'final';
            let sourceProjectName = `station${currentJobCurrentStation}_jobs`;
            let sourceRepoName = currentJobID;
            let sourceTagName = currentJobCurrentStation;
            await harborUtil.retagImage(
              req,
              destProjectName,
              destRepoName,
              destTagName,
              sourceProjectName,
              sourceRepoName,
              sourceTagName,
              destId
            );

            //If the prev steps is successful: delete repo from station project
            console.log('1.2');

            let RepositoryApi = new harborApiClient_ADMIN.RepositoryApi();
            await RepositoryApi.deleteRepository(
              `station${currentJobCurrentStation}_jobs`,
              currentJobID
            );
            console.log(
              `deleted repository (${currentJobID}) for station (${currentJobCurrentStation})`
            );

            //Set corresponding train location. The final train is transferred to the user repo
            let currentTrainStorageLocation = new URL(
              `${userID}_jobs/${currentJobID}`,
              harborUtil.getUrl()
            )
              .toString()
              .replace('https://', '');

            return Jobinfo.update(
              {
                currentstate: 'finished',
                nextstation: -1,
                currentstation: 'final',
                visited: currentJobVisited,
                trainstoragelocation: currentTrainStorageLocation,
              },
              { where: { jobid: jobID } }
            )
              .then(() => {
                return res.status(200).send();
              })
              .catch((error) => res.status(400).send(error));
          } catch (error) {
            console.log(error);
            return next(error);
          }
        }
        //IF IT WASNT THE LAST STATION
        else if (currentJobNextStation != 'final') {
          let harborApiClient_ADMIN = harborUtil.getHarborApiClient(req, true);
          try {
            console.log('2.1');

            //Put image in next Station repository + put link into
            let destId = currentJobNextStation;
            let destProjectName = `station${currentJobNextStation}_jobs`;
            let destRepoName = currentJobID;
            let destTagName = currentJobNextStation;
            let sourceProjectName = `station${currentJobCurrentStation}_jobs`;
            let sourceRepoName = currentJobID;
            let sourceTagName = currentJobCurrentStation;
            await harborUtil.retagImage(
              req,
              destProjectName,
              destRepoName,
              destTagName,
              sourceProjectName,
              sourceRepoName,
              sourceTagName,
              destId
            );

            if (currentJobCurrentStation !== currentJobNextStation) {
              let RepositoryApi = new harborApiClient_ADMIN.RepositoryApi();
              await RepositoryApi.deleteRepository(
                `station${currentJobCurrentStation}_jobs`,
                currentJobID
              );
              console.log(
                `deleted repository (${currentJobID}) for station (${currentJobCurrentStation})`
              );
            }

            //Set corresponding train location
            let trainLocation = new URL(
              `/station${currentJobNextStation}_jobs/${currentJobID}`,
              harborUtil.getUrl()
            )
              .toString()
              .replace('https://', '');

            //Update visited array - find next station
            let currentJobCurrentStationIndex = _.indexOf(
              currentJobVisited,
              currentJobCurrentStation
            );
            let currentJobNextStationIndex = _.indexOf(
              currentJobVisited,
              currentJobNextStation,
              currentJobCurrentStationIndex + 1
            );

            if (isAll)
              for (let i = 0; i < currentJobVisited.length; i++) {
                if (currentJobVisited[i] == currentJobCurrentStation)
                  currentJobVisited[i] = -2;
              }
            else currentJobVisited[currentJobCurrentStationIndex] = -2;

            let remainingStations = _.filter(
              currentJobVisited,
              (station, index) => {
                if (index <= currentJobNextStationIndex || station == -2)
                  return false;
                return true;
              }
            );

            console.log(
              'currentJobCurrentStationIndex',
              currentJobCurrentStationIndex
            );
            console.log(
              'currentJobNextStationIndex',
              currentJobNextStationIndex
            );
            console.log('remainingStation', remainingStations);

            let currentJobNextNextStation = 0;
            let currentState = 'wait_for_pull';

            if (remainingStations.length == 0) {
              if (isAll && currentJobCurrentStation == currentJobNextStation) {
                currentState = 'finished';
                currentJobNextStation = 'final';
                currentJobNextNextStation = -1;
              } else currentJobNextNextStation = 'final';
            } else currentJobNextNextStation = remainingStations[0];

            Jobinfo.update(
              {
                currentstate: currentState,
                currentstation: currentJobNextStation,
                nextstation: currentJobNextNextStation,
                visited: currentJobVisited,
                trainstoragelocation: trainLocation,
              },
              {
                where: { jobid: jobID },
              }
            )
              .then(() => {
                return res.status(200).send();
              })
              .catch((error) => res.status(400).send(error));
          } catch (error) {
            console.log(error);
            return next(error);
          }
        }
      })
      .catch((error) => {
        console.log(error);
        return next(error);
      });
  },
};

async function checkStationProjectIsCreated(item, req) {
  console.log('check');
  let harborApiClient = harborUtil.getHarborApiClient(req, true);

  try {
    let ProjectApi = new harborApiClient.ProjectApi();
    let result = await ProjectApi.headProject(`station${item}_jobs`);
    console.log(`Project exist: station${item}_jobs`);
    return true;
  } catch (error) {
    // console.log(error);

    //Project does not exist yet: Add it
    if (error.status == 404) {
      try {
        let ProjectApi = new harborApiClient.ProjectApi();
        let reqJson = {
          project_name: `station${item}_jobs`,
          count_limit: -1,
          storage_limit: -1,
          cve_allowlist: {},
          metadata: {
            enable_content_trust: 'false',
            auto_scan: 'true',
            severity: 'none',
            reuse_sys_cve_whitelist: 'false',
            public: 'false',
            prevent_vul: 'false',
          },
        };

        let addProjectResult = await ProjectApi.createProject(reqJson);
        console.log(`Added Project for station:` + item);

        //GET PROJECT-ID LOCATION
        // console.log(addProjectResult.headers.location);

        //Extract project Location
        let projectLocationForWebhook = addProjectResult.headers.location;
        //Extract projectID
        let projectID = parseInt(projectLocationForWebhook.split('/').pop());

        console.log('Try to add webhook for projectID:' + projectID);

        try {
          let ProductsApi = new harborApiClient.ProductsApi();

          let webhookAddress = harborUtil.getWebhookAddress();
          let reqJson = {
            name: `station${item}_jobs`,
            enabled: true,
            targets: [
              {
                type: 'http',
                address: webhookAddress,
                auth_header: process.env.HARBOR_WEBHOOK_SECRET,
                skip_cert_verify: true,
              },
            ],
            event_types: ['DELETE_ARTIFACT', 'PULL_ARTIFACT', 'PUSH_ARTIFACT'],
            project_id: projectID,
          };
          let addWebhookResult =
            await ProductsApi.projectsProjectIdWebhookPoliciesPost(
              projectID,
              reqJson
            );
          console.error('Added Webhook');
        } catch (error) {
          console.log(`Error adding webhook for station:` + item);
          console.log(error);
          return false;
        }

        console.log('Try to add member for projectID:' + projectID);

        try {
          let ProductsApi = new harborApiClient.ProductsApi();
          let reqJson = {
            projectMember: {
              role_id: 1, // Project Admin
              member_user: {
                username: item, // Stataion Username
              },
            },
          };
          let projectsProjectIdMembersPostResult =
            await ProductsApi.projectsProjectIdMembersPost(projectID, reqJson);
          console.error('Added member');
        } catch (error) {
          console.log(`Error adding member for station:` + item);
          console.log(error);
          return false;
        }

        // Station successfully registered in Harbor
        return true;
      } catch (error) {
        console.log(`Error adding Project for station:` + item);
        console.log(error);
        return false;
      }
    } else {
      return false;
    }
  }
}
