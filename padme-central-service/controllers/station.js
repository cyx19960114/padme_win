const request = require('request');
const axios = require("axios");
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

const harborUtil = require('../utils').harbor;
const mailClientUtil = require('../utils').mailClient;
const cryptoUtil = require('../utils').crypto;
const commonUtil = require('../utils').common;
const vaultUtil = require('../utils').vault;
const slackBotUtil = require('../utils').slackBot;
const { asyncHandler } = require('../utils').asyncHandler;
const { enroll_station } = require('../utils/metadata_store')
const transformToIri = require('../utils/iri')
 
const KcAdminClient = require('keycloak-admin').default;
const RequiredActionAlias = require('keycloak-admin').requiredAction;

const StationListCacheModel = require('../models').StationListCache;

const kcConfig = {
    getAuthServerBaseUrl : () => {
        const authServer = new URL('/auth', `https://${process.env.AUTH_SERVER_ADDRESS}`);
        authServer.port = process.env.AUTH_SERVER_PORT;
        return authServer;

    },
    getAdminCredentials : () => {
        const kcAdminCredentials = {
            username: process.env.AUTH_SERVER_ADMIN_CLI_USERNAME,
            password: process.env.AUTH_SERVER_ADMIN_CLI_PASSWORD,
            grantType: 'password',
            clientId: 'admin-cli'
        }
        return kcAdminCredentials;
    }
}

const getStationRegistryJwtSecret = () => {
    const STATION_REGISTRY_JWT_SECRET = process.env.STATION_REGISTRY_JWT_SECRET;
    return STATION_REGISTRY_JWT_SECRET;
}

