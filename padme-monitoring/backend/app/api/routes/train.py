from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status
from rdflib import Literal, RDF

from app import crud
from app.api.deps import GraphDep
from app.core.database import PHT, TrainNS
from app.core.logger import logger
from app.models import TrainMetadataBase as TrainMetadataCreate, TrainMetadataUpdate
from app.utils import get_triple_count, ResponseType

router = APIRouter()


@router.get(
    path="/count",
    summary="Count all triples of type [rdf:type pht:Train]",
    status_code=status.HTTP_200_OK,
)
async def get_train_triple_count(graph: GraphDep) -> dict:
    return await get_triple_count(graph, PHT.Train)


@router.get("/")
async def get_all_trains(
    graph: GraphDep,
    response_type: ResponseType = ResponseType.default,
    offset: int = 0,
    limit: int = 10,
):
    if response_type is not ResponseType.default:
        return crud.get_resources(
            graph=graph,
            response_type=response_type,
            subject=PHT.Train,
            namespace=TrainNS,
            prefix="train",
            offset=offset,
            limit=limit,
        )

    # Default JSON response
    trains = []
    for subject in graph.subjects(RDF.type, PHT.Train):
        trains.append(
            {
                "identifier": str(graph.value(subject, PHT.identifier)),
                "title": str(graph.value(subject, PHT.title)),
                "creator": str(graph.value(subject, PHT.creator)),
                "publisher": str(graph.value(subject, PHT.publisher)),
                "description": str(graph.value(subject, PHT.description)),
                "createdAt": str(graph.value(subject, PHT.createdAt)),
                "analysisPurpose": str(graph.value(subject, PHT.analysisPurpose)),
                "model": str(graph.value(subject, PHT.model)),
                "updatedAt": str(graph.value(subject, PHT.updatedAt)),
                "version": str(graph.value(subject, PHT.version)),
            }
        )

    # Sort by updatedAt in DESC order
    trains.sort(key=lambda job: job["updatedAt"], reverse=True)
    return trains[offset : offset + limit]


# Get Train metadata by ID
@router.get("/{train_id}")
async def get_train_metadata(
    graph: GraphDep,
    train_id: Annotated[str, Path(min_length=5)],
    response_type: ResponseType = ResponseType.default,
):
    subject = TrainNS[train_id]

    # Check if Train URI exists
    if (subject, None, None) not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Train ({train_id}) metadata not found",
        )

    if response_type is not ResponseType.default:
        return crud.get_resource_metadata(
            graph=graph,
            response_type=response_type,
            subject_id=train_id,
            namespace=TrainNS,
            prefix="train",
        )

    return {
        "metadataUri": subject,
        "identifier": str(graph.value(subject, PHT.identifier)),
        "title": str(graph.value(subject, PHT.title)),
        "creator": str(graph.value(subject, PHT.creator)),
        "publisher": str(graph.value(subject, PHT.publisher)),
        "description": str(graph.value(subject, PHT.description)),
        "analysisPurpose": str(graph.value(subject, PHT.analysisPurpose)),
        "model": str(graph.value(subject, PHT.model)),
        "createdAt": str(graph.value(subject, PHT.createdAt)),
        "updatedAt": str(graph.value(subject, PHT.updatedAt)),
        "version": str(graph.value(subject, PHT.version)),
    }


# Create new Train
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_train_metadata(graph: GraphDep, metadata: TrainMetadataCreate):
    rdf_triple = (TrainNS[metadata.identifier], None, None)
    if rdf_triple in graph:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Metadata already exists for Train ({metadata.identifier})",
        )

    payload = {
        "@context": {"pht": str(PHT), "train": str(TrainNS)},
        "@id": f"train:{metadata.identifier}",
        "@type": "pht:Train",
        "pht:identifier": metadata.identifier,
        "pht:title": metadata.title,
        "pht:creator": metadata.creator,
        "pht:publisher": metadata.publisher,
        "pht:description": metadata.description,
        "pht:analysisPurpose": metadata.analysisPurpose,
        "pht:model": metadata.model or "N/A",
        "pht:version": metadata.version,
        "pht:createdAt": metadata.createdAt,
        "pht:updatedAt": metadata.updatedAt,
    }

    graph.parse(
        data=payload,
        format="json-ld",
    )
    return payload


@router.put("/{train_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_train_metadata(
    graph: GraphDep,
    metadata: TrainMetadataUpdate,
    train_id: Annotated[str, Path(min_length=5)],
):
    subject = TrainNS[train_id]

    # Check if Train URI triples exists
    if (subject, None, None) not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Train ({train_id}) metadata not found",
        )

    for pred, _ in graph.predicate_objects(subject):
        predicate_name = pred.n3(graph.namespace_manager).split(":")[-1]

        # Check if updated property exists in request payload
        new_value = metadata.model_dump().get(predicate_name)

        # If property does not exist in request body, skip the iteration.
        # There can be many properties such as rdf:type etc.
        if new_value is None:
            continue

        # Update triples one by one
        graph.set((subject, pred, Literal(new_value)))
