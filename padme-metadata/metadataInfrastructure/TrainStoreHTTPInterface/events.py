import tornado.web as web
import rdflib
import rdflib.exceptions
import typing
import copy
import datetime
from rdflib.namespace import RDF, RDFS
import functools

from dataclasses import dataclass

from .rdf_format import RDFFormat
from .protected_handler import ProtectedWithSignatureHandler

from ..SchemaUtil import get_schema, PHT, add_pht_namespace, event_classes
from ..EventModel import EventManager, Event
from ..StationManager import StationManager




def calculate_event_superclass_closure(graph: rdflib.Graph) -> rdflib.Graph:
    """
    Adds a triple (resource, , pht:TripEvent) for each resource that is an instance of a subclass of tripevent
    """
    res = copy.deepcopy(graph)
    for candidate in graph.triples((None, RDF.type, None)):
        if str(candidate[2]) in event_classes():
            res.add((candidate[0], RDF.type, PHT["TripEvent"]))
    return res

def get_event_iris(graph: rdflib.Graph):
    closured = calculate_event_superclass_closure(graph)
    return list(closured.subjects(RDF.type, PHT["TripEvent"]))

def extract_associated_iris(graph: rdflib.Graph, event_iri: str) -> typing.Iterator[typing.Tuple[str, str]]:
    """
    Return iterator which yields tuples (associated iris, association property class)
    """
    yield (graph.value(rdflib.URIRef(event_iri), PHT["eventAssociatedWithTrain"]), str(PHT["eventAssociatedWithTrain"]))
    if (informational_authority := get_emitting_informational_authority(graph, event_iri)) is not None:
        yield (informational_authority, str(PHT["eventEmittedByInformationalAuthority"]))

def get_emitting_informational_authority(graph: rdflib.Graph, event_iri: str) -> str:
    return str(graph.value(rdflib.URIRef(event_iri), PHT["eventEmittedByInformationalAuthority"], any=False))
    
def extract_timestamp_from_event(graph: rdflib.Graph, event_iri: str) -> datetime.datetime:
    return datetime.datetime.fromisoformat(graph.value(rdflib.URIRef(event_iri), PHT["eventTimestamp"]))
        
def get_event_class_iri(graph: rdflib.Graph, event_iri: str) -> str:
    return str(graph.value(rdflib.URIRef(event_iri), RDF.type, any=False))

def get_document_containing(entity_iri: str):
    """
    Returns the document containing this entity iri by subtracting the anchor suffix
    """
    index_of_anchor = entity_iri.find('#')
    return entity_iri[:index_of_anchor] if index_of_anchor > -1 else entity_iri

@dataclass
class EventHandlerConfiguration:
    event_manager: EventManager
    station_manager: StationManager
    document_prefix: str

class EventHandler(ProtectedWithSignatureHandler):
    """
    Responsible for adding events on requests
    """

    def initialize(self, configuration: EventHandlerConfiguration):
        super().initialize(configuration.station_manager)
        self._event_manager = configuration.event_manager
        self._document_prefix = configuration.document_prefix

    
    def get_document_iri(self, suffix: str) -> str:
        return self._document_prefix + suffix

    def put(self, entity_suffix):
        self.identify_format()
        
        g = self.parse_to_graph(self.request.body)
        add_pht_namespace(g)
        # check against shacl...
        iris = get_event_iris(g)
        print(iris)
        if len(iris)!=1:
            raise web.HTTPError(400, "Multiple or none events posted", reason="Only exactly one event allowed")
        iri = iris[0]
        
        if isinstance(iri, rdflib.BNode):
            raise web.HTTPError(400, f"Event is a blank node.", reason="Event must not be a blank node.")

        try:
            emitted_by = get_emitting_informational_authority(g, iri)
            if emitted_by is None:
                raise web.HTTPError(400, f"No Informational Authority defined which emitted the event.", reason="No Informational Authority")
            if self._station_manager:
                # the document containing the emitting informational authority
                # the given signature must be sent by the same station which holds the document describing itself
                ia_document = get_document_containing(emitted_by)
                secret_key = self._station_manager.get_secret_key(ia_document)
                if secret_key is None:
                    raise web.HTTPError(400, f"Informational Authority not found: {str(emitted_by)}", reason="Informational Authority not found.")
                self.check_signature(secret_key)

        except rdflib.exceptions.UniquenessError as e:
            raise web.HTTPError(400, f"Not unique Informational Authority: {str(e)}", reason="Not unique Informational Authority")

        try:
            timestamp = extract_timestamp_from_event(g, iri)
        except Exception as e:
            raise web.HTTPError(400, f"User given event has no/invalid timestamp: {str(e)}", reason="No or invalid timestamp in the event")
        try:
            event_class_iri = get_event_class_iri(g, iri)
        except Exception as e:
            raise web.HTTPError(400, f"Error in determining type of event: {str(e)}", reason="error in determining event type/ubquious event type")
        if event_class_iri not in event_classes():
            raise web.HTTPError(400, "Unknown event class", reason="Bad event class.")
        event = self._event_manager.add_event(
            Event(
                event_iri=iri,
                document_iri=self.get_document_iri(entity_suffix),
                timestamp=timestamp, 
                payload=g.serialize(format=str(RDFFormat.JSONLD)), 
                event_type=event_class_iri)
        )
        # associate the events with the documents containing the entity iris
        for (associated_iri, association_property_class) in extract_associated_iris(g, iri):
            print(f"Event: {event_class_iri} added with associated iri: {str(get_document_containing(associated_iri))} property class: {association_property_class}")
            self._event_manager.associate_entity_with_event(event, get_document_containing(associated_iri), association_property_class)
        
    def get(self, entity_suffix):
        self.identify_format()
        data = self._event_manager.get_event_data_for_document(self.get_document_iri(entity_suffix))
        if data is None:
            raise web.HTTPError(404, f"event not found: {self.get_document_iri(entity_suffix)}", reason="Event not found")
        if self.format == RDFFormat.JSONLD:
            self.write(data)
        else:
            g = rdflib.Graph()
            add_pht_namespace(g)
            g.parse(data=data, format=str(RDFFormat.JSONLD))
            self.write(g.serialize(format=str(self.format)))

def create_app(configuration: EventHandlerConfiguration):
    return web.Application([
        (r"(.*)", EventHandler, dict(configuration=configuration))
    ])
        