const decodeEntities = (encodedString) => {
    let translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    let translate = {
        "nbsp": " ",
        "amp": "&",
        "quot": "\"",
        "lt": "<",
        "gt": ">"
    };
    return encodedString.replace(translate_re, (match, entity) => {
        return translate[entity];
    }).replace(/&#(\d+);/gi, (match, numStr) => {
        let num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}

// first login to harbor onboards the user on harbor database
const OnboardOnHarbor = (username, password) => {

    return new Promise((resolve, reject) => {

        let cookieJar = request.jar();
        let options = {
            method: "GET",
            url: harborUtil.getLoginAddress(),
            jar: cookieJar,
            followAllRedirects: true,
        }

        request(options, (err, res, body) => {

            if (err)
                reject(err);

            // extract action url from html body
            const $ = cheerio.load(body);
            let keycloakFormLogin = $('#kc-form-login').attr('action');
            console.log(keycloakFormLogin);

            // let url = body.split('"')[89];
            // url = decodeEntities(url);
            // console.log(url);

            request(
                {
                    method: "POST",
                    url: keycloakFormLogin,
                    jar: cookieJar,
                    followAllRedirects: true,
                    form: {
                        username: username,
                        password: password
                    }
                }, (err, res, body) => {

                    if (err)
                        reject(err);

                    // console.log(err);
                    // console.log(res);
                    // console.log(body);

                    // can't use harbor api client library - need to set cookie as a parameter
                    currentUserDetailHarborApiEndpoint = new URL("/api/v2.0/users/current", harborUtil.getUrl());
                    request({
                        method: "GET",
                        url: currentUserDetailHarborApiEndpoint,
                        jar: cookieJar
                    }, (err, res, body) => {

                        if (err)
                            reject(err);

                        console.log(body);
                        resolve(body);
                    });

                }, (err) => reject(err));

        }, (err) => reject(err));
    });
}

const getBaseUrl = () => {
    let protocol = 'https';
    let url = new URL(`${protocol}://${process.env.STATION_REGISTRY_ADDRESS}`);
    url.port = process.env.STATION_REGISTRY_PORT;
    return url.toString();
};

const getApiAddress = () => {
    
    // if the api url is available in env variables and is valid, use it othwerwise use the default
    if (process.env.STATION_REGISTRY_API_ADDRESS) {
        let url = new URL(process.env.STATION_REGISTRY_API_ADDRESS);
        if (url.protocol && url.hostname) {
            return url.toString();
        }
        else
            console.log("Invalid STATION_REGISTRY_API_ADDRESS env variable. Using default.");
    }
    let url = new URL("/api", getBaseUrl());
    return url.toString();
};

const getRequestOptions = () => {

    let options = {
        url: getBaseUrl(),
        headers: {
            'Content-Type': 'application/json',
        },
    };
    return options;
};

const getStationApiRequestOptions = (stationId) => {

    // api/stations/{id}
    let relativeApiURL = commonUtil.combineURLs('stations',stationId);
    let url = new URL(getApiAddress());
    url.pathname = commonUtil.combineURLs(url.pathname, relativeApiURL);

    let options = {
        method: 'GET',
        url: url.toString(),
        json: true,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    return options;
};

const prepareStationModel = (station) => {

    try {

        station['id'] = uuidRegex.exec(station['id'])[0];
        let organization = _.find(station['link-list'], { 'name': 'organization' });
        let stationType = _.find(station['link-list'], { 'name': 'station-type' });
        station['organization'] = { 'name': organization['preview'], 'id': uuidRegex.exec(organization['uri'])[0] };
        station['stationType'] = { 'name': stationType['preview'], 'id': uuidRegex.exec(stationType['uri'])[0] };

        return Promise.resolve(station);

    } catch (error) {
        return Promise.reject(error);
    }
};

const STATION_ONBOARDING_STATUS = {
    'ONLINE': 'ONLINE',
    'OFFLINE': 'OFFLINE'
};

// read a specific station from station registry by id - api/stations/{id}
const getStationById = async (stationId) => {

    try {
        let options = getStationApiRequestOptions(stationId);
        let response = await axios(options); 
        return Promise.resolve(response.data);

    } catch (error) {
        return Promise.reject(error);
    }
};

const getUpdateStationOnboardingStatusUri = async (stationId, status) => {
    try {
        if (!Object.values(STATION_ONBOARDING_STATUS).includes(status)) {
            throw new Error('Status Not Found');
        }
        let station = await getStationById(stationId);
        console.log(station);
        let linkList = station['link-list'];
        let uri = null;
        if (status === STATION_ONBOARDING_STATUS.ONLINE) {
            let prop = _.find(linkList, { 'name': 'set-onboarding-status-online' });
            uri = prop.uri;
        }
        else if (status === STATION_ONBOARDING_STATUS.OFFLINE) {
            let prop = _.find(linkList, { 'name': 'set-onboarding-status-offline' });
            uri = prop.uri;
        }
        
        if(!uri)
            throw new Error('URI Not Found'); 

        return Promise.resolve(uri);
        
    } catch (error) {
        return Promise.reject(error)
    }
};

const createAuthJwtToUpdateStationOnboardingStatus = () => {

    // Signing a token with 1 hour of expiration
    let token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
    }, process.env.STATION_REGISTRY_JWT_SECRET);
    console.log("JWT", token);
    return token;

};

const getUpdateStationOnboardingStatusApiRequestOptions =  async (stationId, status) => {

    try {

        let url = await getUpdateStationOnboardingStatusUri(stationId, status);

        let options = {
            method: 'PUT',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'X-Authorization': createAuthJwtToUpdateStationOnboardingStatus()
            },
        };

        return Promise.resolve(options);
        
    } catch (error) {
        return Promise.reject(error);
    }
};

const updateStationOnboardingStatus = async (stationId, status) => {
    try {
        
        let options = await getUpdateStationOnboardingStatusApiRequestOptions(stationId, status);
        let updateStationOnboardingStatusResult = await axios(options);
        console.log(updateStationOnboardingStatusResult);
        return Promise.resolve(updateStationOnboardingStatusResult);

    } catch (error) {
        console.log(error);
        return Promise.reject(error);
    }
};

//updateStationOnboardingStatus('623c11a7-9c05-45dc-b1c4-76ac7f72dade', STATION_ONBOARDING_STATUS.ONLINE);

const enroll_station_with_env_config = async (station_iri) => {
    const store_url = process.env["METADATA_STORE_URL"]
    const store_secret = process.env["STORE_ENROLLMENT_SECRET"]
    if (store_url == undefined || store_secret == undefined) {
        console.warn("Cannot enroll station du to missing METADATA_STORE_URL or STORE_ENROLLMENT_SECRET")
        return undefined
    } else {
        return enroll_station(station_iri, store_url, store_secret).catch(err => {
            console.warn("Error while enrolling station in metadata store:" + String(err))
            return undefined
        })
    }
}



