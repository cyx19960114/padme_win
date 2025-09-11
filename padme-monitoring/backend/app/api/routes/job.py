import asyncio
import json
import uuid
from datetime import datetime
from typing import Annotated

import redis.asyncio as redis
from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from rdflib import Literal, RDF, XSD
from rdflib.collection import Collection
from sse_starlette.sse import EventSourceResponse

from app import crud
from app.api.deps import GraphDep, RedisDep
from app.api.routes.auth import get_user_info
from app.api.routes.train import create_train_metadata
from app.api.routes.station import create_station_metadata
from app.core.database import PHT, TrainNS, StationNS, JobNS, MemoryNS, CpuNS, NetworkNS
from app.core.logger import logger
from app.core.config import settings
from app.models import (
    JobMetadataBase,
    JobMetricMetadataCreate,
    JobMetricMetadataDelete,
    TrainMetadataBase as TrainMetadataCreate,
    StationMetadataBase as StationMetadataCreate,
)
from app.utils import (
    convert_list_to_jsonld,
    JobState,
    JobStateURI,
    MetricType,
    MetricTypeURI,
    MetricNamespace,
    ResponseType,
)

router = APIRouter()

# Constants
METRICS_BUFFER_SIZE = 1000
HEARTBEAT_INTERVAL = 15  # in seconds
SHUTDOWN_SIGNAL = "SHUTDOWN_SIGNAL"
REDIS_JOB_CHANNEL = "job_updates"
REDIS_METRIC_CHANNEL = "metric_updates"
REDIS_JOB_CLIENTS_KEY = "job_sse_clients"
REDIS_METRIC_CLIENTS_KEY = "metric_sse_clients"


async def create_train_metadata_manually(graph: GraphDep, trainId: str):
    logger.warning(
        f"Metadata for train ({trainId}) does not exist. Creating metadata manually."
    )

    train_payload = TrainMetadataCreate(
        identifier=trainId,
        creator="Max Mustermann",
        publisher="Max Mustermann",
        title=trainId,
        description="Lorem Ipsum",
        analysisPurpose="Lorem Ipsum",
    )

    # Create temporary train metadata for consistency. This can be updated later
    await create_train_metadata(graph, train_payload)


async def create_station_metadata_manually(graph: GraphDep, stationId):
    logger.warning(
        f"Metadata for station ({stationId}) does not exist. Creating metadata manually."
    )

    station_payload = StationMetadataCreate(
        identifier=stationId,
        title=stationId,
        description="Lorem Ipsum",
        stationOwner="John Doe",
        responsibleForStation="John Doe",
        latitude="000.000",
        longitude="000.000",
        totalGPUPower="",
        totalCPUCores=0,
        totalRAM="",
        totalDiskSpace="",
        hasInternetConnectivity=True,
        networkBandwidth="",
    )

    # Create temporary station metadata for consistency. This can be updated later
    await create_station_metadata(graph, station_payload)


@router.get("/", dependencies=[Depends(get_user_info)])
async def get_jobs(
    graph: GraphDep,
    response_type: ResponseType = ResponseType.default,
    offset: int = 0,
    limit: int = 10,
):
    if response_type is not ResponseType.default:
        return crud.get_resources(
            graph=graph,
            response_type=response_type,
            subject=PHT.TrainExecution,
            namespace=JobNS,
            prefix="job",
            offset=offset,
            limit=limit,
            extra_context={"station": StationNS, "train": TrainNS},
        )

    jobs = []
    for subject in graph.subjects(RDF.type, PHT.TrainExecution):
        station_uri = graph.value(subject, PHT.currentStation)
        station_name = graph.value(station_uri, PHT.title)

        job_state_uri = graph.value(subject, PHT.state)
        job_state = JobStateURI._value2member_map_[job_state_uri].name

        jobs.append(
            {
                "identifier": str(graph.value(subject, PHT.identifier)),
                "state": job_state,
                "creator": str(graph.value(subject, PHT.creator)),
                "currentStation": {"uri": station_uri, "name": station_name},
                "trainId": str(graph.value(subject, PHT.trainId)),
                "description": str(graph.value(subject, PHT.description)),
                "createdAt": str(graph.value(subject, PHT.createdAt)),
                "updatedAt": str(graph.value(subject, PHT.updatedAt)),
            }
        )

    # Sort by updatedAt in DESC order
    jobs.sort(key=lambda job: job["updatedAt"], reverse=True)

    return jobs[offset : offset + limit]


