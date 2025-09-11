"""This file contains the abstract metadata handler, containing method used in most handlers"""
import uuid
from datetime import datetime
from typing import Union, Optional

import rdflib
import tornado.escape as escape
import tornado.web as web
from dateutil import parser

from ..GraphContainer.graph_container import GraphContainer, EventGraphContainer
from ..MetadataBuffer import MetadataContainerBuffer
from ..PHTMetadataGenerator import (DynamicCentralMetadataGenerator,
                                    DynamicMetadataGenerator,
                                    Static_Train_Instance_Metadata_Generator)
from ..Configuration import GatewayConfiguration
# pylint: disable=attribute-defined-outside-init, abstract-method


class AbstractMetadataHandler(web.RequestHandler):
    def initialize(self, buffer: MetadataContainerBuffer = None, gateway_configuration: Optional[GatewayConfiguration] = None,
                   return_metadata: bool = False):
        """Internal initialization method of tornado"""
        self.buffer = buffer
        self.return_metadata = return_metadata
        self._gateway_configuration= gateway_configuration

    def prepare(self):
        self.args = escape.json_decode(self.request.body)
        # we use turtle as default format
        self.serialization_format = self.get_query_argument("format", "turtle")

    def add_to_buffer_if(self, g: rdflib.Graph, authority_iri: Union[str, rdflib.URIRef] = None):
        """
        Add to specified metadata buffer if one is specified.
        If an iri is specified, it is used as authority.
        """
        authority = str(authority_iri) if authority_iri is not None else None
        if self.buffer is not None:
            self.buffer.add(GraphContainer(g, authority=authority))

    def write_serialized_graph(self, g: rdflib.Graph):
        """Serialize the graph with the user specified serialization format.
        Data is only written if the return_metadata flag is set to true."""
        if self.return_metadata:
            self.write(g.serialize(format=self.serialization_format))


class AbstractDynamicMetadataHandler(AbstractMetadataHandler):
    """Abstract class providing base code for dynamic metadata handler"""

    # flag for overriding timestamp behavior, since js has no toisoformat() method and needs to send the timestamp in epoch
    parse_timestamp = True

    def prepare(self):
        super().prepare()
        if self.parse_timestamp:
            self.get_time_stamp()
        if not 'pid' in self.args:
            # the generator has no iri for the station, hence it is not ready
            # throw error
            raise web.HTTPError(400, "missing train identifier in request", reason="Missing pid")
        self.train_instace_pid = rdflib.URIRef(self.args['pid'])

    def get_time_stamp(self):
        """Store the time in iso format when the method is triggered
        If no time stamp is provided in the request body, the current time is used."""
        if 'timestamp' in self.args:
            self.timestamp: datetime = parser.isoparse(self.args['timestamp'])
        else:
            self.timestamp = datetime.now()

    def get_event_iri(self):
        return rdflib.BNode() if (self._gateway_configuration is None) or (self._gateway_configuration.uplink_adress is None) else (rdflib.URIRef(self._gateway_configuration.uplink_adress + str(uuid.uuid4()) + "#e"))

    def add_to_buffer_if(self, g: rdflib.Graph, authority_iri: Union[str, rdflib.URIRef] = None, event_iri: Optional[rdflib.URIRef] = None):
        """
        Add to specified metadata buffer if one is specified.
        If an iri is specified, it is used as authority.
        """
        authority = str(authority_iri) if authority_iri is not None else None
        if self.buffer is not None:
            self.buffer.add(EventGraphContainer(g, authority=authority, event_iri=event_iri))


class AbstractStationUnrelatedDynamicMetadataHandler(AbstractDynamicMetadataHandler):
    """Abstract class providing base code for dynamic station unrelated metadata handling"""

    def initialize(self, dynamic_generator: DynamicCentralMetadataGenerator, buffer: MetadataContainerBuffer = None,
                   return_metadata: bool = False):
        """Internal initialization method of tornado"""
        super().initialize(buffer, return_metadata)
        self.generator = dynamic_generator


class AbstractStationRelatedDynamicMetadataHandler(AbstractDynamicMetadataHandler):
    """The super class for all station related dynamic metadata handler,
    containing all functions that are the same across the handler"""

    def initialize(self, dynamic_generator: DynamicMetadataGenerator, buffer: MetadataContainerBuffer = None,
                   return_metadata: bool = False, gateway_configuration: Optional[GatewayConfiguration] = None,):
        """Internal initialization method of tornado"""
        super().initialize(buffer, gateway_configuration, return_metadata)
        self.generator = dynamic_generator

    def prepare(self):
        """Internal method of tornado"""
        super().prepare()
        if not self.generator.ready():
            raise web.HTTPError(400, "Generator not ready", reason="Missing configuration")


class AbstractTrainInstanceStaticMetadataHandler(AbstractMetadataHandler):
    """The super class for all handler for static Train Instance metadata"""

    def initialize(self, static_train_instance_generator: Static_Train_Instance_Metadata_Generator, buffer: MetadataContainerBuffer = None, return_metadata: bool = False):
        self.static_train_instance_generator = static_train_instance_generator
        return super().initialize(buffer, return_metadata)

    def prepare(self):
        super().prepare()
        if not 'pid' in self.args:
            self.send_error(400)
            return
        self.train_instace_pid = self.args['pid']
