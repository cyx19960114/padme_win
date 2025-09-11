"""
This module contains the handler to enable Stations
to provide metadata related to themselfs.
"""

from logging import Logger
from typing import Optional, Tuple
from dataclasses import dataclass

import rdflib
from pyshacl import validate
from tornado import web

from .protected_handler import ProtectedWithSignatureHandler

from ..GraphContainer import \
    GraphContainer, PrefixGuardValidator
from ..StationManager import StationManager
from ..GraphModel import GraphModel
from .rdf_format import RDFFormat

logger = Logger("Station Feed Handler")

@dataclass
class StationFeedHandlerConfiguration:
    station_manager: StationManager
    graph_model: GraphModel
    pgv: PrefixGuardValidator
    shacl_graph: rdflib.Graph

class StationFeedHandler(ProtectedWithSignatureHandler):
    """Handler for providing metadata from a station."""

    def initialize(self, configuration: StationFeedHandlerConfiguration):
        """Internal Tornado method"""
        assert configuration.station_manager is not None
        assert configuration.shacl_graph is not None
        self.station_manager = configuration.station_manager
        self.graph_model = configuration.graph_model
        self.pgv = configuration.pgv

        self.shacl_graph = configuration.shacl_graph

        self.shacl_validation_method = validate

        self.signed_g: Optional[GraphContainer] = None
        self.station_hint: Optional[str] = None
        self.provided_signature: Optional[bytes] = None


    def get_station_hint(self) -> str:
        station_hint = self.get_query_argument("station", None)
        if station_hint is None:
            # what are we doing now? searching?
            # or returning error?
            # atm we will just give an error
            raise web.HTTPError(
                400, "No station iri provided by user", reason="Bad Request: No station provided")
        return station_hint


    def check_shacl_validity(self):
        valid, _, result_text = self.shacl_validation_method(
            self.signed_g.graph(), shacl_graph=self.shacl_graph, advanced=True)
        if not valid:
            raise web.HTTPError(
                403, "Graph validation failed, reason: {result_text}", reason="Graph validation failed")

    def pgv_check(self) -> Tuple[bool, bool]:
        # check if graph has allowed structure
        connected, contains_prefix = self.pgv.check_resource_validation(
            self.signed_g) if self.pgv is not None else (True, False)
        if not connected:
            raise web.HTTPError(404, "station provided graph not connected",
                                reason="Metadata graph needs to be fully connected")
        if contains_prefix:
            raise web.HTTPError(404, "station provided graph wants to describe other entities",
                                reason="Metadata is not allowed to describe other stations")

    def post(self, extra_args=None):
        """Station Feed Post Handler: parse graph, check reachability and validity. If ok, pass on to storage."""

        self.decode_signature()
        self.identify_format()

        # guards

        self.parse_body()
        self.check_signature()

        self.pgv_check()

        self.graph_model.add_feed_from_entity(self.signed_g, self.signed_g.authority())

        self.set_status(200)


def create_app(config: StationFeedHandlerConfiguration):
    """Create an application with the station feed handler."""
    return web.Application([
        (r"(.*)", StationFeedHandler, dict(configuration=config))
    ])
