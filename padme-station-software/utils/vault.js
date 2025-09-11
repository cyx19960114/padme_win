const dns = require('dns');
const { getAgentOptions } = require('../vault-certs-client');
const utility  = require('./utility');

const options = {
    apiVersion: process.env.VAULT_API_VERSION || 'v1',
    endpoint: `https://${process.env.VAULT_HOST}:${process.env.VAULT_PORT}`,
    token: process.env.VAULT_TOKEN || 'client_token',
    requestOptions : {
        agentOptions: getAgentOptions()
    }
};

const vault = require("node-vault")(options);

const defaultTransitEngineName = "transit";
const getDefaultTransitEngineName = () => {
    return defaultTransitEngineName;
}

module.exports = {

    command: vault,

    isAuthenticated: async function () {
        let isAuthenticated = false
        try {
            let lookupResult = await vault.tokenLookupSelf();
            console.log(lookupResult);
            if (lookupResult.data) {
                isAuthenticated = true;
            }
        } catch (error) {
            // console.log(JSON.stringify(error));
        }
        return isAuthenticated;
    },

    setToken: (token) => {
        process.env.VAULT_TOKEN = token;
        vault.token = token;
    },

    getVaultApiEndpoint: async () => {

        return new Promise((resolve, reject) => {
            let vaultApiEndpoint = `${vault.endpoint}/${vault.apiVersion}`;
            dns.lookup(process.env.VAULT_HOST, (err, address) => {
                if (err)
                    resolve(vaultApiEndpoint);
                vaultApiEndpoint = vaultApiEndpoint.replace(process.env.VAULT_HOST, address);
                resolve(vaultApiEndpoint);
            });
        });
    },

    getKeyValueEngines: async function (version) {

        let result = await this.read("sys/internal/ui/mounts");
        let kv_engines = [];
        if (!result.isError) {
            let data = result.data;
            let engines = Object.keys(data.secret);
            kv_engines = engines.filter(x => data.secret[x].type == "kv");
            if (version)
                kv_engines = kv_engines.filter(x => data.secret[x].options.version == version)
        }
        return kv_engines;
    },

    //Recursively iterates through all sub-paths
    traverse: function (paths, callback) {

        let pathIndex = paths.findIndex(x => x.endsWith("/"));
        if (pathIndex < 0) {
            // There is no more sub-path - call callback function and return
            if (callback)
                callback(paths);
            return paths;
        }

        let path = paths[pathIndex];
        paths.splice(pathIndex, 1);

        this.list(path).then(result => {
            if (!result.isError) {
                let keys = result.data.keys;
                paths = paths.concat(keys.map(key => path + key));
            }
            this.traverse(paths, callback);
        });
    },

    getTrainToken: function (config = {}) {

        let payload = {};

        // payload["policies"] = ["train"];
        // payload["no_default_policy"] = true;
        payload["policies"] = ["default"];
        payload["num_uses"] = config.num_uses || 1;

        // return this.write("auth/token/create/train", payload);
        return this.write("auth/token/create", payload);
    },

    // GET
    read: async (path, requestOptions) => {
        try {
            let result = await vault.read(path, requestOptions);
            return result;
        } catch (error) {
            console.log(JSON.stringify(error));
            return { "isError": true, "data": error };
        }
    },

    // POST
    write: async (path, data, requestOptions) => {
        try {
            let result = await vault.write(path, data, requestOptions);
            return result || { "isError": false };
        } catch (error) {
            console.log(JSON.stringify(error));
            return { "isError": true, "data": error };
        }
    },

    // LIST
    list: async (path, requestOptions) => {
        try {
            let result = await vault.list(path, requestOptions);
            return result;
        } catch (error) {
            console.log(JSON.stringify(error));
            return { "isError": true, "data": error };
        }
    },

    // DELETE
    delete: async (path, requestOptions) => {
        try {
            let result = await vault.delete(path, requestOptions);
            return result || { "isError": false };
        } catch (error) {
            console.log(JSON.stringify(error));
            return { "isError": true, "data": error };
        }
    },

    transitEngineIsEnabled: async () => {
        try {
            let basePath = "/sys/internal/ui/mounts/";
            let transitEngineName = getDefaultTransitEngineName();
            let path = utility.combineURLs(basePath, transitEngineName);
            let result = await vault.read(path);
            return Promise.resolve(true);
        } catch (error) {
            return Promise.resolve(false);
        }
    },

    enableTransitEngine: async () => {
        try {
            let basePath = "sys/mounts/";
            let transitEngineName = getDefaultTransitEngineName();
            let path = utility.combineURLs(basePath, transitEngineName);
            let opts = { "path": transitEngineName, "type": "transit", "config": {}, "generate_signing_key": true };
            let result = await vault.write(path, opts);
            return Promise.resolve(result);
        } catch (error) {
            console.log(error);
            return Promise.reject(error);
        }
    },

    healthStatus: async() => {

        try {
            
            let vaultHealthStatus = await vault.health();
            console.log(vaultHealthStatus);

            if (vaultHealthStatus.isError) {
                return Promise.reject("Error: Vault");
            }
        
            if (!vaultHealthStatus.initialized) {
                return Promise.reject("Error: Vault is not initialized");
            }
        
            if (vaultHealthStatus.sealed) {
                return Promise.reject("Error: Vault is sealed");
            }

            try {
                let lookupResult = await vault.tokenLookupSelf();
                console.log(lookupResult);
                if (lookupResult.data) {
                    return Promise.resolve();
                }
            } catch (error) {
                return Promise.reject("Error: Vault authentication failed");
            }
            
        } catch (error) {
            console.log(error);
            return Promise.reject("Error: Vault connection refused");
        }
    }

};