// Environment variable config
require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const mongoose = require("mongoose");
const promiseRetry = require("promise-retry");
const config = require("./config/keys");
const Crypto = require("crypto");
const FLJobManager = require("./federated/flJobManager");

function randomString(size = 21) {
  return Crypto.randomBytes(size).toString("base64").slice(0, size);
}

var app = express();

if (process.env.NODE_ENV === "development") {
  const cors = require("cors");
  app.use(
    cors({
      origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
      exposedHeaders: ["Content-Disposition"],
    })
  );
}

// Connect to MongoDB - START
const mongoURI = config.mongoURI;
console.log(mongoURI);

// https://jira.mongodb.org/browse/NODE-1643
const mongooseConnectOptions = {
  useNewUrlParser: true,
  maxPoolSize: 10,
  useUnifiedTopology: true,
  //Retry gibt es nicht mehr (was eh nicht das getan hat was wir wollten)
  //Buffermax size ist nicht mehr supported
  //Geändertes setting für maxPoolSize
};

const promiseRetryOptions = {
  retries: 60,
  factor: 1.5,
  minTimeout: 1000,
  maxTimeout: 5000,
};

mongoose.set("strictQuery", false);

const connectToMongoDB = (url) => {
  return promiseRetry((retry, number) => {
    console.log(`MongoClient connecting to ${url} - retry number: ${number}`);
    return mongoose.connect(url, mongooseConnectOptions).catch((err) => {
      console.log(err);
      retry();
    });
  }, promiseRetryOptions);
};

connectToMongoDB(mongoURI);

const memoryStore = new session.MemoryStore();

// Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET || randomString(32),
    resave: true,
    saveUninitialized: true,
    store: memoryStore,
  })
);

// Keycloak Middleware
const keycloak = require("./config/keycloak-config").initKeycloak(memoryStore);
app.use(keycloak.middleware());

// Log all details in production for better visibility and finding bugs
if (app.get("env") === "development") {
  app.use(logger("dev"));
} else {
  app.use(logger("combined"));
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, './assets')));

// parse application/json
app.use(express.json());
app.use("/", express.static("station-frontend/build"));

const dashboardRouter = require("./routes/dashboard")(keycloak);
const federatedRouter = require("./routes/federated")(keycloak);
const metadataRouter = require("./routes/metadata/metadata")(keycloak);
const dockerAPIRouter = require("./routes/docker/docker")(keycloak);
const vaultRouter = require("./routes/vault")(keycloak);
const telegrafRouter = require("./routes/telegraf/telegraf");
const { loginToRegistry, downloadSignaturePublicKey } = require("./utils/cosign");

app.use("/dashboard", dashboardRouter);
app.use("/federated", federatedRouter);
app.use("/metadata", metadataRouter);
app.use("/docker", dockerAPIRouter);
app.use("/vault", vaultRouter);
app.use("/telegraf", telegrafRouter);

if (process.env.COSIGN_ENABLED === 'true') {
  // Cosign login To harbor registry 
  loginToRegistry();
  // Download the public key to verify image signatures
  downloadSignaturePublicKey();
}

//Restart FL Jobs that have not been finished last time the Station was running
//Async function but can run in background
let jobManager = new FLJobManager();
jobManager.restartPendingJobs();

/**
 * Refreshing on any page in the dashboard sends 404 Page Not Found.
 * To prevent this, we catch all such requests and send them back to react-router-dom
 */
app.use(function (req, res) {
  res.sendFile(path.join(__dirname, "station-frontend/build", "index.html"));
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  console.log(err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).send({ error: err });
});

module.exports = app;
