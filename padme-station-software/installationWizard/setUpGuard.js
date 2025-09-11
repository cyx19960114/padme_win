// PHT station installation wizard
// 2020
const installationWizardApp = require("../installationWizard/app");
const { envFileToTuples } = require("./utils/envFileParser");
const locks = require("./utils/Lock.js");
const base64Util = require("../utils/base64");

function applyEnvConfiguration(content) {
  const tuples = envFileToTuples(content);

  tuples.forEach(([key, value]) => {
    process.env[key] = value;
  });
}

module.exports = (lockfiledir) =>
  async function setUpGuard(port) {
    // this guard function checks if a config file exists
    // if so, it loads the env settings from the file and applies them to the current process
    // if not, it starts the setup and waits for its finish. After the configuration is finished, it writes the configurations into the lockfile
    //if so, station already configured
    return locks.checkLock(lockfiledir).then(async (does) => {
      if (does) {
        // nothing to do here
        console.log("Lockfile found, apply env and skipping wizard...");
        const lockContent = await locks.getContentFromLock(lockfiledir);
        // apply env; assume content has the right format
        applyEnvConfiguration(lockContent);
        return Promise.resolve();
      } else {
        // start Wizard
        installationWizardApp.set("port", port);
        const server = installationWizardApp.listen(port, () =>
          console.log(`Started Installation wizard on port ${port}`)
        );

        const configurationManager = installationWizardApp.get("configurationManager");
        // this method resolves its promise when the configuration ends
        await configurationManager.configurationEnd();

        const privateKey = `PRIVATE_KEY="${base64Util.encode(configurationManager.privateKey)}"`;
        const publicKey = `PUBLIC_KEY="${base64Util.encode(configurationManager.publicKey)}"`;
        const envContent = `${configurationManager.envconfiguration}\n${privateKey}\n${publicKey}`

        locks.createLock(lockfiledir, envContent);
        applyEnvConfiguration(envContent);

        // set up ended here
        server.close();
        console.log("Setup ended, proceed with program execution.");
        return Promise.resolve();
      }
    });
  };
