const express = require("express");
const routerFactory = require("./installationWizard");
const configurationManager = require("./configurationManager");

const app = express();

/**
 * Enable cors for development. Otherwise we cannot access APIs from react frontend.
 * 
 * NOTE: Below is the localhost url for react app.
 * Port can be replaced with whatever port react
 * app is running on.
 */
if (process.env.NODE_ENV === "development") {
  const cors = require("cors");
  app.use(
    cors({
      origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    })
  );
}

// Middleware to serve Wizard UI build files
app.use("/", express.static("wizard-frontend/build"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));
app.use("/setup", routerFactory(configurationManager));

app.set("configurationManager", configurationManager);

module.exports = app;
