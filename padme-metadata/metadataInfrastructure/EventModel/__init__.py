"""
Event Model module. Provides logic for storing and retrieviving the events in a relational database.
"""
from .mapper import Event, EventStationAssociation
from .eventManager import EventManager