# TODO: Add filters i.e. last 7, 30, 90 days
@router.get("/count", dependencies=[Depends(get_user_info)])
async def get_job_count_by_state(graph: GraphDep, state: JobState):
    total_subjects = len(set(graph.subjects(PHT.state, JobStateURI[state].value)))
    return {"count": total_subjects}


# TODO: Add filters i.e. last 7, 30, 90 days
@router.get("/summary", dependencies=[Depends(get_user_info)])
async def get_job_summary_by_state(graph: GraphDep):
    query = """
    SELECT ?state (COUNT(?job) AS ?job_count)
    WHERE {
        ?job a pht:TrainExecution .
        ?job pht:state ?state .
    }
    GROUP BY ?state
    ORDER BY DESC(?job_count)
    """

    result = graph.query(query, initNs={"pht": PHT})

    grouped_jobs = []
    for row in result:
        job_state = JobStateURI._value2member_map_[row.state].name
        grouped_jobs.append(
            {
                "state": job_state,
                "count": int(row.job_count),
            }
        )

    return grouped_jobs


async def remove_client_from_redis(
    redis_client: redis.Redis, client_key: str, client_id: str, in_job_sse: bool
):
    """Remove client_id from the Redis set and log the active connections."""
    try:
        if await redis_client.sismember(client_key, client_id):
            await redis_client.srem(client_key, client_id)
            client_count = await redis_client.scard(client_key)
            logger.info(
                f"{"Job" if in_job_sse else "Metrics"} SSE connection closed on disconnect. Active connections: {client_count}"
            )
    except Exception as cleanup_error:
        logger.error(f"Error during SSE connection cleanup: {str(cleanup_error)}")


@router.get("/sse")
async def job_sse(request: Request, redis_client: RedisDep):
    client_id = str(uuid.uuid4())

    # Add client to Redis set for cross-worker tracking
    await redis_client.sadd(REDIS_JOB_CLIENTS_KEY, client_id)
    client_count = await redis_client.scard(REDIS_JOB_CLIENTS_KEY)
    logger.info(
        f"Client {client_id} connected to job SSE. Active clients: {client_count}"
    )

    async def event_generator():
        # Create Redis PubSub connection
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(REDIS_JOB_CHANNEL)

        try:
            # Keep track of when the last event was sent
            last_event_time = asyncio.get_event_loop().time()

            while True:
                if await request.is_disconnected():
                    logger.info(
                        f"Client {client_id} disconnected from job sse endpoint"
                    )
                    break

                # Check for Redis messages with timeout for heartbeats
                try:
                    # Wait up to HEARTBEAT_INTERVAL seconds for a job update
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True),
                        timeout=HEARTBEAT_INTERVAL,
                    )

                    if message and message["type"] == "message":
                        data = message["data"]
                        if data == SHUTDOWN_SIGNAL:
                            logger.info(
                                f"Shutdown signal received for job sse client {client_id}"
                            )
                            break

                        # Send job update to client
                        yield {"event": "job_update", "data": data}
                        last_event_time = asyncio.get_event_loop().time()

                except asyncio.TimeoutError:
                    # No job update in HEARTBEAT_INTERVAL seconds, send hearbeat comment
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_event_time >= HEARTBEAT_INTERVAL:
                        logger.debug(
                            f"Sending heartbeat to client {client_id} for job updates"
                        )
                        # send hearbeat as a comment
                        yield {
                            "event": "ping",
                            "data": str(datetime.now().timestamp()),
                        }
                        last_event_time = current_time

        except asyncio.CancelledError:
            logger.info(f"Job SSE connection cancelled for client {client_id}")
        except Exception as e:
            logger.error(
                f"Error in Job SSE connection for client {client_id}: {str(e)}"
            )
        finally:
            # Unsubscribe and clean up
            if pubsub.subscribed:
                await pubsub.unsubscribe(REDIS_JOB_CHANNEL)

            # Remove job client from Redis set in a non-blocking way
            asyncio.create_task(
                remove_client_from_redis(
                    redis_client, REDIS_JOB_CLIENTS_KEY, client_id, in_job_sse=True
                )
            )

    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Important for Nginx Proxy
        },
    )


