const express = require("express");
const router = express.Router();
const axios = require("axios")

const Train = require("../../models/Train")
const utils = require("./telegraf_utils")

const host = process.env.METADATA_PROVIDER || "http://metadataprovider:9988";
const metric_route = host + "/remote/execution/metric"
const buffer = []

router.post("/", async function (req, res) {
    const body = req.body
    try {
        utils.metric_handler_buffer(body, buffer)
    } catch (e) {
        if (e instanceof utils.UnexpectedMetricStructureError) {
            res.sendStatus(400)
            return
        }
        console.log("Error while handling metrics")
        console.log(e)
    }
    // transfrom object to be suitable for metadata provder api
    for (const obj of buffer) {
        const metric_obj = {}
        let skip = false
        switch (obj["type"]) {
            case "memory":
                metric_obj["value"] = obj["total"]
                break;
            case "cpu":
                metric_obj["value"] = obj["total"]
                // weird cpu structure
                skip = true
                break;
            case "log":
                metric_obj["value"] = obj["message"]
                break;
            default:
                console.warn("Received unknown metric object")
                // skip in case of unknown metric object
                skip = true
        }
        if (!skip) {
            metric_obj["type"] = obj["type"]
            metric_obj["timestamp"] = obj["timestamp"]
            // resolve the PID of the metric message
            
            const train = await Train.findOne({jobid: obj["container_name"]})
            try { 
                const pid = train.train_iri
                console.log("received metric for container: " + String(pid))
                metric_obj["pid"] = pid
                console.debug("Metric object created and will sent to metadata provider:" + JSON.stringify(metric_obj))
                axios.post(metric_route, metric_obj).catch(e => {
                    console.error("error while sending metrics to provider")
                })
            } catch (e) {
                console.error("error while sending metrics to provider")
                continue
            } 
        } else {
            console.warn("skipped metric object.")
        }
    }
    res.sendStatus(200)
})

router.get("/debug", async function(req, res) {
    for (const train of await Train.find()) {
        console.log(train.jobid)
    }
    const t = await Train.findOne()
    res.send(t.jobid)
})

module.exports = router