const uuidRegex = new RegExp('[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');

const CACHE_TTL = process.env.STATION_LIST_CACHE_TTL || 300;
const stationListCache = new NodeCache({ stdTTL: CACHE_TTL, deleteOnExpire: false });
const LIST_CACHE_ID = 'station-list';

const getStationList = async (req, res, next) => {
    let options = getStationApiRequestOptions();

    request(options, (error, response) => {

        if (error) {
            console.log(`Error getting station list: ${error}. Cache not updated.`);
            if (next) {
                return next(error);
            }
        }

        try {

            let responseBody = response.body;
            if (typeof responseBody !== 'object') {
                responseBody = JSON.parse(response.body);
            }

            let stations = responseBody['entity-list'] || [];

            stations = _.forEach(stations, async (row) => {
                try {
                    row = await prepareStationModel(row);                        
                } catch (error) {
                    return;
                }
            });

            // ************* TEMP CODE - START *******************
            stations.push({
                "id": "aachenbeeck",
                "name": "aachenbeeck", "access-level": "PUBLIC",
                "onboarding-status": "OFFLINE",
                "stationType":{ 'name': 'test', 'id': 'test' },
                "organization": { 'name': 'test', 'id': 'test' },
            });

            stations.push({
                "id": "aachenmenzel",
                "name": "aachenmenzel", "access-level": "PUBLIC",
                "onboarding-status": "OFFLINE",
                "stationType":{ 'name': 'test', 'id': 'test' },
                "organization": { 'name': 'test', 'id': 'test' },
            })
            
            // *************** TEMP CODE - START *****************
            
            stationListCache.set(LIST_CACHE_ID, stations);
            console.log(`Stations List cache updated`);
            updateStationListDBFromCache();
            if (res) {
                return res.status(200).send(stations);
            }

        } catch (error) {
            console.log(`Error getting station list: ${error}. Cache not updated.`);
            if (next) {
                return next(error);
            }
        }
    });
}

// On expiration of cache, call the station list API and refresh the cache
stationListCache.on('expired', async function (key) {
    console.log(`Key ${key}  expired , refreshing.`);
    getStationList();  
});

const updateStationListCacheFromDB = async () => {
    const stations = await StationListCacheModel.findOne({
        where: {
            key: LIST_CACHE_ID
        },
        order: [['updatedAt', 'DESC']]
    });
    if (stations != null) {
        console.log(`Stations from DB: ${stations.value.length}`);
        stationListCache.set(LIST_CACHE_ID, stations.value);
    } else {
        console.log(`No station list in DB!`);
    }
}

const updateStationListDBFromCache = async () => {
    const stations = stationListCache.get(LIST_CACHE_ID);
    const stationsModel = await StationListCacheModel.findOne({
        where: {
            key: LIST_CACHE_ID
        },
        order: [['updatedAt', 'DESC']]
    });
    if (stationsModel != null) {
        StationListCacheModel
            .upsert({ id: stationsModel.id, key: LIST_CACHE_ID, value: stations }, { logging: false })
            .then(() => console.log(`Station List Cache DB Table updated`))
            .catch((err) => console.log(`Error updating station list cache db table: ${err}`));
    } else {
        StationListCacheModel
            .create({ key: LIST_CACHE_ID, value: stations })
            .then(() => console.log(`Station List Cache DB Table inserted`))
            .catch((err) => console.log(`Error inserting station list cache db table: ${err}`));
    }
}

updateStationListCacheFromDB();