async def broadcast_job_updates(
    graph: GraphDep, job_id: uuid.UUID, redis_client: RedisDep
):
    # Check if any clients are connected across all workers
    client_count = await redis_client.scard(REDIS_JOB_CLIENTS_KEY)

    if client_count > 0:
        # Get the entire job object
        job_payload = await get_job_metadata(
            graph, job_id, response_type=ResponseType.default
        )

        # Broadcast to Redis channel for all workers to pick up
        await redis_client.publish(REDIS_JOB_CHANNEL, json.dumps(job_payload))
    else:
        logger.info("No active SSE connections for job updates, skipping broadcast")


async def broadcast_metric_updates(
    metric: MetricType,
    job_id: uuid.UUID,
    sort: bool,
    graph: GraphDep,
    redis_client: RedisDep,
):
    # Check if any clients are connected across all workers
    client_count = await redis_client.scard(REDIS_METRIC_CLIENTS_KEY)

    if client_count > 0:
        # Get updated job metrics
        metric_payload = await get_job_metrics(
            graph,
            metric=metric,
            job_id=job_id,
            sort_desc=sort,
        )

        # Broadcast to Redis channel for all workers to pick up
        await redis_client.publish(REDIS_METRIC_CHANNEL, json.dumps(metric_payload))

    else:
        logger.info("No active SSE connections for metric updates, skipping broadcast")


@router.get("/{job_id}", dependencies=[Depends(get_user_info)])
async def get_job_metadata(
    graph: GraphDep,
    job_id: uuid.UUID,
    response_type: ResponseType = ResponseType.default,
):
    subject = JobNS[str(job_id)]

    # Check if Job URI exists
    if (subject, None, None) not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    if response_type is not ResponseType.default:
        return crud.get_resource_metadata(
            graph=graph,
            response_type=response_type,
            subject_id=str(job_id),
            namespace=JobNS,
            prefix="job",
        )

    # Get current station
    station_uri = graph.value(subject, PHT.currentStation)
    station_name = graph.value(station_uri, PHT.title)

    # Get job state
    job_state_uri = graph.value(subject, PHT.state)
    job_state = JobStateURI._value2member_map_[job_state_uri].name

    return {
        "metadataUri": subject,
        "identifier": str(graph.value(subject, PHT.identifier)),
        "state": job_state,
        "creator": str(graph.value(subject, PHT.creator)),
        "currentStation": {"uri": station_uri, "name": station_name},
        "trainId": str(graph.value(subject, PHT.trainId)),
        "description": str(graph.value(subject, PHT.description)),
        "createdAt": str(graph.value(subject, PHT.createdAt)),
        "updatedAt": str(graph.value(subject, PHT.updatedAt)),
    }


