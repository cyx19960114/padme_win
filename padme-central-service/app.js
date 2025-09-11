require('dotenv').config();
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const session =  require("express-session");
var app = express();

// For DEV purposes
// This is for whitelisting Reacts development server to access APIs.
if (process.env.NODE_ENV) {
  const cors = require("cors");

  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      exposedHeaders: ["Content-Disposition"]
    })
  )
}

const HOST_BASE = `${process.env.HOST_BASE ? `/${process.env.HOST_BASE}` : ''}`

// Configure session
var memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: "pht-central-service-secret",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
    name: "pht_central_service_session"
  })
);

const keycloak = require("./config/keycloak.config.js").initKeyCloak(
  memoryStore
);

app.use(keycloak.middleware());

// We use a proxy, therefore, we need to trust proxies:
// we use docker, therefore we need to trust a specific range of ip adresses
// fast fix: trust everything
app.set('trust proxy', function (ip) {
  return true // trusted IPs
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//Increase Maximal Post size (needed for FL)
//Also inflate compressed archives
app.use(express.raw({
  inflate: true,
  type: 'application/octet-stream',
  limit: '1gb'
}));

// Adding frontend build folder
app.use(`${HOST_BASE}/`, express.static('TrainRequester/build'));

//Routes
const apiRouter = require('./routes/api')(keycloak);
const hookRouter = require('./routes/hook');

app.use(`${HOST_BASE}/api`, apiRouter);
app.use(`${HOST_BASE}/hook`, hookRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send({ error: 'Not found' })
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log(err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500).send({ error: err })
});

module.exports = app;
