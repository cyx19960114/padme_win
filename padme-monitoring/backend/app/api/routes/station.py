import uuid

from fastapi import APIRouter, status, HTTPException
from rdflib import RDF, Literal

from app import crud
from app.api.deps import GraphDep
from app.core.database import PHT, StationNS
from app.core.logger import logger
from app.models import (
    StationMetadataBase as StationMetadataCreate,
    StationMetadataUpdate,
)
from app.utils import get_triple_count, ResponseType

router = APIRouter()


@router.get(
    path="/count",
    summary="Count all triples of type [rdf:type pht:Station]",
    status_code=status.HTTP_200_OK,
)
async def get_station_triple_count(graph: GraphDep) -> dict:
    return await get_triple_count(graph, PHT.Station)


@router.get("/")
async def get_all_stations(
    graph: GraphDep,
    response_type: ResponseType = ResponseType.default,
    offset: int = 0,
    limit: int = 10,
):
    if response_type is not ResponseType.default:
        return crud.get_resources(
            graph=graph,
            response_type=response_type,
            subject=PHT.Station,
            namespace=StationNS,
            prefix="station",
            offset=offset,
            limit=limit,
        )

    # Default JSON response
    stations = []
    for subject in graph.subjects(RDF.type, PHT.Station):
        stations.append(
            {
                "identifier": str(graph.value(subject, PHT.identifier)),
                "title": str(graph.value(subject, PHT.title)),
                "stationOwner": str(graph.value(subject, PHT.stationOwner)),
                "responsibleForStation": str(
                    graph.value(subject, PHT.responsibleForStation)
                ),
                "description": str(graph.value(subject, PHT.description)),
                "latitude": str(graph.value(subject, PHT.latitude)),
                "longitude": str(graph.value(subject, PHT.longitude)),
                "createdAt": str(graph.value(subject, PHT.createdAt)),
                "updatedAt": str(graph.value(subject, PHT.updatedAt)),
                "hasGPUSupport": bool(graph.value(subject, PHT.hasGPUSupport)),
                "totalGPUPower": str(graph.value(subject, PHT.totalGPUPower)) or None,
                "totalCPUCores": str(graph.value(subject, PHT.totalCPUCores)),
                "totalRAM": str(graph.value(subject, PHT.totalRAM)),
                "totalDiskSpace": str(graph.value(subject, PHT.totalDiskSpace)),
                "hasInternetConnectivity": bool(
                    graph.value(subject, PHT.hasInternetConnectivity)
                ),
                "networkBandwidth": str(graph.value(subject, PHT.networkBandwidth))
                or None,
            }
        )

    # Sort by updatedAt in DESC order
    stations.sort(key=lambda job: job["updatedAt"], reverse=True)
    return stations[offset : offset + limit]


@router.get("/{station_id}")
async def get_station_metadata(
    graph: GraphDep,
    station_id: uuid.UUID,
    response_type: ResponseType = ResponseType.default,
):
    subject = StationNS[str(station_id)]

    # Check if Job URI exists
    if (subject, None, None) not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station ({station_id}) metadata not found",
        )

    if response_type is not ResponseType.default:
        return crud.get_resource_metadata(
            graph=graph,
            response_type=response_type,
            subject_id=str(station_id),
            namespace=StationNS,
            prefix="station",
        )

    subject = StationNS[str(station_id)]
    return {
        "metadataUri": subject,
        "identifier": str(graph.value(subject, PHT.identifier)),
        "title": str(graph.value(subject, PHT.title)),
        "stationOwner": str(graph.value(subject, PHT.stationOwner)),
        "responsibleForStation": str(graph.value(subject, PHT.responsibleForStation)),
        "description": str(graph.value(subject, PHT.description)),
        "latitude": str(graph.value(subject, PHT.latitude)),
        "longitude": str(graph.value(subject, PHT.longitude)),
        "createdAt": str(graph.value(subject, PHT.createdAt)),
        "updatedAt": str(graph.value(subject, PHT.updatedAt)),
        "hasGPUSupport": bool(graph.value(subject, PHT.hasGPUSupport)),
        "totalGPUPower": str(graph.value(subject, PHT.totalGPUPower)) or None,
        "totalCPUCores": str(graph.value(subject, PHT.totalCPUCores)),
        "totalRAM": str(graph.value(subject, PHT.totalRAM)),
        "totalDiskSpace": str(graph.value(subject, PHT.totalDiskSpace)),
        "hasInternetConnectivity": bool(
            graph.value(subject, PHT.hasInternetConnectivity)
        ),
        "networkBandwidth": str(graph.value(subject, PHT.networkBandwidth)) or None,
    }


# Create new station
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_station_metadata(graph: GraphDep, metadata: StationMetadataCreate):
    rdf_triple = (StationNS[metadata.identifier], None, None)
    if rdf_triple in graph:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Metadata already exists for Station ({metadata.identifier})",
        )

    payload = {
        "@context": {"pht": str(PHT), "station": str(StationNS)},
        "@id": f"station:{metadata.identifier}",
        "@type": "pht:Station",
        "pht:createdAt": metadata.createdAt,
        "pht:description": metadata.description,
        "pht:hasGPUSupport": metadata.hasGPUSupport,
        "pht:hasInternetConnectivity": metadata.hasInternetConnectivity,
        "pht:identifier": metadata.identifier,
        "pht:latitude": metadata.latitude,
        "pht:longitude": metadata.longitude,
        "pht:networkBandwidth": metadata.networkBandwidth,
        "pht:responsibleForStation": metadata.responsibleForStation,
        "pht:stationOwner": metadata.stationOwner,
        "pht:title": metadata.title,
        "pht:totalCPUCores": metadata.totalCPUCores,
        "pht:totalDiskSpace": metadata.totalDiskSpace,
        "pht:totalGPUPower": metadata.totalGPUPower,
        "pht:totalRAM": metadata.totalRAM,
        "pht:updatedAt": metadata.updatedAt,
    }

    graph.parse(
        data=payload,
        format="json-ld",
    )
    return payload


@router.put("/{station_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_station_metadata(
    graph: GraphDep,
    metadata: StationMetadataUpdate,
    station_id: uuid.UUID,
):
    subject = StationNS[str(station_id)]

    # Check if Train URI triples exists
    if (subject, None, None) not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Station ({station_id}) metadata not found",
        )

    for pred, _ in graph.predicate_objects(subject):
        predicate_name = pred.n3(graph.namespace_manager).split(":")[-1]

        # Check request payload for new values
        new_value = metadata.model_dump().get(predicate_name)

        # If property does not exists in request body, skip the iteration.
        # There can be many properties such as rdf:type etc.
        if new_value is None:
            continue

        # Update triples one by one
        graph.set((subject, pred, Literal(new_value)))
