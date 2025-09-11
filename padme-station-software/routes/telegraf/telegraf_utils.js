class UnexpectedMetricStructureError extends Error {
    constructor(message) {
        super(message)
    }
}


/*
* Converting a received telegraf memory metrics object into a flattened and reduce javascript object
* @param {object} metric_object The metric object
*/
function parse_memory_metric(metric_object) {
    try {
        return {
            "type": "memory",
            "percent": metric_object.fields.usage_percent,
            "total": metric_object.fields.usage,
            "timestamp": metric_object.timestamp,
            "datetime": new Date(metric_object.timestamp*1000),
        }
    } catch (e) {
        if (e instanceof TypeError) {
            throw UnexpectedMetricStructureError("Unexpected memory metric format")
        } else {
            throw e
        }
    }
    
}
    

/*
* Converting a received telegraf cpu metrics object into a flattened and reduce javascript object
* @param {object} metric_object The metric object
*/
function parse_cpu_metric(metric_object) {
    try {
        if (!("usage_percent" in metric_object.fields)) {
            throw new UnexpectedMetricStructureError("Unexpected cpu metric format")
        }
        return {
            "type": "cpu",
            "percent": metric_object.fields.usage_percent,
            "total": metric_object.fields.usage_total,
            "timestamp": metric_object.timestamp,
            "datetime": new Date(metric_object.timestamp*1000),
        }
    } catch (e) {
        if (e instanceof TypeError) {
            throw new UnexpectedMetricStructureError("Unexpected cpu metric format")
        } else {
            throw e
        }
    }
}
/*
* Converting a received telegraf log metrics object into a flattened and reduce javascript object
* @param {object} metric_object The metric object
*/
function parse_log_metric(metric_object) {
    try {
        return {
            "type": "log",
            "message": metric_object.fields.message,
            "timestamp": metric_object.timestamp,
            "datetime": new Date(metric_object.timestamp*1000),
        }
    } catch (e) {
        if (e instanceof TypeError) {
            throw new UnexpectedMetricStructureError("Unexpected memory metric format")
        } else {
            throw e
        }
    }
}

/*
 * Converting a general telegraf metrics object into a flattened and reduced javascript object
 * @param {object} metric_object The metric object
 */
function parse_metric(metric_object) {
    try {
        const res = (() => {switch(metric_object["name"]) {
            case "docker_container_mem":
                return parse_memory_metric(metric_object)
            case "docker_container_cpu":
                return parse_cpu_metric(metric_object)
            case "docker_log":
                return parse_log_metric(metric_object)
            default:
                throw new UnexpectedMetricStructureError("Name attribute missing")
        }})()
        res["container_image"] = metric_object["tags"]["container_image"]
        res["container_name"] = metric_object["tags"]["container_name"]
        return res
    } catch (e) {
        if (e instanceof UnexpectedMetricStructureError) {
            return undefined
        }
        if (e instanceof TypeError) {
            console.error(e)
            throw new UnexpectedMetricStructureError("Unexpected memory metric format")
        } else {
            throw e
        }
    }
}

/*
 * Check if a given metric object is in batch format
 * @param {object} the metric object
 */
function is_batch(metric_object) {
    return ("metrics" in metric_object)
}


function metric_handler(request_body) {
    const  metrics_obj = []
    if (is_batch(request_body)) {
        for (const metric of request_body["metrics"]) {
            const pmet = parse_metric(metric)
            if (pmet != undefined) {
                metrics_obj.push(pmet)
            }
            
        }
    } else {
        const pmet = parse_metric(request_body)
            if (pmet != undefined) {
                metrics_obj.push(pmet)
            }
    }
    return metrics_obj
}

function metric_handler_buffer(request_body, buffer=[]) {
    buffer.push(...metric_handler(request_body))
}

module.exports = {
    metric_handler,
    metric_handler_buffer,
    parse_cpu_metric,
    parse_memory_metric,
    parse_log_metric,
    parse_metric,
    is_batch,
    UnexpectedMetricStructureError
}