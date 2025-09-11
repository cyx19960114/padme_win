const EventEmitter = require('events')
const { envFileToDictionary } = require('./utils/envFileParser') 


// attributes needed in the env file:
// "MONGO_HOST", "MONGO_PORT", "MONGO_PORT", "MONGO_PASSWORD", "MONGO_DB", "CENTRALSERVICE_ADDRESS", "STATION_NAME"
const env_needed_attributes = ["STATION_ID", "HARBOR_USER", "HARBOR_PASSWORD", "HARBOR_EMAIL"]
// the configuration manager is accessed by the route handler and holds all the configuration data
// Additionally it has a method for indicating that the configuration is done and the program can be killed
// this method is awaitable
const eventEmitter = new EventEmitter() 

const configurationManager = {
    envconfiguration: "",
    ee: eventEmitter,
    configurationEnd: async function () {
        return new Promise((res,rej) => {
            eventEmitter.on('configurationFinished', () => {
                res(true)
            })
        })
    },
    updateHarborPassword: function (password) {
        this.envconfiguration = this.envconfiguration.replace(/HARBOR_PASSWORD=.*/, "HARBOR_PASSWORD=" + password)
    },
    getHarborUsernameAndPassword: function () {
        const envDict = envFileToDictionary(this.envconfiguration)
        return {
            'username': envDict['HARBOR_USER'],
            'password': envDict['HARBOR_PASSWORD']
        }
    },
    configurationDidEnd: async function () {
        this.ee.emit('configurationFinished')
    },
    envconfigurationSanityCheck: async function () {
        try {
            const dict = envFileToDictionary(this.envconfiguration)
            for (const key of env_needed_attributes) {
                if (typeof dict[key] !== "string") {
                    return Promise.reject("Key " + String(key) + " not valid in envfile")
                }
            }
            return Promise.resolve()
        } catch (e) {
            console.log(e)
            return Promise.reject(e)
        }
    },
    get_station_iri: function() {
        const envDict = envFileToDictionary(this.envconfiguration)
        if ("STATION_IRI" in envDict) {
            return envDict["STATION_IRI"]
        } else {
            return ""
        }
    },
    get_metadata_token: function() {
        // returns the single use token for metadata setup
        const envDict = envFileToDictionary(this.envconfiguration)
        if ("METADATA_TOKEN" in envDict) {
            return envDict["METADATA_TOKEN"]
        } else {
            return ""
        }
    },
    password_reseted: false,
    publicKey: "",
    privateKey: "",
}
module.exports = configurationManager