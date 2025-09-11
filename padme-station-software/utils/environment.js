const utility = require('./utility.js');
const vault  = require('./vault.js');

/**
 * Creates the env array for the given enviroment variables
 * Needs vault to be unlocked
 * @param {*} envs the source envs to use
 * @returns an array containing strings with the scheme NAME=VALUE for all environmentvariables
 */
const createEnvsArray = async function (envs)
{
    return new Promise(async (res, rej) => {

        let env_array = [];
        let env_array_manual = [];
        let env_array_vault = [];
        let env_array_vault_temp = [];

        //Separate manual type env variables from vault type env variables
        envs.forEach(item => {

            item.name = item.name.trim();

            if (item.type === "manual") {
                if (item.name.length < 1)
                    return;
                    
                item.value = item.value.trim();                                
                env_array_manual.push(`${item.name}=${item.value}`);
            }
            else if (item.type === "vault") {
                let temp = {
                    path: JSON.parse(item.value).path,
                    env: item.name,
                    key: JSON.parse(item.value).key
                };
                env_array_vault_temp.push(temp);
            }
        });

        //Group the vault envs by their path
        env_array_vault_temp = utility.groupBy(env_array_vault_temp, 'path');

        //Generate config JSON - below is a small structural sample
        // [
        //     {
        //         "path": "PATH_TO_SECRET",
        //         "kv": {
        //             "TRAIN_ENV_VARIABLE": "RESPONSE_WRAPPING_TOKEN"
        //         }
        //     }
        // ]

        // WRAPPED RESULT
        let uniquePaths = Object.keys(env_array_vault_temp);
        for (let index = 0; index < uniquePaths.length; index++) {
            const path = uniquePaths[index];
            // Get Response-Wrapping Token on path
            const response = await vault.read(path, { headers: { "X-Vault-Wrap-TTL": "1h" } });
            if (response.isError) {
                rej((JSON.stringify(response.data) || 'error'));
                return;
            }
            let temp = { path: response.wrap_info.token, kv: {} };
            env_array_vault_temp[path].forEach(x => {
                temp.kv[x.env] = x.key
            })
            env_array_vault.push(temp);
        }

        //Vault configs
        if (env_array_vault.length > 0) {

            let tokenConfig = {
                num_uses: env_array_vault.length
            };

            // console.log("GetTrainToken");
            const trainToken = await vault.getTrainToken(tokenConfig);
            // console.log("Token:", trainToken);
            if (trainToken.isError) {
                rej((JSON.stringify(trainToken.data) || 'error'));
                return;
            }

            env_array.push(`VAULT_ADDR=${await vault.getVaultApiEndpoint()}/sys/wrapping/unwrap`);
            env_array.push(`VAULT_TOKEN=${trainToken.auth.client_token}`);
            env_array.push(`VAULT_SECRET_CONFIG=${JSON.stringify(env_array_vault)}`);
        }

        env_array = env_array.concat(env_array_manual);

        res(env_array);
    });
}

module.exports = {
    createEnvsArray,
}