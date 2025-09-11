// exports factory

const router = require("express").Router();
const fileUpload = require("express-fileupload");
const controllerFactory = require("./controller");

module.exports = (configurationManager) => {
  const controller = controllerFactory(configurationManager);

  router.post("/uploadAndDecrypt", fileUpload());
  router.post("/uploadAndDecrypt", controller.uploadAndDecrypt);
  router.get("/fetchHarborCredentials", controller.fetchHarborCredentials);
  router.get("/messagehook", controller.messageHook);
  router.post("/HarborPassword", controller.setHarborPassword);
  router.post("/generateKeys", controller.generateKeys);
  router.post("/keys", controller.submitKeys);
  router.get("/stationidentifier", controller.getPreconfiguredStationIRI);
  router.post("/metadatasetup", controller.metadataGeneralSetup);
  router.post("/metadatafilter", controller.setFilterHandler);
  router.post("/complete", controller.configComplete);

  return router;
};
