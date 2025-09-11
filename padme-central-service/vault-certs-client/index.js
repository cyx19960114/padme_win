const fs = require('fs')
const certDirectory = '/usr/src/app/vault-certs-client/certs';
const certs = {
    ca: fs.readFileSync(`${certDirectory}/ca.pem`),
    key: fs.readFileSync(`${certDirectory}/key.pem`),
    cert: fs.readFileSync(`${certDirectory}/cert.pem`),
};

module.exports = {
    getAgentOptions: () => {
        return {
            ca: certs.ca,
            cert: certs.cert,
            key: certs.key,
        }
    }
};