"""This file contains all endpoints for creating static metadata about a train instace. For dynamic metadata see state_endpoint and metric_endpoint"""
import logging

from metadataInfrastructure.MetadataBuffer import MetadataContainerBuffer
from metadataInfrastructure.PHTMetadataGenerator import \
    Static_Train_Instance_Metadata_Generator
from tornado import routing, web

from .abstract_handler import AbstractTrainInstanceStaticMetadataHandler

logger = logging.getLogger(__name__)


class Train_Instance_Creation_Handler(AbstractTrainInstanceStaticMetadataHandler):
    """Handles request for creating metadata containing that a pid is a train instace (i.e. 'creating' this train instace)"""
    def post(self, extra_args=None):
        logger.debug(
            f"Request for creating a Train Instance creation descirption"
        )
        g = self.static_train_instance_generator.instancing_pid(
            self.train_instace_pid)
        self.add_to_buffer_if(g)
        self.write_serialized_graph(g)


def create_app(static_train_instance_generator: Static_Train_Instance_Metadata_Generator, buffer: MetadataContainerBuffer, return_metadata=False):
    return web.Application([
        web.url("(.*)/create", Train_Instance_Creation_Handler,
                dict(static_train_instance_generator=static_train_instance_generator, buffer=buffer, return_metadata=return_metadata))
    ])

