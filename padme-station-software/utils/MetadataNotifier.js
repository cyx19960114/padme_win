const axios = require('axios')
const host = process.env.METADATA_PROVIDER || undefined

const IMAGE_STARTED_RUNNING_ROUTE = "/remote/execution/state/startedRunning"
const IMAGE_STARTED_DOWNLOADING_ROUTE = "/remote/execution/state/startedDownloading"
const IMAGE_FINISHED_DOWNLOADING_ROUTE = "/remote/execution/state/finishedDownloading"
const IMAGE_FINISHED_RUNNING_ROUTE = "/remote/execution/state/finished"
const IMAGE_REJECTED_ROUTE = "/remote/execution/state/rejected"

const make_iri_with_jobid = (jobid) => {return "http://metadata.padme-analytics.de/entities/trains/" + jobid}

function construct_train_iri_body(train_iri, timestamp = undefined) {
    return {
        pid: train_iri,
        timestamp: timestamp.toISOString()
    }
}

async function notifyWithBasicData(on_route, train_iri, timestamp = undefined) {
    // a generic function to reduce redundant code
    // usable for all route which just expect the train iri in the pid field
    // and a timestamp
    console.log("USING HOST FOR METADATA NOTIFICATIONS:" + host)
    console.log("Sending Notification on:" + on_route + " for train iri:" + train_iri)
    const data = construct_train_iri_body(train_iri, timestamp)
    return axios.post(host + on_route, JSON.stringify(data)).then(res => { console.log('Done with res: '+String(res.statusCode))}).catch(err => console.log(err.message))
}

async function notifyMetadataProviderImageStartedDownloading(train_iri, timestamp) {
    return notifyWithBasicData(IMAGE_STARTED_DOWNLOADING_ROUTE, train_iri, timestamp)
}
async function notifyMetadataProviderImageFinishedDownloading(train_iri, timestamp) {
    return notifyWithBasicData(IMAGE_FINISHED_DOWNLOADING_ROUTE, train_iri, timestamp)
}
async function notifyMetadataProviderImageStartedRunning(train_iri, timestamp) {
    return notifyWithBasicData(IMAGE_STARTED_RUNNING_ROUTE, train_iri, timestamp)
}
async function notifyMetadataProviderImageFinished(train_iri, successful, timestamp) {
    console.log("Sending finish Notification for:" + train_iri)
    const data = {
        pid: train_iri,
        timestamp: timestamp.toISOString(),
        successful: successful
    }
    return axios.post(host + IMAGE_FINISHED_RUNNING_ROUTE, JSON.stringify(data)).then(res => { console.log('Done with res:'+String(res.statusCode))}).catch(err => console.log(err.message))
}
async function notifyMetadataProviderImageRejected(train_iri, message, timestamp) {
    console.log("Sending reject Notification for:" + train_iri)
    if (!(timestamp instanceof Date)) {
        throw TypeError("timestamp is not date compatible type")
    }
    if (!(train_iri instanceof String || typeof train_iri === 'string' )) {
        throw TypeError("jobId is no string compatible type")
    }

    const data = {
        pid: train_iri,
        timestamp: timestamp.toISOString(),
        message: message
    }
    return axios.post(IMAGE_REJECTED_ROUTE, JSON.stringify(data)).then(res => { console.log('Done with res:'+String(res.statusCode))}).catch(err => console.log(err.message))
}

module.exports= {
    notifyMetadataProviderImageFinished,
    notifyMetadataProviderImageFinishedDownloading,
    notifyMetadataProviderImageRejected,
    notifyMetadataProviderImageStartedDownloading,
    notifyMetadataProviderImageStartedRunning,
    make_iri_with_jobid
}