from datetime import datetime
from tornado import web, routing
import rdflib
import logging
import typing

from metadataInfrastructure.MetadataBuffer import MetadataContainerBuffer

from metadataInfrastructure.Gateway import EventFilter

from metadataInfrastructure.PHTMetadataGenerator import DynamicMetadataGenerator, Static_Train_Instance_Metadata_Generator
from metadataInfrastructure.Configuration import MetadataProviderConfiguration

# additional http handler:
from .metric_endpoint import create_app as metric_app
from .configuration_endpoint import create_app as configuration_app
from .state_endpoint import create_app as state_app

logger = logging.getLogger(__name__)

def createApp(dynamic_generator: DynamicMetadataGenerator, dynamic_central_generator: DynamicMetadataGenerator, static_train_instance_generator: Static_Train_Instance_Metadata_Generator, event_filter: EventFilter, \
        trainSHACLGraph: rdflib.Graph, stationSHACLGraph: rdflib.Graph, buffer: MetadataContainerBuffer, configuration: MetadataProviderConfiguration):

        return routing.RuleRouter([
                (r"/configuration/(.*)", configuration_app(dynamic_generator, event_filter, configuration.station_iri, configuration.gateway)),
                (r"/remote/execution/metric", metric_app(dynamic_generator, buffer, return_metadata=False, gateway_configuration=configuration.gateway)),
                (r"/remote/execution/state/(.*)", state_app(dynamic_generator, dynamic_central_generator, buffer, gateway_configuration=configuration.gateway)),
                (r"/generate/execution/state/(.*)", state_app(dynamic_generator, dynamic_central_generator, buffer, return_metadata=True, gateway_configuration=configuration.gateway)),
        ])