module.exports = {

    getStations: asyncHandler(async (req, res, next) => {
        let stations = [];
        if (stationListCache.has(LIST_CACHE_ID)) {
            stations = stationListCache.get(LIST_CACHE_ID);
            return res.status(200).send(stations);
        } else {
            return getStationList(req, res, next);
        }
    }),

    onboardStation: async (req, res, next) => {

        try {
            // console.log("req:", req);
            console.log(req.body);
            const { token } = req.body;

            // VERIFY AND DECODE JWT TOKEN
            const decodedJWT = await jwt.verify(token, getStationRegistryJwtSecret());
            console.log("VERIFY AND DECODE JWT");
            console.log(decodedJWT);

            const stationEmailAddress = decodedJWT['e-mail-address'];
            // EXTRACT UUID
            const stationUsername = uuidRegex.exec(decodedJWT['station-id'])[0]; // OR station-name
            // STATION NAME
            const stationName = decodedJWT['station-name'];
            // CREATE A RANDOM HASH AS USER's PASSWORD
            const stationPassword = cryptoUtil.stationOnboarding.generateRandomPassword();
            // ONE-TIME PASSWORD PROVIDED BY STATION REGISTRY - USES FOR ENV VARS ENCRYPTION
            const stationOtp = decodedJWT['password'];
            // ****** TEMP - WebHookSecret ******
            const stationWebhookSecret = 'secret';
            // ****** TEMP - WebHookSecret ******

            // Make sure mail client is ready before starting onboarding
            const transporter = mailClientUtil.getTransporter();
            if(!transporter) {
                throw new Error('Mail client not ready');
            }
            
            //KEYCLOAK
            //KEYCLOAK - CREATE A USER
            const kcAdminClient = await new KcAdminClient({
                baseUrl: kcConfig.getAuthServerBaseUrl(),
                realmName: 'master',
            });

            await kcAdminClient.auth(kcConfig.getAdminCredentials());
            const user = await kcAdminClient.users.create({
                realm: 'pht',
                username: stationUsername,
                email: stationEmailAddress,
                enabled: true
            });
            console.log(user);
            //currentUser = await kcAdminClient.users.findOne({id: user.id});

            // change realm to pht (from master)
            kcAdminClient.setConfig({
                realmName: 'pht',
            });

            //KEYCLOAK - SET A PASSWORD
            await kcAdminClient.users.resetPassword({
                id: user.id,
                credential: {
                    temporary: false,
                    type: 'password',
                    value: stationPassword,
                },
            });

            let OnboardOnHarborResult = await OnboardOnHarbor(stationUsername, stationPassword);
            const stationHarborCliSecret = JSON.parse(OnboardOnHarborResult).oidc_user_meta.secret;

            // set required actions - UPDATE_PASSWORD, VERIFY_EMAIL
            await kcAdminClient.users.update(
                { id: user.id },
                {
                    requiredActions: [RequiredActionAlias.UPDATE_PASSWORD, RequiredActionAlias.VERIFY_EMAIL],
                },
            );

            // onboard station into metadata store
            const station_iri = transformToIri(stationUsername)
            const metadata_update_token = await enroll_station_with_env_config(station_iri).catch(err => {
                console.warn("Error during enrollment to store:")
                console.warn(err)
                return undefined
            })

            let env = [
                `STATION_ID=${stationUsername}`,
                `STATION_NAME=${stationName}`,
                `HARBOR_USER=${stationUsername}`,
                `HARBOR_PASSWORD=${stationPassword}`,
                `HARBOR_CLI=${stationHarborCliSecret}`,
                `HARBOR_EMAIL=${stationEmailAddress}`,
                `HARBOR_WEBHOOK_SECRET=${stationWebhookSecret}`,
            ];

            if (metadata_update_token != undefined) {
                env.push(`STATION_IRI=${station_iri}`)
                env.push(`METADATA_TOKEN=${metadata_update_token}`)
            }

            env = env.join("\n");

            // encrypt env variables
            const envBufferEncrypted = cryptoUtil.stationOnboarding.encrypt(env, stationOtp);

            // send email
            const envFileAttachment = [
                {   // binary buffer as an attachment
                    filename: 'env',
                    content: Buffer.from(envBufferEncrypted)
                },
            ] 
            const mailOptions = mailClientUtil.stationOnboarding.getMailOptions(stationEmailAddress, envFileAttachment);

            await new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        reject(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve(info);
                    }
                });
            });

            //SEND onboarding msg to a slack channel if enabled
            if (process.env.SLACK_INTEGRATION_ENABLED === 'true') {
                try {
                    
                    const message = ['#onboarding',
                        '```',
                        `STATION_ID=${stationUsername}`,
                        `STATION_NAME=${stationName}`,
                        `EMAIL=${stationEmailAddress}`,
                        '```'].join('\n')
                    const client = await slackBotUtil.getClientInstance();
                    const channelId = slackBotUtil.getPadmeChannelId();
                    await client.files.upload({
                        // channels can be a list of one to many strings
                        channels: channelId,
                        initial_comment: message,
                        file: Buffer.from(envBufferEncrypted),
                        filename: "env",
                        title: "env"
                    }).catch(err => {
                        console.log(`Unable to send slack message: ${err}`);
                    });
                    
                    console.log('Slack message sent');
                    
                    // Call station registry to update cache to include newly on boarded station 
                    getStationList();
                    
                } catch (error) {
                    console.log(error);
                }
            }

            return res.status(200).send();

        } catch (error) {

            console.log("*************************************************************");
            console.log(error || "error")
            console.log("*************************************************************");

            var errorModel = null;
            var status = null;
            var statusText = null;
            var errorMessage = null;

            try {

                if (error instanceof jwt.TokenExpiredError) {
                    status = 401;
                    statusText = 'Unauthorized';
                    errorMessage = error.message;

                } else if (error instanceof jwt.JsonWebTokenError) {
                    if (error.message === 'invalid signature') {
                        status = 401;
                        statusText = 'Unauthorized';
                    }
                    else {
                        status = 400;
                        statusText = 'Bad Request';
                    }
                    errorMessage = error.message;
                }
                else {
                    // statements to handle any unspecified exceptions
                    status = error.response.status;
                    statusText = error.response.statusText;
                    errorMessage = error.response.data.errorMessage
                }

                errorModel = {
                    status: status,
                    statusText: statusText,
                    data: {
                        errorMessage: errorMessage
                    }
                }

            } catch (innerErr) {

                console.log("*************************************************************");
                console.log(innerErr || "innerErr")
                console.log("*************************************************************");

                errorModel = {
                    status: status || 500,
                    statusText: statusText || "Internal server error",
                    data: {
                        errorMessage: errorMessage || "Internal server error"
                    }
                }
            }

            return next(errorModel);
        }

    },

    storeStationPublicKey: async (req, res, next) => {
        try {

            console.log({
                stationU: req.kauth.grant.access_token.content.preferred_username,
                station_public_key: req.body
            });

            const stationUsername = req.kauth.grant.access_token.content.preferred_username;
            // const reqBodyJSON = JSON.parse(req.body);
            const stationPublicKey = req.body['publicKey'];

            // store station public key in Vault
            await vaultUtil.writeStationPublicKey(stationUsername, stationPublicKey);

            // update station onboarding status
            await updateStationOnboardingStatus(stationUsername, STATION_ONBOARDING_STATUS.ONLINE);

            res.sendStatus(200);

        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    },

    getStationPublicKey: async (req, res, next) => {
        try {

            const stationId = req.query.id; 
            let result = {}

            if (stationId) {


                // if a valid stationId is provided
                if (uuidRegex.test(stationId)) {

                    const readStationPublicKey = await vaultUtil.readStationPublicKey(stationId);
                    const publicKey = readStationPublicKey.data.data[vaultUtil.CONSTANTS.KV_ENGINE.RSA.KEY_NAME.PUBLIC_KEY];
                    result = { [stationId]: publicKey }
                }

                else {
                    throw new Error(`stationId: ${stationId} is not valid`);
                }

            }
            // return all
            else {

                const stationPublicKeyList = await vaultUtil.listStationPublicKey();
                console.log(stationPublicKeyList)
                const stationList = stationPublicKeyList.data.keys;

                const readStationPublicKeyResults = await Promise.all(stationList.map(async (stationId) => {
                    return await vaultUtil.readStationPublicKey(stationId);
                }));

                console.log(JSON.stringify(readStationPublicKeyResults));
                publickeyList = readStationPublicKeyResults.map(item => item.data.data[vaultUtil.CONSTANTS.KV_ENGINE.RSA.KEY_NAME.PUBLIC_KEY]);
                result = _.zipObject(stationList, publickeyList);
            }

            res.send(result);

        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    },

    getStationName: (stationId) => {
        let stationName;
        if (stationListCache.has(LIST_CACHE_ID)) {
            stationName = stationListCache.get(LIST_CACHE_ID).find(station => station.id === stationId)?.name;
        }
        return stationName;
    },

    getImageSignaturePublicKey: async (_req, res) => {
        try {
            const result = await vaultUtil.readImageSignaturePublicKey();
            const publicKey = result.data.data;
            res.send(publicKey);
        } catch (error) {
            console.log(`Error trying to fetch image signature public key`, error);
            res.sendStatus(500);
        }
    }

}
