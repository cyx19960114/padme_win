const axios = require('axios');

const OK = 200
const CONFLICT = 204
const INTERNAL = 500

class MetadataStoreStationExist extends Error {
    constructor(station_iri) {
        super("Station with iri " + station_iri + " does already exist in store")
    }
}

async function enroll_station(station_iri, into_store_url, with_enrollment_key) {
    console.log("store enrolment iri:" + into_store_url)
    const body = {
        iri: station_iri,
        registry_key: with_enrollment_key
    }
    return axios.post(into_store_url, body).then((res) => {
        console.log("enrollment output:" + JSON.stringify(res.data))
        return res.data.secret
    }).catch(err => {
        console.warn("Metadata enrollment error:" + String(err))
        throw Error("Internal metadata enrollment error")
    })
    
}

module.exports = {
    enroll_station,
    MetadataStoreStationExist
}
