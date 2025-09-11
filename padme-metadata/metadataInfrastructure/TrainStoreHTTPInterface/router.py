from typing import List
from rdflib import Graph
from dataclasses import dataclass
from tornado.routing import RuleRouter

from metadataInfrastructure.GraphContainer import PrefixGuardValidator


from .secret_key import create_app as create_secret_key_app
from .secret_key import SecretKeyHandlerConfiguration
from .station_feed import create_app as create_station_feed_app
from .station_feed import StationFeedHandlerConfiguration
from .query import get_app as create_query_app
from .query import QueryHandlerConfiguration
from .document_view import create_document_view_app
from .document_view import DocumentViewConfiguration
from .events import create_app as create_events_app
from .events import EventHandlerConfiguration


from ..StationManager import StationManager
from ..GraphModel import GraphModel

@dataclass
class InterfaceConfig:
    stationFeedHandlerConfiguration: StationFeedHandlerConfiguration
    secretKeyHandlerConfiguration: SecretKeyHandlerConfiguration
    queryHandlerConfiguration: QueryHandlerConfiguration
    documentViewConfiguration: DocumentViewConfiguration
    trainClassDocumentViewConfiguration: DocumentViewConfiguration
    eventHandlerConfiguration: EventHandlerConfiguration

def create_router(configuration: InterfaceConfig):
    router = RuleRouter([
        (r"/stations/(.*)", create_secret_key_app(configuration.secretKeyHandlerConfiguration)),
        (r"/entities/feed", create_station_feed_app(configuration.stationFeedHandlerConfiguration)),
        (r"/entities/query", create_query_app(configuration.queryHandlerConfiguration)),
        (r"/entities/stations/(.*)", create_document_view_app(configuration.documentViewConfiguration)),
        (r"/entities/trainclasses/(.*)", create_document_view_app(configuration.trainClassDocumentViewConfiguration)),
        (r"/events/(.*)", create_events_app(configuration.eventHandlerConfiguration))
    ])

    return router