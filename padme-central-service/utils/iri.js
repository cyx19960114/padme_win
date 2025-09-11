/*
* TEMPORARY FUNCTION
* This function transforms the UUID into an IRI usable for the metadata provider
* In future, this should not be necessary since the registry should give an iri.
* TODO: Change this and make it configurable (metadata target)
*/

const IRI_PREFIX = process.env.METADATA_STATION_IRI_PREFIX || "https://metadata.padme-analytics.de/entities/stations/"
function transformToIri(stationID) {
    console.warn("Converting station id into IRI with hard coded prefix.")
    return IRI_PREFIX+stationID+"#e"
}

module.exports = transformToIri
