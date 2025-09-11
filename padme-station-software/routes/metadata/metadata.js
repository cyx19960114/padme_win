const express = require("express");
const router = express.Router();
const axios = require("axios");

module.exports = (keycloak) => {
  router.post("/updateList", keycloak.protect(), async (req, res) => {
    const host =
      process.env.METADATAPROVIDER_ENDPOINT || "http://metadataprovider:9988";
    const { list, useAllowList } = req.body;
    if (useAllowList === "true") {
      useAllowListBool = true;
    } else {
      useAllowListBool = false;
    }
    console.log("UseALlowList" + String(useAllowListBool));
    // the metadata provider needs an list instead of an array
    listArray = list.split("\n");
    // post to the server, if result is 200, flash a message to the user
    axios
      .post(
        host + "/filter",
        JSON.stringify({ list: listArray, useAllowList: useAllowListBool })
      )
      .then((respond) => {
        if (respond.statusCode === 200) {
          req.flash("success_msg", "MetadataProvider service updated!");
          res.redirect("/dashboard/metadata");
        } else {
          req.flash("ERROR");
          res.redirect("/dashboard/metadata");
        }
      })
      .catch((err) => {
        req.flash("ERROR");
        res.redirect("/dashboard/metadata");
      });
  });

  router.post("/stationIdentifier", keycloak.protect(), async (req, res) => {
    // update the station identifier of the metadata provider
    const host =
      process.env.METADATAPROVIDER_ENDPOINT || "http://metadataprovider:9988";
    const { stationIdentifier } = req.body;
    console.log("Station Identifier to set:" + stationIdentifier);
    axios
      .post(host + "/configuration", JSON.stringify({ stationIdentifier }))
      .then((respond) => {
        if (respond.statusCode === 200) {
          res.flash("success_msg", "Station Identifier updated!");
          res.redirect("/dashboard/metadata");
        } else {
          res.flash("ERROR");
          res.redirect("/dashboard/metadata");
        }
      })
      .catch((err) => {
        res.flash("ERROR");
        console.log("Error while setting stationIdentifier:" + String(err));
      });
  });

  return router;
};
