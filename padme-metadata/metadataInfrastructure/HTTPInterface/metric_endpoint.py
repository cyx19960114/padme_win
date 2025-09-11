"""This module contains the endpoints for the telegraf script."""
import logging
import typing
from datetime import datetime

import tornado.routing as routing
import tornado.web as web
import rdflib
from metadataInfrastructure.MetadataBuffer import MetadataContainerBuffer
from metadataInfrastructure.PHTMetadataGenerator import \
    DynamicMetadataGenerator
from metadataInfrastructure.Configuration import GatewayConfiguration

from .abstract_handler import AbstractStationRelatedDynamicMetadataHandler

logger = logging.getLogger(__name__)
# this class handles the http endpoint for telegraf


def parse_timestamp(timestamp_str: str):
    return datetime.fromtimestamp(int(timestamp_str))


class MetricHandler(AbstractStationRelatedDynamicMetadataHandler):
    parse_timestamp = False

    def get_graph_for_metric(self, metric: typing.Dict, event_iri: typing.Union[rdflib.URIRef, rdflib.BNode]):
        value = metric["value"]
        mtype = metric["type"]
        timestamp = parse_timestamp(metric["timestamp"])
        if mtype == "memory":
            return self.generator.memory_event(self.train_instace_pid, value, timestamp, event_iri)
        elif mtype == "cpu":
            return self.generator.cpu_event(self.train_instace_pid, value, timestamp, event_iri)
        elif mtype == "log":
            return self.generator.log_event(self.train_instace_pid, timestamp, event_iri, str(value))

    def post(self, extra_args=None):
        """Internal tornado post handler"""
        metric = self.args
        try:
            event_iri = self.get_event_iri()
            g = self.get_graph_for_metric(metric, event_iri)
            logger.info("received metric")
            self.add_to_buffer_if(
                g, self.generator.get_station_identifier(), event_iri)
        except KeyError:
            self.write_error(404)
            return
        
        self.write_serialized_graph(g)


def create_app(dynamic_generator: DynamicMetadataGenerator, buffer: MetadataContainerBuffer, return_metadata=True, gateway_configuration: GatewayConfiguration=None):
    return web.Application([web.url(r'(.*)', MetricHandler,
                                    dict(dynamic_generator=dynamic_generator, buffer=buffer, return_metadata=return_metadata, gateway_configuration=gateway_configuration))])
