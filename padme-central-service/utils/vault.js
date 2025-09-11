const { getAgentOptions } = require('../vault-certs-client');
const { getEnvOrThrow } = require('./environment');
const commonUtil = require('./common');

const CONSTANTS = {
    'KV_ENGINE': {
        'RSA':{
            'KEY_NAME':{
                'PUBLIC_KEY':'public_key'
            }
        }
    },
    'TRANSIT_ENGINE': {
        'RSA':{
            'KEY_NAME':{
                'LATEST_VERSION': 'latest_version',
                'PUBLIC_KEY':'public_key',
            }
        }
    },    
}

const getPublicKeyKvEngineName = () => {
    const engineName = 'public_key';
    return engineName;
}

const getStationPublicKeyBasePath = () => {
    // KV-engine name
    const path = getPublicKeyKvEngineName(); 
    return path;
}

// KV version 2
const getStationPublicKeyPath = (username) => {
    const path = commonUtil.combineURLs(getStationPublicKeyBasePath(), `data/${username}`);
    return path;
}

// KV version 2
const getStationPublicKeyListPath = () => {
    const path = commonUtil.combineURLs(getStationPublicKeyBasePath(), 'metadata');
    return path;
}

const getTrainTransitEngineName = () => {
    const engineName = 'transit';
    return engineName;
}

const getCentralServicePublicKeyBasePath = () => {
    // transit-engine name
    const transitEngineName = getTrainTransitEngineName();
    const path = commonUtil.combineURLs(transitEngineName, 'keys'); 
    return path;
}

const getCentralServicePublicKeyPath = (jobId) => {
    // LATER we will add job id, each job gets its own key-pair
    if (!jobId)
        jobId = 'central_service_rsa'
    const path = commonUtil.combineURLs(getCentralServicePublicKeyBasePath(), jobId); 
    return path;
}

const getCentralServicePrivateKeyBasePath = () => {
    // transit-engine name
    const transitEngineName = getTrainTransitEngineName();
    const path = commonUtil.combineURLs(transitEngineName, 'export/encryption-key'); 
    return path;
}

const getCentralServicePrivateKeyPath = (jobId) => {
    // LATER we will add job id, each job gets its own key-pair
    if (!jobId)
        jobId = 'central_service_rsa'
    const path = commonUtil.combineURLs(getCentralServicePrivateKeyBasePath(), jobId); 
    return path;
}

const getCentralServiceKeyPairBasePath = () => {
    // transit-engine name
    const transitEngineName = getTrainTransitEngineName();
    const path = commonUtil.combineURLs(transitEngineName, 'keys'); 
    return path;
}

const getCentralServiceKeyPairPath = (jobId) => {
    const path = commonUtil.combineURLs(getCentralServiceKeyPairBasePath(), jobId); 
    return path;
}

const getImageSignaturePublicKeyPath = () => {
    return 'signature_public_key/data/public_key';
}

class Vault
{
    //------------------ Properties ------------------
    #client;
    #clientReady;

