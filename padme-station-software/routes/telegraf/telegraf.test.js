const valid_memory_request = () => {return {
    "fields": {
        "usage": 5840896,
        "usage_percent": 0.06996407104542317,
        "writeback": 0
    },
    "name": "docker_container_mem",
    "tags": {
        "container_image": "menzel.informatik.rwth-aachen.de:3007/stationaachenbeeck_jobs/6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "container_name": "6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "container_status": "running",
        "container_version": "aachenbeeck",
        "engine_host": "97899fcfd805",
        "host": "8d5f31da7a0a",
        "server_version": "19.03.12"
    },
    "timestamp": 1614420641
}}

const valid_memory_request_values = () => {return {
    "type": "memory",
    "percent": 0.06996407104542317,
    "total": 5840896,
    "timestamp": 1614420641,
    "datetime": new Date(1614420641*1000),
    "container_name": "6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
    "container_image": "menzel.informatik.rwth-aachen.de:3007/stationaachenbeeck_jobs/6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
}}

const valid_cpu_request = () => {return {
    "fields": {
        "container_id": "08c73f578d947222c01a3f82fec4573cf81c0665e516fbbb2ca7f2f9b51ee5a7",
        "throttling_periods": 0,
        "throttling_throttled_periods": 0,
        "throttling_throttled_time": 0,
        "usage_in_kernelmode": 20000000,
        "usage_in_usermode": 40000000,
        "usage_percent": 0.00572,
        "usage_system": 5059416060000000,
        "usage_total": 53781086
    },
    "name": "docker_container_cpu",
    "tags": {
        "container_image": "menzel.informatik.rwth-aachen.de:3007/stationaachenbeeck_jobs/6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "container_name": "6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "container_status": "running",
        "container_version": "aachenbeeck",
        "cpu": "cpu-total",
        "engine_host": "97899fcfd805",
        "host": "8d5f31da7a0a",
        "server_version": "19.03.12"
    },
    "timestamp": 1614420641
}}
const valid_cpu_request_values = () => {
    return {
        "type": "cpu",
        "percent": 0.00572,
        "total": 53781086,
        "container_name": "6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "container_image": "menzel.informatik.rwth-aachen.de:3007/stationaachenbeeck_jobs/6170ec50-78e0-11eb-aaa2-9dcdbda687c7",
        "timestamp": 1614420641,
        "datetime": new Date(1614420641*1000) 
    } 
}


test("Test parse_cpu_metric valid input", () => {
    const utils = require("./telegraf_utils")
    const c_res = valid_cpu_request_values()
    delete c_res["container_image"]
    delete c_res["container_name"]
    res = utils.parse_cpu_metric(valid_cpu_request())
    expect(res).toEqual(c_res)
})


test("Test parse_memory_metric valid input", () => {
    const utils = require("./telegraf_utils")
    const c_res = valid_memory_request_values()
    delete c_res["container_image"]
    delete c_res["container_name"]
    res = utils.parse_memory_metric(valid_memory_request())
    expect(res).toEqual(c_res)
})

test("Test parse_metric", () => {
    const utils = require("./telegraf_utils")
    expect(utils.parse_metric(valid_cpu_request())).toEqual(valid_cpu_request_values())
    expect(utils.parse_metric(valid_memory_request())).toEqual(valid_memory_request_values())
})

test("Test metric handler singe", () => {
    const utils = require("./telegraf_utils")
    expect(utils.metric_handler(valid_memory_request())).toEqual([valid_memory_request_values()])
})

test("Test metric handler multiple", () => {
    const utils = require("./telegraf_utils")
    expect(utils.metric_handler({"metrics": [valid_memory_request(), valid_cpu_request()]})).toEqual([valid_memory_request_values(), valid_cpu_request_values()])
})
