const express = require("express");
const router = express.Router();
const { vault } = require("../utils");

module.exports = (keycloak) => {
  router.get("/status", keycloak.protect(), async (req, res) => {
    const healthStatus = await vault.command.health();
    if (healthStatus?.isError) {
      return res
        .status(400)
        .send(JSON.stringify(healthStatus?.data?.error) || "Vault error");
    }

    const authenticated = await vault.isAuthenticated();
    const transitEngineEnabled = await vault.transitEngineIsEnabled();

    if (
      healthStatus.initialized &&
      !healthStatus.sealed &&
      authenticated &&
      !transitEngineEnabled
    ) {
      try {
        const result = await vault.enableTransitEngine();
        console.log("TRANSIT ENGINE RESULT", result);
      } catch (err) {
        return res.status(err.response.statusCode).send(err.message);
      }
    }

    const kvEngines = await vault.getKeyValueEngines(); // Returns list of KV pairs
    res.send({
      initialized: healthStatus.initialized,
      sealed: healthStatus.sealed,
      authenticated,
      kvEngines,
      config: {
        stationID: process.env.STATION_ID,
        stationName: process.env.STATION_NAME,
      },
    });
  });

  router.get("/unseal/status", keycloak.protect(), async (req, res) => {
    const sealStatus = await vault.command.status();
    res.send({ progress: sealStatus.progress, total: sealStatus.t });
  });

  router.post("/init/v2", keycloak.protect(), async (req, res) => {
    const { keyShares, keyThreshold } = req.body;
    const vaultKeys = await vault.command.init({
      secret_shares: parseInt(keyShares),
      secret_threshold: parseInt(keyThreshold),
    });

    res.send({ vaultKeys, keyThreshold });
  });

  router.post("/unseal/v2", keycloak.protect(), async (req, res) => {
    const { key } = req.body;

    try {
      const sealStatus = await vault.command.unseal({ key });
      res.send({
        progress: sealStatus.progress,
        total: sealStatus.t,
        sealed: sealStatus.sealed,
      });
    } catch (err) {
      return res.status(err.response.statusCode).send(err.message);
    }
  });

  router.post("/set-token/v2", keycloak.protect(), async (req, res) => {
    const { token } = req.body;
    vault.setToken(token);

    const authenticated = await vault.isAuthenticated();
    if (!authenticated) {
      return res.status(400).send("Unable to authenticate vault");
    }

    res.send("Logged into Vault!");
  });

  router.get("/kv/engines/v2", keycloak.protect(), async (req, res) => {
    const payload = [];
    const kvEngines = await vault.getKeyValueEngines();

    for (const engine of kvEngines) {
      let vaultApiPath = engine;
      const kvEngineConfig = await vault.read(
        `sys/internal/ui/mounts/${engine.split("/")[0]}`
      );

      if (kvEngineConfig.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(kvEngineConfig) ||
              `Error fetching '${engine}' configuration`
          );
      }

      if (kvEngineConfig.data.options.version == 2) {
        let temp = engine.split("/");
        temp.splice(1, 0, "metadata");
        vaultApiPath = temp.join("/");
      }

      /**
       * Create vault path breadcrumbs.
       * Not needed in the new UI for station software,
       * however kept here for reference
       */
      // let vaultPathBreadcrumb = vaultPath.split('/').slice(0, -1).map(function (o, i) {
      //         return { "showName": o, "href": (vaultPath.split('/').slice(0, i + 1).concat('').join('/')) };
      // });

      let result = await vault.list(vaultApiPath);
      payload.push({ name: engine, paths: result?.data?.keys || [] });
    }

    res.send(payload);
  });

  router.post("/kv/enable/v2", keycloak.protect(), async (req, res) => {
    const { path, version } = req.body;
    const vaultReqBody = {
      path: path,
      type: "kv",
      config: {},
      options: { version: version },
      generate_signing_key: true,
    };
    const result = await vault.write(`sys/mounts/${path}`, vaultReqBody);

    if (result.isError) {
      return res
        .status(400)
        .send(JSON.stringify(result) || `Error enabling kv engine for ${path}`);
    }

    res.send(`KV Engine ${path} enabled successfully`);
  });

  router.get(
    "/kv/disable/v2/:kvEngine",
    keycloak.protect(),
    async (req, res) => {
      const kvEngine = req.params.kvEngine;
      const result = await vault.delete(`sys/mounts/${kvEngine}`);

      if (result.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(result) || `Error disabling KV Engine ${kvEngine}`
          );
      }

      res.send(`KV Engine ${kvEngine} disabled successfully`);
    }
  );

  router.get(
    "/kv/configuration/v2/:kvEngine",
    keycloak.protect(),
    async (req, res) => {
      const kvEngine = req.params.kvEngine;
      const result = await vault.read(`sys/internal/ui/mounts/${kvEngine}`);

      if (result.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(result) ||
              `Error fetching '${kvEngine}' configuration`
          );
      }
      res.send(result.data);
    }
  );

  router.post("/kv/secret/create/v2", keycloak.protect(), async (req, res) => {
    const { vaultPath, secretPath, secretData } = req.body;
    const vaultApiPath = `${vaultPath}${secretPath}`;
    const result = await vault.write(vaultApiPath, secretData);

    if (result.isError) {
      return res
        .status(400)
        .send(
          `Error creating secret for ${vaultPath}: ${
            result?.data?.response?.body?.errors?.join(". ") ||
            "Please enter correct secret path"
          }`
        );
    }

    res.send(`Secret ${vaultApiPath} created successfully`);
  });

  router.get(
    "/kv/secret/read/v2/:path",
    keycloak.protect(),
    async (req, res) => {
      const vaultPath = req.params.path;
      let vaultAPIPath = vaultPath;
      const engine = vaultPath.split("/")[0];
      const kvEngineConfig = await vault.read(
        `sys/internal/ui/mounts/${engine}`
      );

      if (kvEngineConfig.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(kvEngineConfig) ||
              `Error fetching '${engine}' configuration`
          );
      }

      const isVersionV2 = kvEngineConfig.data.options.version == 2;
      if (isVersionV2) {
        let tempPath = vaultPath.split("/");
        tempPath.splice(1, 0, "data");
        vaultAPIPath = temp.join("/");
      }

      let result = await vault.read(vaultAPIPath);
      if (result.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(result) ||
              `Error fetching '${vaultAPIPath}' secret data`
          );
      }

      result = isVersionV2 ? result.data.data : result.data;
      result = Object.entries(result).map(([skey, svalue]) => ({
        name: skey,
        type: "password",
        value: svalue,
      }));

      res.send({
        path: vaultPath,
        secretData: result,
        secretMetadata: isVersionV2 ? result.data.metadata : null,
      });
    }
  );

  router.post("/kv/secret/edit/v2", keycloak.protect(), async (req, res) => {
    const { vaultPath, secretData } = req.body;
    const result = await vault.write(vaultPath, secretData);

    if (result.isError) {
      return res
        .status(400)
        .send(JSON.stringify(result) || `Error setting key-value pairs`);
    }

    res.send("Successfully updated key-value pairs");
  });

  router.get(
    "/kv/secret/delete/v2/:vaultPath",
    keycloak.protect(),
    async (req, res) => {
      const vaultPath = req.params.vaultPath;
      const result = await vault.delete(`${vaultPath}`);

      if (result.isError) {
        return res
          .status(400)
          .send(
            JSON.stringify(result) || `Error deleting Secret '${vaultPath}'`
          );
      }

      res.send(`Secret ${vaultPath} deleted successfully`);
    }
  );

  return router;
};