@router.post(
    "/",
    dependencies=[Depends(get_user_info)],
    status_code=status.HTTP_201_CREATED,
)
async def create_job_metadata(
    graph: GraphDep,
    redis_client: RedisDep,
    metadata: JobMetadataBase,
):
    logger.info(f"Creating metadata for job {metadata.identifier}")

    job_id = str(metadata.identifier)
    triple = (JobNS[job_id], None, None)

    if triple in graph:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Metadata already exists for job ({job_id})",
        )

    """
    TODO: Check if current station is in planned route. Throw an error if not.
    """

    # Check if Train URI exists. Create metadata manually if not
    if (TrainNS[metadata.trainId], None, None) not in graph:
        await create_train_metadata_manually(graph, metadata.trainId)

    # Check if Station URI exists. Create metadata manually if not
    if (StationNS[metadata.currentStation], None, None) not in graph:
        await create_station_metadata_manually(graph, metadata.currentStation)

    # Adding a zero memory consumption event to initialize the event collection in job
    memory_event_id = str(uuid.uuid4())
    payload = {
        "@context": {"pht": str(PHT), "memory": str(MemoryNS)},
        "@graph": [
            {
                "@id": MemoryNS[memory_event_id],
                "@type": PHT.MemoryUsageReportEvent,
                "pht:eventTimestamp": metadata.createdAt,
                "pht:hasJobId": job_id,
                "pht:hasStationId": metadata.currentStation,
                "pht:value": "0",
            },
            {
                "@id": JobNS[job_id],
                "@type": PHT.TrainExecution,
                "pht:identifier": job_id,
                "pht:creator": metadata.creator,
                "pht:description": metadata.description,
                "pht:currentStation": {"@id": StationNS[metadata.currentStation]},
                "pht:trainId": {"@id": TrainNS[metadata.trainId]},
                "pht:state": {"@id": JobStateURI.waiting.value},
                "pht:plannedRoute": {
                    "@list": convert_list_to_jsonld(
                        items=metadata.plannedRoute, namespace=StationNS
                    )
                },
                "pht:event": {
                    "@list": convert_list_to_jsonld(
                        items=[memory_event_id], namespace=MemoryNS
                    )
                },
                "pht:createdAt": metadata.createdAt,
                "pht:updatedAt": metadata.updatedAt,
            },
        ],
    }

    graph.parse(data=payload, format="json-ld")

    await broadcast_job_updates(graph, metadata.identifier, redis_client)


@router.get("/{job_id}/status", dependencies=[Depends(get_user_info)])
async def get_job_status(graph: GraphDep, job_id: uuid.UUID):
    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    # Check if Job URI exists
    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    job_status = graph.value(subject, PHT.state)
    return {"status": JobStateURI._value2member_map_[job_status].name}


