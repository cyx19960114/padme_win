"""This module contains the routes for setting states of trains."""
import logging

from tornado import web
from tornado import routing

from metadataInfrastructure.PHTMetadataGenerator.dynamic_metadata_generator import DynamicMetadataGenerator, DynamicCentralMetadataGenerator
from metadataInfrastructure.MetadataBuffer import MetadataContainerBuffer
from .abstract_handler import AbstractStationRelatedDynamicMetadataHandler, AbstractStationUnrelatedDynamicMetadataHandler

logger = logging.getLogger(__name__)


class ExecutionStartedRunningHandler(AbstractStationRelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        logger.info(
            f'Received Notification that the execution:{self.train_instace_pid} started')
        event_iri = self.get_event_iri()
        g = self.generator.started_running_at_station_event(
            self.train_instace_pid, self.timestamp, event_iri)
        self.add_to_buffer_if(g, self.generator.get_station_identifier(), event_iri)
        self.write_serialized_graph(g)


class ExecutionStartedDownloadingHandler(AbstractStationRelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        # check if image information were sent:
        logger.info(
            f'Received Notification that the download of execution: {self.train_instace_pid} started')
        event_iri = self.get_event_iri()
        # generate the rdf metadata
        g = self.generator.started_transmission_event(self.train_instace_pid, self.timestamp, event_iri)
        self.add_to_buffer_if(g, self.generator.get_station_identifier(), event_iri)
        self.write_serialized_graph(g)


class ExecutionFinishedDownloadingHandler(AbstractStationRelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        logger.debug(
            f'Received Notification that the download of execution: {self.train_instace_pid} finished')
        event_iri = self.get_event_iri()
        g = self.generator.finished_transmission_event(self.train_instace_pid, self.timestamp, event_iri)
        self.add_to_buffer_if(g, self.generator.get_station_identifier(), event_iri)
        self.write_serialized_graph(g)



class ExecutionFinishedHandler(AbstractStationRelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        logger.debug(
            f'Received Notification that the execution: {self.train_instace_pid} stopped')
        if not 'successful' in self.args:
            self.send_error(400)
            return
        event_iri = self.get_event_iri()
        g = self.generator.finished_running_at_station_event(self.train_instace_pid, self.timestamp, self.args["successful"], event_iri)
        self.add_to_buffer_if(g, self.generator.get_station_identifier(), event_iri)
        self.write_serialized_graph(g)



class ExecutionRejectedHandler(AbstractStationRelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        logger.debug(
            f'Received Notification that the execution: {self.train_instace_pid} was rejected')
        # message is optional
        message = ''
        if 'message' in self.args:
            message = self.args['message']
        event_iri = self.get_event_iri()
        g = self.generator.rejected_event(self.train_instace_pid, self.timestamp, event_iri, message)
        self.add_to_buffer_if(g, self.generator.get_station_identifier(), event_iri)
        self.write_serialized_graph(g)

class ExecutionInstantiatedHandler(AbstractStationUnrelatedDynamicMetadataHandler):
    def post(self, extra_args=None):
        logger.debug(
            f'Received Notification that the execution: {self.train_instace_pid} was instantiated')
        
        event_iri = self.get_event_iri()
        g = self.generator.train_instantiated_event(self.train_instace_pid, self.timestamp, event_iri)
        self.add_to_buffer_if(g, event_iri=event_iri)
        self.write_serialized_graph(g)


def create_app(dynamic_generator: DynamicMetadataGenerator, dynamic_central_generator: DynamicCentralMetadataGenerator, buffer: MetadataContainerBuffer, return_metadata=False, gateway_configuration=None):
    """Create application for routing for the state_endpoint. If buffer is not none, metadata requested
        will be written to it. If return_metadata is true, endpoint will return metadata to the request."""
    # common arguments for staiton related dynamic metadata handler
    init_args = dict(dynamic_generator=dynamic_generator, buffer=buffer, return_metadata=return_metadata, gateway_configuration=gateway_configuration)
    # common arguments for station unrelated dynamic metadata handler
    init_args_central = dict(dynamic_generator=dynamic_central_generator, buffer=buffer, return_metadata=return_metadata)
    return web.Application([
        web.url('(.*)/startedRunning', ExecutionStartedRunningHandler, init_args),
        web.url('(.*)/startedDownloading', ExecutionStartedDownloadingHandler, init_args),
        web.url('(.*)/finishedDownloading', ExecutionFinishedDownloadingHandler, init_args),
        web.url('(.*)/finished', ExecutionFinishedHandler, init_args),
        web.url('(.*)/rejected', ExecutionRejectedHandler, init_args),
        web.url('(.*)/instantiated', ExecutionInstantiatedHandler, init_args_central)
    ])