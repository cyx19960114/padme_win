const fs = require("fs");
const https = require("https");
const axios = require("axios");

const CERT_DIRECTORY = "/usr/src/app/dind-certs-client/certs";

const DockerClient = axios.create({
  baseURL: `https://${process.env.DOCKER_HOST}:${process.env.DOCKER_PORT}`,
  httpsAgent: new https.Agent({
    ca: fs.readFileSync(`${CERT_DIRECTORY}/ca.pem`),
    key: fs.readFileSync(`${CERT_DIRECTORY}/key.pem`),
    cert: fs.readFileSync(`${CERT_DIRECTORY}/cert.pem`),
  }),
});

module.exports = { DockerClient };