@router.put(
    "/{job_id}/status",
    dependencies=[Depends(get_user_info)],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_job_status(
    graph: GraphDep,
    job_id: uuid.UUID,
    state: JobState,
    redis_client: RedisDep,
):
    """
    TODO: If status is in [cancelled, finished, failed], empty the job metrics Collection
    and individually delete each metric URI
    """
    logger.info(f"Updating job {job_id} status to {state.value}")
    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    # Update job state and timestamp
    graph.set((subject, PHT.state, JobStateURI[state].value))
    graph.set((subject, PHT.updatedAt, Literal(datetime.now(), datatype=XSD.dateTime)))

    await broadcast_job_updates(graph, job_id, redis_client)


@router.put(
    "/{job_id}/station",
    dependencies=[Depends(get_user_info)],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_job_current_station(
    graph: GraphDep,
    job_id: uuid.UUID,
    station_id: Annotated[uuid.UUID, Body(embed=True)],
    redis_client: RedisDep,
):
    logger.info(f"Updating job {job_id} station to {station_id}")
    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    # TODO: Also check if the station exists in the planned route
    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    # Update current station and timestamp
    graph.set((subject, PHT.currentStation, StationNS[str(station_id)]))
    graph.set((subject, PHT.updatedAt, Literal(datetime.now(), datatype=XSD.dateTime)))

    await broadcast_job_updates(graph, job_id, redis_client)


@router.get("/{job_id}/metrics/sse")
async def job_metrics_sse(request: Request, redis_client: RedisDep):
    client_id = str(uuid.uuid4())

    # Add client to Redis set for cross-worker tracking
    await redis_client.sadd(REDIS_METRIC_CLIENTS_KEY, client_id)
    client_count = await redis_client.scard(REDIS_METRIC_CLIENTS_KEY)
    logger.info(
        f"Client {client_id} connected to metric SSE. Active clients: {client_count}"
    )

    async def event_generator():
        # Create Redis PubSub connection
        pubsub = redis_client.pubsub()
        await pubsub.subscribe(REDIS_METRIC_CHANNEL)

        try:
            # Keep track of when the last event was sent
            last_event_time = asyncio.get_event_loop().time()

            while True:
                if await request.is_disconnected():
                    logger.info(
                        f"Client {client_id} disconnected from metrics sse endpoint"
                    )
                    break

                try:
                    # Wait for new data from broadcast channel
                    message = await asyncio.wait_for(
                        pubsub.get_message(ignore_subscribe_messages=True),
                        timeout=HEARTBEAT_INTERVAL,
                    )

                    if message and message["type"] == "message":
                        data = message["data"]
                        if data == SHUTDOWN_SIGNAL:
                            logger.info(
                                f"Shutdown signal received for metrics sse client {client_id}"
                            )
                            break

                        # Send job update to client
                        yield {"event": "metric_update", "data": data}
                        last_event_time = asyncio.get_event_loop().time()

                except asyncio.TimeoutError:
                    # No metrics update in HEARTBEAT_INTERVAL seconds, send hearbeat comment
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_event_time >= HEARTBEAT_INTERVAL:
                        logger.debug(
                            f"Sending heartbeat to client {client_id} for metric updates"
                        )
                        # send hearbeat as a comment
                        yield {
                            "event": "ping",
                            "data": str(datetime.now().timestamp()),
                        }
                        last_event_time = current_time

        except asyncio.CancelledError:
            logger.info(f"Metrics SSE connection cancelled for client {client_id}")
        except Exception as e:
            logger.error(
                f"Error in Metrics SSE connection for client {client_id}: {str(e)}"
            )
        finally:
            # Unsubscribe and clean up
            if pubsub.subscribed:
                await pubsub.unsubscribe(REDIS_METRIC_CHANNEL)

            # Remove metrics client from Redis set in a non-blocking way
            asyncio.create_task(
                remove_client_from_redis(
                    redis_client, REDIS_METRIC_CLIENTS_KEY, client_id, in_job_sse=False
                )
            )

    return EventSourceResponse(
        event_generator(),
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Important for Nginx Proxy
        },
    )


@router.get("/{job_id}/metrics", dependencies=[Depends(get_user_info)])
async def get_job_metrics(
    graph: GraphDep,
    metric: MetricType,
    job_id: uuid.UUID,
    sort_desc: bool = True,
):
    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    collection = graph.value(subject, PHT.event)
    event_uris = Collection(graph, collection)
    ns_manager = graph.namespace_manager

    metrics = {"source": metric, "metrics": []}
    for uri in event_uris:
        # * Filter only the required event type: memory | cpu | network
        if (uri, RDF.type, MetricTypeURI[metric].value) not in graph:
            continue

        metric_payload = {
            "id": uri.n3(ns_manager),
            "jobId": graph.value(uri, PHT.hasJobId),
            "stationId": graph.value(uri, PHT.hasStationId),
            "timestamp": graph.value(uri, PHT.eventTimestamp),
            **(
                {
                    "rxBytes": int(graph.value(uri, PHT.hasRxBytes)),
                    "txBytes": int(graph.value(uri, PHT.hasTxBytes)),
                }
                if metric is MetricType.network
                else {"value": graph.value(uri, PHT.value)}
            ),
        }

        metrics["metrics"].append(metric_payload)

    metrics["metrics"].sort(key=lambda job: job["timestamp"], reverse=sort_desc)
    return metrics


@router.post(
    "/{job_id}/metrics",
    dependencies=[Depends(get_user_info)],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def create_job_metrics(
    graph: GraphDep,
    redis_client: RedisDep,
    job_id: uuid.UUID,
    metadata: JobMetricMetadataCreate,
):
    """
    TODO: Only create metrics if job status is [running].
    """
    logger.info(f"Creating {metadata.metric_type.value} metrics for job {job_id}")

    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    metric_id = str(uuid.uuid4())
    metric_namespace = MetricNamespace[metadata.metric_type].value
    metric_uri = metric_namespace[metric_id]

    is_network_metric = metadata.metric_type is MetricType.network

    # TODO: Combine metrics payload.
    # Ref Issue: https://git.rwth-aachen.de/padme-development/padme-monitoring/-/issues/5
    payload = {
        "@context": {
            "pht": str(PHT),
            "memory": str(MemoryNS),
            "cpu": str(CpuNS),
            "network": str(NetworkNS),
        },
        "@graph": [
            {
                "@id": metric_uri,
                "@type": MetricTypeURI[metadata.metric_type].value,
                "pht:eventTimestamp": metadata.timestamp,
                "pht:hasJobId": job_id,
                "pht:hasStationId": metadata.station_id,
                **(
                    {
                        "pht:hasRxBytes": metadata.rx_bytes,
                        "pht:hasTxBytes": metadata.tx_bytes,
                    }
                    if is_network_metric
                    else {"pht:value": metadata.value}
                ),
            },
        ],
    }

    # Add event metadata to database
    graph.parse(data=payload, format="json-ld")

    # Fetch metric collection for job
    collection = graph.value(subject, PHT.event)
    event_uris = Collection(graph, collection)

    # Clear the event collection if buffer exceeds
    if len(event_uris) > METRICS_BUFFER_SIZE:
        logger.warning(
            f"Metric buffer exceeded. Clearing previous events for job {job_id}"
        )
        for uri in event_uris:
            graph.remove((uri, None, None))

        event_uris.clear()

    # Add new event to the job event list
    event_uris.append(metric_uri)

    # Update job timestamp after every metric creation
    graph.set((subject, PHT.updatedAt, Literal(datetime.now(), datatype=XSD.dateTime)))

    await broadcast_metric_updates(
        metadata.metric_type,
        job_id,
        sort=not is_network_metric,
        graph=graph,
        redis_client=redis_client,
    )


# TODO: Implement subscriber pattern to delete all job metrics when job is finished.
# TODO: Maybe use Rabbitmq for message passing.
@router.delete(
    "/{job_id}/metrics",
    dependencies=[Depends(get_user_info)],
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_job_metric(
    graph: GraphDep,
    job_id: uuid.UUID,
    metadata: JobMetricMetadataDelete,
):
    subject = JobNS[str(job_id)]
    triple = (subject, None, None)

    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job ({job_id}) metadata not found",
        )

    metric_namespace = MetricNamespace[metadata.metric_type].value
    metric_uri = metric_namespace[str(metadata.metric_id)]

    collection = graph.value(subject, PHT.event)
    event_uris = Collection(graph, collection)

    if metric_uri not in event_uris:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metric ({metric_uri.n3(graph.namespace_manager)}) metadata not found",
        )

    # Remove the metric from the job event list
    event_uris.__delitem__(event_uris.index(metric_uri))

    # Remove the metric data from database
    graph.remove((metric_uri, None, None))


async def close_active_sse_connections():
    logger.info("Closing active SSE connections for job and metric updates")

    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=settings.REDIS_DB
        )

        # Broadcast shutdown signal to all Redis channels
        await redis_client.publish(REDIS_JOB_CHANNEL, SHUTDOWN_SIGNAL)
        await redis_client.publish(REDIS_METRIC_CHANNEL, SHUTDOWN_SIGNAL)

        # Get counts for logging
        job_clients = await redis_client.scard(REDIS_JOB_CLIENTS_KEY)
        metric_clients = await redis_client.scard(REDIS_METRIC_CLIENTS_KEY)
        logger.info(
            f"Sent shutdown signals to {job_clients} job clients and {metric_clients} metric clients"
        )

        # Clear client tracking in Redis
        await redis_client.delete(REDIS_JOB_CLIENTS_KEY)
        await redis_client.delete(REDIS_METRIC_CLIENTS_KEY)
        logger.info("Cleared Redis client tracking")

        # Close the Redis connection
        await redis_client.close()

    except Exception as e:
        logger.error(f"Error shutting down SSE connections: {str(e)}")
