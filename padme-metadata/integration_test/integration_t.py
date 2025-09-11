from functools import reduce
import os
import asyncio
import tornado.httpclient
from json import dumps, loads

PROVIDER_TO_TEST = os.environ["PROVIDER_URL"]
PROVIDER_TO_TEST_PORT = os.environ["PROVIDER_PORT"]

STORE_TO_TEST = os.environ["STORE_URL"]
STORE_TO_TEST_PORT = os.environ["STORE_PORT"]

PROVIDER_BASE_URL = "http://" + PROVIDER_TO_TEST + ":" + PROVIDER_TO_TEST_PORT

STORE_BASE_URL = "http://" + STORE_TO_TEST + ":" + STORE_TO_TEST_PORT

SET_STATION_ROUTE = "/configuration/general"

TEST_STATION_IDENTIFIER = "http://station.example.org/test"
# some places need manual changes if this is changed
TEST_TRAIN_IDENTIFIER = "http://registry.example.org/train1"

REGISTRY_TEST_KEY="12345"

TEST_STATION_SECRET_KEY = b"averysecretkey"

global_store = {}

async def flush_buffer(client: tornado.httpclient.AsyncHTTPClient, wait=True):   
    await client.fetch(PROVIDER_BASE_URL + "/flushbuffer", method="POST", body="muh", raise_error=True)
    if wait:
        await asyncio.sleep(5)
    return


async def test_set_station_identifier(client: tornado.httpclient.AsyncHTTPClient):
        body = dumps({
            "stationIdentifier": TEST_STATION_IDENTIFIER
        })
        resp = await client.fetch(PROVIDER_BASE_URL + SET_STATION_ROUTE, method="POST", body=body, headers={"Content-Type": "application/ld+json"})
        assert resp.code == 200, "Expected 200 response code"
        return

async def test_get_station_identifier(client: tornado.httpclient.AsyncHTTPClient):
    resp = await client.fetch(PROVIDER_BASE_URL + SET_STATION_ROUTE, method="GET")
    resp_decoded = loads(resp.body)
    assert "stationIdentifier" in resp_decoded.keys(), "Expected station identifier in response"
    assert resp_decoded["stationIdentifier"] == TEST_STATION_IDENTIFIER, "Station identifier unexpected value"

async def test_station_enrollment(client: tornado.httpclient.AsyncHTTPClient):
    """
    Test enrolling a station in the metadata store service.
    Store the obtained one time secret token in the global store to use it in other test methods.
    """
    body = dumps({
        "registry_key": REGISTRY_TEST_KEY,
        "iri": TEST_STATION_IDENTIFIER
    })
    resp = await client.fetch(STORE_BASE_URL + "/stations/enroll", body=body, headers={"Content-Type": "application/json"}, method="POST")
    resp_o = loads(resp.body)
    global_store["test_one_time_secret"] = resp_o["secret"]
    assert resp.code == 200, "Expected 200 response code"
    return

async def test_secret_key_setting_store(client: tornado.httpclient.AsyncHTTPClient):
    """
    Use the previously obtained one time secret to set the test secret key on the store side.
    """
    if "test_one_time_secret" not in global_store:
        raise Exception()
    # body is the secret key to set
    body = TEST_STATION_SECRET_KEY
    # the token is given as URL parameter
    token = global_store["test_one_time_secret"] 
    resp = await client.fetch(
            STORE_BASE_URL + f"/stations/secretkey?token={token}", raise_error=True, method="POST", body=body)
    assert resp.code == 200, "Expected 200 response code"

async def test_secret_key_setting_provider(client: tornado.httpclient.AsyncHTTPClient):
    """
    Set the secret key on the client side.
    """
    if "test_one_time_secret" not in global_store:
        raise Exception()
    body = TEST_STATION_SECRET_KEY
    resp = await client.fetch(
        PROVIDER_BASE_URL + "/configuration/secret", raise_error=True, method="POST", body=body
    )
    assert resp.code == 200, "Epected 200 response code"

async def test_start_downloading_train(client: tornado.httpclient.AsyncHTTPClient):
    """
    Instantiate a train via the provider and check if the information is correctly send to the train store.
    """
    body = dumps({
        "pid": TEST_TRAIN_IDENTIFIER
    })
    await client.fetch(
        PROVIDER_BASE_URL + "/remote/execution/state/startedDownloading", raise_error=True, method="POST", body=body
    )
    await flush_buffer(client)
    sparql_q = str("""
        PREFIX pht: <https://github.com/LaurenzNeumann/PHTMetadata#>
        ASK {
            ?a a pht:StartedTransmissionEvent .
            <http://registry.example.org/train1> pht:event ?a .
        }
        """)
    resp = await client.fetch(
        STORE_BASE_URL + "/query",
        raise_error=True,
        body=sparql_q,
        method="POST",
    )
    assert resp.body.decode()=="True", "SPARQL containment check gives false"

