"""
This file contains the handler for displaying rdf-based documents of entities
"""
from typing import Optional, Awaitable, Callable, List
from dataclasses import dataclass
from copy import deepcopy

import rdflib
from tornado.web import RequestHandler, HTTPError, Application


from .protected_handler import ProtectedWithSignatureHandler

from ..GraphModel import GraphModel
from ..StationManager import StationManager
from ..GraphContainer import GraphContainer
from ..EventModel import EventManager
from ..SchemaUtil import get_namespaced_graph, add_pht_namespace

from .rdf_format import RDFFormat

HTML_CONTENT_HEADER = "text/html"

@dataclass
class DocumentViewConfiguration:
    graph_model: GraphModel
    document_prefix: str
    redirection_target_constructor: Callable[[str], str]
    station_manager: Optional[StationManager]=None
    event_manager: Optional[EventManager]=None
    """Alternative way of protection, if information is not coming from stations. Query needs to have one key in the header field Store-key"""
    protection_keys: Optional[List[str]] = None

class DocumentView(ProtectedWithSignatureHandler):
    """
    Handler for displaying Document based representations
    """

    def initialize(self, configuration: DocumentViewConfiguration):
        super().initialize(configuration.station_manager)
        self._graph_model = configuration.graph_model
        self._redirection_target_constructor = configuration.redirection_target_constructor
        self._document_prefix = configuration.document_prefix
        self._event_manager = configuration.event_manager
        self._protection_keys = configuration.protection_keys
        

    def prepare(self) -> Optional[Awaitable[None]]:
        self.html_redirect = HTML_CONTENT_HEADER in self.request.headers.get_list("Content-Type")
        if not self.html_redirect:
            self.identify_format()


    def get(self, entity_suffix):
        if self.html_redirect:
            self.redirect_to_html(entity_suffix)
        self.write_document(entity_suffix)

    def populate_graph_with_event_data(self, graph, event_iri: str):
        data = self._event_manager.get_event_data(event_iri)
        graph.parse(data=data, format=str(RDFFormat.JSONLD))
        return graph

    def populate_with_events(self, graph: rdflib.Graph, for_iri: str, for_property_class: str = None):
        if self._event_manager is not None:
            events = self._event_manager.get_events_associated_with_document(for_iri)
            for (event, association) in events:
                if for_property_class is None or association.association_property_class == for_property_class:
                    self.populate_graph_with_event_data(graph, event.event_iri)

                

    def redirect_to_html(self, entity_suffix):
        """
        Responds a 301 to the provided forwarding target
        """
        self.redirect(self._redirection_target_constructor(entity_suffix), permanent=True)

    def construct_graph_identifier(self, entity_suffix):
        """
        Construct the identifier of the graph/document with the provided document_prefix at init and the entity_suffix.
        """
        return self._document_prefix + entity_suffix

    def get_sent_key(self) -> Optional[str]:
        if "Store-key" in self.request.headers:
            return self.request.headers.get("Store-key")
        return None


    def write_document(self, entity_suffix):
        # query the graph model on the named graph, which is the given prefix + the station id
        # the entity itself is the entity with appended #e (atm)
        # TODO escape entity suffix to prevent SPARQL injection
        #if not self._graph_model.graph_exist(self.construct_graph_identifier(entity_suffix)):
        #    raise HTTPError(404, f"Graph for entity suffix {entity_suffix} ({self.construct_graph_identifier(entity_suffix)}) not found!", reason="Entity not found")
        g = self._graph_model.get_context_graph(self.construct_graph_identifier(entity_suffix))
        add_pht_namespace(g)

        # add events to this document
        self.populate_with_events(g, self.construct_graph_identifier(entity_suffix))

        self.write(g.serialize(format=str(self.format)))
        self.set_header("Content-Type", self.format.content_header())

    def put(self, entity_suffix):
        g = rdflib.Graph()
        g.parse(data=self.request.body.decode(), format=str(self.format))

        if self._station_manager:
            # prepare self so that the check_signature method will work
            secret_key = self.get_key_for_entity(self.construct_graph_identifier(entity_suffix))
            self.check_signature(against_key=secret_key)

        if self._protection_keys:
            sent_key = self.get_sent_key()
            if not sent_key:
                raise HTTPError(403, "No key provided", reason="No key provided")
            if sent_key not in self._protection_keys:
                raise HTTPError(403, "Invalid key", reason="Invalid key")

        self._graph_model.set_context_graph(self.construct_graph_identifier(entity_suffix), g)

def create_document_view_app(configuration: DocumentViewConfiguration):
    return Application([
        (r"(.*)", DocumentView, dict(configuration=configuration))
    ])