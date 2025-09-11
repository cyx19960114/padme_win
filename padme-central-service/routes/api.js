const express = require('express');
var router = express.Router();

const jobinfoController = require('../controllers').jobinfo;
const fl_jobinfoController = require('../controllers').fl_jobinfo;
const jobResultController = require('../controllers').jobresult;
const harborController = require('../controllers').harbor;
const stationController = require('../controllers').station;

const harborUtil = require('../utils').harbor;

module.exports = (keycloak)=>{

  router.get('/', function(req, res, next) {
    res.send('API of the Central PHT Service');
  });
  
  /* JOBINFO Router */
  router.get('/jobinfo', keycloak.protect(), jobinfoController.list);
  router.get('/jobinfo/:id', keycloak.protect(), jobinfoController.listPullableTrains);
  router.post('/jobinfo', keycloak.protect(), harborUtil.auth, jobinfoController.add);
  router.post('/jobinfo/skipCurrentStation', keycloak.protect(), harborUtil.auth, jobinfoController.skipCurrentStation);
  router.post('/jobinfo/reject', keycloak.protect(), jobinfoController.rejectJob);
  
  /* JOBRESULT Router */
  router.get('/jobresult/:id', keycloak.protect(), jobResultController.view);
  router.get('/federatedjobresult/:id', keycloak.protect(), jobResultController.viewFL)
  router.get('/jobresult/:id/download', keycloak.protect(), jobResultController.download);
  router.get('/federatedjobresult/:id/download', keycloak.protect(), jobResultController.downloadFL)

  /* FL JOBINFO Router */
  router.get('/federatedjobinfo', keycloak.protect(), fl_jobinfoController.list);
  router.get('/federatedjobinfo/:id', keycloak.protect(), fl_jobinfoController.listForStation);
  router.post('/federatedjobinfo', keycloak.protect(), harborUtil.auth, fl_jobinfoController.add);
  router.post('/federatedjobinfo/:stationId/:jobId/status', keycloak.protect(), harborUtil.auth, fl_jobinfoController.handleStatusUpdate);
  router.get('/federatedjobinfo/:stationId/:jobId/events', keycloak.protect(), harborUtil.auth, fl_jobinfoController.getEventsForStation);
  router.get('/federatedjobinfo/:stationId/:jobId/model', keycloak.protect(), harborUtil.auth, fl_jobinfoController.getLatestModel);
  router.post('/federatedjobinfo/:stationId/:jobId/result', keycloak.protect(), harborUtil.auth, fl_jobinfoController.handleStationResult);
  router.post('/federatedjobinfo/:stationId/:jobId/storage', keycloak.protect(), harborUtil.auth, fl_jobinfoController.handleStationStorage);
  router.get('/federatedjobinfo/:jobId/aggregationlogs', keycloak.protect(), harborUtil.auth,  fl_jobinfoController.getAggregationLogs);

  /* HARBOR Router */
  router.get('/harbor/projects', keycloak.protect(), harborUtil.auth, harborController.getProjects);
  router.get('/harbor/trains', keycloak.protect(), harborUtil.auth, harborController.getTrainClassRepositories);
  router.get('/harbor/federatedtrains', keycloak.protect(), harborUtil.auth, harborController.getFederatedTrainClassRepositories);

  /* STATION ROUTER */
  router.get('/stations', keycloak.protect(), stationController.getStations);
  router.post('/stations/onboard', stationController.onboardStation);
  router.post('/stations/publickey', keycloak.protect(), stationController.storeStationPublicKey);
  router.get('/stations/publickey', stationController.getStationPublicKey);
  router.get('/stations/signaturepublickey', stationController.getImageSignaturePublicKey);

  return router;
};