async def test_finished_downloading_train(client: tornado.httpclient.AsyncHTTPClient):
    """
    Instantiate a train via the provider and check if the information is correctly send to the train store.
    """
    body = dumps({
        "pid": TEST_TRAIN_IDENTIFIER
    })
    await client.fetch(
        PROVIDER_BASE_URL + "/remote/execution/state/finishedDownloading", raise_error=True, method="POST", body=body
    )
    await flush_buffer(client)
    sparql_q = str("""
        PREFIX pht: <https://github.com/LaurenzNeumann/PHTMetadata#>
        ASK {
            ?a a pht:FinishedTransmissionEvent .
            <http://registry.example.org/train1> pht:event ?a .
        }
        """)
    resp = await client.fetch(
        STORE_BASE_URL + "/query",
        raise_error=True,
        body=sparql_q,
        method="POST",
    )
    assert resp.body.decode()=="True", "SPARQL containment check gives false"

async def test_started_running_train(client: tornado.httpclient.AsyncHTTPClient):
    """
    Instantiate a train via the provider and check if the information is correctly send to the train store.
    """
    body = dumps({
        "pid": TEST_TRAIN_IDENTIFIER
    })
    await client.fetch(
        PROVIDER_BASE_URL + "/remote/execution/state/startedRunning", raise_error=True, method="POST", body=body
    )
    await flush_buffer(client)
    sparql_q = str("""
        PREFIX pht: <https://github.com/LaurenzNeumann/PHTMetadata#>
        ASK {
            ?a a pht:StartedRunningAtStationEvent .
            <http://registry.example.org/train1> pht:event ?a .
        }
        """)
    resp = await client.fetch(
        STORE_BASE_URL + "/query",
        raise_error=True,
        body=sparql_q,
        method="POST",
    )
    assert resp.body.decode()=="True", "SPARQL containment check gives false"

async def test_metrics_event(client: tornado.httpclient.AsyncHTTPClient):
    """
    Instantiate a train via the provider and check if the information is correctly send to the train store.
    """
    body = dumps({
        "pid": TEST_TRAIN_IDENTIFIER,
        "metrics": [
            {
                "type": "cpu",
                "value": 34,
                "timestamp": "2007-08-31T16:47+00:00"
            },
            {
                "type": "memory",
                "value": 4200,
                "timestamp": "2007-08-31T16:47+00:00"
            }
        ]
    })
    await client.fetch(
        PROVIDER_BASE_URL + "/remote/execution/metric", raise_error=True, method="POST", body=body
    )
    await flush_buffer(client)
    sparql_q = str("""
        PREFIX pht: <https://github.com/LaurenzNeumann/PHTMetadata#>
        ASK {
            ?a a pht:MemoryUsageReportEvent .
            <http://registry.example.org/train1> pht:event ?a .
        }
        """)
    resp = await client.fetch(
        STORE_BASE_URL + "/query",
        raise_error=True,
        body=sparql_q,
        method="POST",
    )
    assert resp.body.decode()=="True", "SPARQL containment check gives false"

async def test_finished_running_train(client: tornado.httpclient.AsyncHTTPClient):
    """
    Instantiate a train via the provider and check if the information is correctly send to the train store.
    """
    body = dumps({
        "pid": TEST_TRAIN_IDENTIFIER,
        "successful": True
    })
    await client.fetch(
        PROVIDER_BASE_URL + "/remote/execution/state/finished", raise_error=True, method="POST", body=body
    )
    await flush_buffer(client)
    sparql_q = str("""
        PREFIX pht: <https://github.com/LaurenzNeumann/PHTMetadata#>
        ASK {
            ?a a pht:FinishedRunningAtStationEvent .
            <http://registry.example.org/train1> pht:event ?a .
        }
        """)
    resp = await client.fetch(
        STORE_BASE_URL + "/query",
        raise_error=True,
        body=sparql_q,
        method="POST",
    )
    assert resp.body.decode()=="True", "SPARQL containment check gives false"


async def main():
    
    

    test_methods = [test_set_station_identifier, test_get_station_identifier, test_station_enrollment, test_secret_key_setting_store, test_secret_key_setting_provider, test_start_downloading_train, test_finished_downloading_train, test_started_running_train, test_metrics_event, test_finished_running_train]


    client = tornado.httpclient.AsyncHTTPClient()
    completed = [False] * len(test_methods)
    for i, t in enumerate(test_methods):
        try:
            await t(client)
        except AssertionError as e:
            print(f"Assertion error in test {t.__name__}:" + str(e))
        except Exception as e:
            print(f"Exception during test {t.__name__}:")
            print(str(e))
        else:
            completed[i] = True
    print(f"{len(list(filter(lambda x: x, completed)))}/{len(completed)} test passed.")
    if reduce((lambda x,y : x and y), completed):
        exit(0)
    else:
        exit(1)

asyncio.run(main())