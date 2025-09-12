const fs = require('fs');
const path = require('path');

const certDirectory = path.join(__dirname, 'certs');

// Check if TLS is enabled and certificates exist
const useDinDTLS = process.env.DOCKER_TLS_VERIFY !== '' && fs.existsSync(certDirectory);

let certs = null;
if (useDinDTLS) {
    try {
        certs = {
            ca: fs.readFileSync(path.join(certDirectory, 'ca.pem')),
            key: fs.readFileSync(path.join(certDirectory, 'key.pem')),
            cert: fs.readFileSync(path.join(certDirectory, 'cert.pem')),
        };
    } catch (error) {
        console.warn('DinD TLS certificates not found, using non-TLS connection');
        certs = null;
    }
}

module.exports = {
    getAgentOptions: () => {
        if (certs) {
            return {
                ca: certs.ca,
                cert: certs.cert,
                key: certs.key,
            }
        } else {
            return {};
        }
    }
};