    /**
     * 
     * @returns A singleton VaultInstance object
     */
    constructor() {
        //Ensure only one Vault client can be created
        if (Vault._instance) {
            return Vault._instance;
        }
        Vault._instance = this;

        //Create client
        Vault._instance.#client = require("node-vault")({
            apiVersion: process.env.VAULT_API_VERSION || 'v1',
            endpoint: `https://${getEnvOrThrow("VAULT_HOST")}:${process.env.VAULT_PORT || "8200"}`,
            requestOptions : {
                agentOptions: getAgentOptions()
            }
        });

        //Initially client is not ready
        Vault._instance.#clientReady = false;
    }

    #handleTokenRenewal(token)
    {
        console.log(`Got vault token with ${token["lease_duration"]}s remaining lease`);
        //Timeout can only take a maximum of 2147483647 milliseconds -> So this is the maximum time we wait
        let refreshTimeMilliseconds = Math.min((token["lease_duration"] - 300) * 1000, 2147483647);
        if (token["renewable"] === true && refreshTimeMilliseconds > 0)
        {
            console.log(`Will refresh token in ${refreshTimeMilliseconds / 1000}s.`)
            setTimeout(Vault._instance.#renewVaultToken, refreshTimeMilliseconds);
        } else {
            console.log(`Will reauthenticate in ${refreshTimeMilliseconds / 1000}s.`)
            setTimeout(Vault._instance.#loginWithAppRole, refreshTimeMilliseconds);
        }
    }

    async #renewVaultToken()
    {
        try {
            console.log("Renewing vault token");
            const renewedToken = await Vault._instance.#client.tokenRenewSelf();
            Vault._instance.#handleTokenRenewal(renewedToken["auth"]);
        } catch(err) {
            console.error('Failed to renew vault token:');
            console.error(err);
            Vault._instance.#clientReady = false;
        }
    }

    /**
     * @param {boolean} shouldThrow whether this method should throw an
     * error when the login failes. Default = false.
     * If this value is set to false, only the clientRedy parameter
     * will be set to false and the login will 'silently' fail
     * @throws {Error} When login failes (due to whatever reason)
     */
    async #loginWithAppRole(shouldThrow = false)
    {
        try {
            console.log("Fetching token from vault")
            const loginResult = await Vault._instance.#client.approleLogin({
                role_id: getEnvOrThrow("VAULT_ROLE_ID"),
                secret_id: getEnvOrThrow("VAULT_SECRET_ID"),
            });
            
            Vault._instance.#clientReady = true;
            //Trigger the renewal of the token in the background (without await)
            Vault._instance.#handleTokenRenewal(loginResult["auth"]);
        } catch(err) {
            console.error('Failed to fetch new token from vault:');
            console.error(err);
            Vault._instance.#clientReady = false;

            if (shouldThrow === true) throw err;
        }
    }

    async getInstance() {
        //If the client is not ready yet, try to login
        if (this.#clientReady === false)
        {
            //Login
            //-> This method throws an error if login does not succeed
            //-> If no error is thrown (login succeeded) the client is
            //   ready and can be returned
            await this.#loginWithAppRole(true);
        } 
        return this.#client;     
    }
}

module.exports = {
    CONSTANTS: CONSTANTS,
    getVaultInstance: () => {
        return new Vault().getInstance()
    },
    writeStationPublicKey: async (username, publicKey) => {
        const keyPath = getStationPublicKeyPath(username);
        const data = {
            public_key : publicKey
        };
        const opts = {
            data
        };
        const client = await new Vault().getInstance();
        return client.write(keyPath, opts);
    },

    readStationPublicKey: async (username) => {
        const keyPath = getStationPublicKeyPath(username);
        const client = await new Vault().getInstance();
        return client.read(keyPath);
    },

    listStationPublicKey: async () => {
        const listPath = getStationPublicKeyListPath();
        const client = await new Vault().getInstance();
        return client.list(listPath);
    },

    readCentralServicePublicKey: async (jobId) => {
        const keyPath = getCentralServicePublicKeyPath(jobId);
        const client = await new Vault().getInstance();
        return client.read(keyPath);
    },

    readCentralServicePrivateKey: async (jobId) => {
        const keyPath = getCentralServicePrivateKeyPath(jobId);
        const client = await new Vault().getInstance();
        return client.read(keyPath);
    },
    
    writeCentralServiceKeyPair: async (jobId) => {
        const keyPath = getCentralServiceKeyPairPath(jobId);
        // Vault options - https://www.vaultproject.io/api-docs/secret/transit#create-key
        const opts = { "type": "rsa-4096", "name": jobId, "derived": false, "exportable": true, "convergent_encryption": false, "allow_plaintext_backup": true, "deletion_allowed": true };
        const client = await new Vault().getInstance();
        return client.write(keyPath, opts);
    },

    readImageSignaturePublicKey: async () => {
        const keyPath = getImageSignaturePublicKeyPath();
        const client = await new Vault().getInstance();
        return client.read(keyPath);
    }

};