"""Contains the Class for generating PHT Metadata Train Events"""
from datetime import datetime, timezone
from rdflib import URIRef, namespace
import typing

import rdflib

from .metadata_generator import Metadata_Generator

from ..SchemaUtil import PHT as pht_namespace

from ..Configuration import StationIriConfiguration


class TimestampableMetadataGenerator(Metadata_Generator):
    """Abstract class which provides a method for adding a timestamp."""

    def add_timestamp(self, g: rdflib.Graph, event, timestamp: datetime) -> rdflib.Graph:
        """add a tipple stating a timestamp to the given event (pht:Event class)"""
        # we always use utc as a time format here:
        l = rdflib.Literal(timestamp.astimezone(
            timezone.utc).isoformat(), datatype=rdflib.namespace.XSD.datetime)
        g.add((event, pht_namespace["eventTimestamp"], l))



class DynamicCentralMetadataGenerator(TimestampableMetadataGenerator):
    """A class to generate rdf triples for describing PHT executions.
    This class contains events which can be generated and sent without a station identifier, but from the central service"""

    def train_instantiated_event(self, train_pid: URIRef, timestamp: datetime, event_iri: rdflib.URIRef):
        """Create an event describing that a train instance was instanciated at the given timestamp."""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["TrainIstantiatedEvent"]))
        g.add((train_pid, pht_namespace["event"], ev))

        return g


class DynamicMetadataGenerator(TimestampableMetadataGenerator):
    """A class to generate rdf triple for describing PHT executions.
    Currently supported are just the event metadata."""

    def __init__(self, station_iri_config: StationIriConfiguration):
        self.station_iri_config = station_iri_config
        self.pht_namespace = pht_namespace

    def get_station_identifier(self) -> rdflib.URIRef:
        """Returns the station identifier configured as an URIRef."""
        if self.ready():
            return rdflib.URIRef(self.station_iri_config.iri)
        else:
            return None

    def ready(self):
        return self.station_iri_config.iri is not None

    def add_emmited_association(self, g: rdflib.Graph, event: rdflib.URIRef, target: rdflib.URIRef):
        g.add((event, pht_namespace["eventAssociatedWithTrain"], target))

    def memory_event(self, target: rdflib.URIRef, consumption, timestamp: datetime, event_iri: rdflib.URIRef):
        """Create a graph with a pht consumption event and let target refer to this event
        with the pht:event property"""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["MemoryUsageReportEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        g.add((ev, pht_namespace["value"], rdflib.Literal(
            float(consumption), datatype=namespace.XSD.float)))
        self.add_emmited_association(g, ev, target)

        return g

    def cpu_event(self, target: rdflib.URIRef, consumption, timestamp: datetime, event_iri: rdflib.URIRef):
        """ Create a graph with a pht consumption event and let target refer to this event
        with the pht:event property"""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["CPUUsageReportEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        g.add((ev, pht_namespace["value"], rdflib.Literal(consumption)))
        self.add_emmited_association(g, ev, target)

        return g

    def started_running_at_station_event(self, target: rdflib.URIRef, timestamp: datetime, event_iri: rdflib.URIRef):
        """ Create a graph with a pht started running event and let target refer to this event
        with the pht:event property """
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["StartedRunningEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        self.add_emmited_association(g, ev, target)

        return g

    def finished_running_at_station_event(self, target: rdflib.URIRef, timestamp: datetime, success: bool, event_iri: rdflib.URIRef):
        """ Create a graph with a pht Finished Transmission event
        and let target refer to this event with the pht:event property.
        Success indicates whether the execution was successful or not"""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["FinishedRunningEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        g.add((ev, pht_namespace["success"], rdflib.Literal(
            bool(success), datatype=namespace.XSD.boolean)))
        self.add_emmited_association(g, ev, target)

        return g

    def started_transmission_event(self, target: rdflib.URIRef, timestamp: datetime, event_iri: rdflib.URIRef):
        """ Create a graph with a pht started Transmission event and let target refer to this event
        with the pht:event property """
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["StartedTransmissionEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        self.add_emmited_association(g, ev, target)

        return g

    def finished_transmission_event(self, target: rdflib.URIRef, timestamp: datetime, event_iri: rdflib.URIRef):
        """ Create a graph with a pht Finished Transmission event and let target refer to this event
        with the pht:event property """
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["FinishedTransmissionEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        self.add_emmited_association(g, ev, target)

        return g

    def rejected_event(self, target: rdflib.URIRef, timestamp: datetime, event_iri: rdflib.URIRef, message: str = ""):
        """ Create a graph with a pht Rejected event and let target refer to this event
        with the pht:event property.
        A message, describing the reason for the rejection is optional."""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["EntityRejectedExecutionEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        g.add((ev, pht_namespace["rejectMessageHumanReadable"], rdflib.Literal(
            message, datatype=namespace.XSD.string)))
        self.add_emmited_association(g, ev, target)

        return g

    def log_event(self, target: rdflib.URIRef, timestamp: datetime, event_iri: rdflib.URIRef, message: str = ""):
        """ Create a graph with a pht Rejected Log and let target refer to this event
        with the pht:event property."""
        ev = event_iri
        g = self.create_graph()
        self.add_timestamp(g, ev, timestamp)
        g.add((ev, rdflib.namespace.RDF["type"],
               pht_namespace["StationLogEvent"]))
        g.add((ev, pht_namespace["eventEmittedByInformationalAuthority"], self.get_station_identifier()))
        g.add((ev, pht_namespace["logMessage"], rdflib.Literal(
            message, datatype=namespace.XSD.string)))
        self.add_emmited_association(g, ev, target)

        return g
