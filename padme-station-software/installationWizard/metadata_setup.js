const axios = require("axios")

const PROVIDER_URL = process.env.METADATA_PROVIDER || undefined
const CONFIG_URL = PROVIDER_URL + "/configuration/general"
const SECRET_KEY_URL = PROVIDER_URL + "/configuration/secret"
const FILTER_URL = PROVIDER_URL + "/configuration/filter"
const METADATA_STORE = process.env.METADATA_STORE || undefined

const construct_key_url_with_token = (token) => {
    return METADATA_STORE + "/stations/secretkey?token=" + token 
}

const setRemoteKey = async (token, secret_key) => {
    // send the key to the remote store with the single use token
    if (METADATA_STORE == undefined) {
        console.warn("No metadata store defined, skipping...")
    }
    return axios.post(
        construct_key_url_with_token(token), 
        secret_key
    ).then(res => {
        console.log("Key send to metadata store")
        if (res.status == 200) {
            return true
        } else {
            return false
        }
    }).catch(err => {
        console.warn("Error during metadata store setup:" + String(err))
        return false
    })
}

const setupMetadata = async (station_iri, secret_key) => {
    // set up the metadata provider by sending the configurations
    if (PROVIDER_URL == undefined) {
        console.warn("No metadata provider defined, skipping...")
        return false
    }
    return axios.post(CONFIG_URL, {
        stationIdentifier: station_iri,
    })
    .then(res => {
        console.log("Identifier send to metadata provider")
        if (res.status == 200) {
            return axios.post(SECRET_KEY_URL, secret_key)
        } else {
            return false
        }
    })
    .then(res => {
        console.log("Key send to metadata provider")
        if (res.status == 200) {
            return true
        } else {
            return false
        }
    })
    .catch(err => {
        console.warn("Error during metadata provider setup:" + String(err))
        return false
    })
    

}

const setFilter = async (filter_list, use_as_allow_list) => {
    if (PROVIDER_URL == undefined) {
        console.warn("No metadata provider defined, skipping...")
        return
    }
    return axios.post(FILTER_URL, {
        list: filter_list,
        useAllowList: use_as_allow_list
    })
}

module.exports = {
    setupMetadata,
    setFilter,
    setRemoteKey,
    PROVIDER_URL
}