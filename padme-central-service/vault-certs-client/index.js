const fs = require('fs')
const certDirectory = '/usr/src/app/vault-certs-client/certs';

// Check if certificates exist and Vault TLS is enabled
const useVaultTLS = process.env.VAULT_TLS_VERIFY !== '' && fs.existsSync(certDirectory);

let certs = null;
if (useVaultTLS) {
    try {
        certs = {
            ca: fs.readFileSync(`${certDirectory}/ca.pem`),
            key: fs.readFileSync(`${certDirectory}/key.pem`),
            cert: fs.readFileSync(`${certDirectory}/cert.pem`),
        };
    } catch (error) {
        console.warn('Vault TLS certificates not found, using non-TLS connection');
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
            // Return empty options for non-TLS connections
            return {};
        }
    }
};