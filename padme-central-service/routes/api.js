const express = require('express');
var router = express.Router();

const jobinfoController = require('../controllers').jobinfo;
const fl_jobinfoController = require('../controllers').fl_jobinfo;
const jobResultController = require('../controllers').jobresult;
// 使用修复后的Harbor控制器
const harborController = require('../controllers/harbor');
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

  /* HARBOR Router - 开发环境直接访问Harbor API */
  router.get('/harbor/projects', harborController.getProjects);
  router.get('/harbor/trains', harborController.getTrainClassRepositories);
  router.get('/harbor/federatedtrains', harborController.getFederatedTrainClassRepositories);
  
  /* TEST Harbor Connection */
  router.get('/test/harbor', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Harbor test endpoint working - DEV MODE',
      harbor_address: process.env.HARBOR_ADDRESS,
      harbor_port: process.env.HARBOR_PORT,
      harbor_url: `http://${process.env.HARBOR_ADDRESS}:${process.env.HARBOR_PORT}`
    });
  });

  /* STATION ROUTER */
  router.get('/stations', keycloak.protect(), stationController.getStations);
  router.post('/stations/onboard', stationController.onboardStation);
  router.post('/stations/publickey', keycloak.protect(), stationController.storeStationPublicKey);
  router.get('/stations/publickey', stationController.getStationPublicKey);
  router.get('/stations/signaturepublickey', stationController.getImageSignaturePublicKey);

  return router;
};
