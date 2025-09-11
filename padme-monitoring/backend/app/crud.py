import json

from fastapi import Response, HTTPException, status
from rdflib import Graph, Namespace, URIRef

from app.core.database import PHT
from app.utils import query_subject_properties, ResponseType


def get_resources(
    graph: Graph,
    response_type: str,
    subject: URIRef,
    namespace: Namespace,
    prefix: str,
    offset: int,
    limit: int,
    extra_context: dict = {},
):
    result_graph = Graph()
    query_result = graph.query(
        query_subject_properties(),
        initBindings={"uri": subject},
    )
    for row in query_result:
        result_graph.add(row)

    # Return turtle response
    if response_type is ResponseType.turtle:
        result_graph.bind("pht", PHT)
        result_graph.bind(prefix, namespace)

        response = result_graph.serialize()
        return Response(response, media_type="text/turtle")

    context = {"pht": PHT, prefix: namespace, **extra_context}
    response = json.loads(
        result_graph.serialize(format="json-ld", indent=4, context=context)
    )

    if len(response.get("@graph", [])) > 0:
        response["@graph"] = response["@graph"][offset : offset + limit]

    return response


def get_resource_metadata(
    graph: Graph,
    response_type: str,
    subject_id: str,
    namespace: Namespace,
    prefix: str,
):
    triple = (namespace[subject_id], None, None)

    # Check if URI exists
    if triple not in graph:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{prefix} ({subject_id}) metadata not found",
        )

    # TODO: This is never reached since we already defined json response in parent GET by id function.
    # Return default response with train metadata as a dictionary
    if response_type is ResponseType.default:
        metadata = {"id": subject_id}
        for pred, obj in graph.predicate_objects(namespace[subject_id]):
            metadata.update({str(pred): str(obj)})

        return metadata

    # Return json-ld response
    result_graph = Graph()
    for sub, pred, obj in graph.triples(triple):
        result_graph.add((sub, pred, obj))

    context = {"pht": PHT, prefix: namespace}
    jsonld_payload = result_graph.serialize(format="json-ld", indent=4, context=context)

    return Response(jsonld_payload, media_type="application/json+ld")
