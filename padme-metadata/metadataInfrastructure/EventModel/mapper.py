import sqlalchemy
import sqlalchemy.orm

import datetime
import rdflib

mapper_registry = sqlalchemy.orm.registry()
Base = mapper_registry.generate_base()


class Event(Base):
    """
    ORM mapper for storing an event.
    """

    __tablename__ = "events"

    # id for the event
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)

    # iri for the event itself
    event_iri = sqlalchemy.Column(sqlalchemy.VARCHAR(255))

    # iri for the document describing the event
    document_iri = sqlalchemy.Column(sqlalchemy.VARCHAR(255))

    # timestamp of the event
    timestamp = sqlalchemy.Column(sqlalchemy.DateTime)

    # additional payload of the event in the form of serialized rdf
    payload = sqlalchemy.Column(sqlalchemy.JSON, nullable=True)

    #type of the event in the form of an iri
    event_type = sqlalchemy.Column(sqlalchemy.String)

    def __repr__(self) -> str:
        return f"ID: {self.id}, timestamp: {self.timestamp}, event_type: {self.event_type}"

def create_event(timestamp: datetime.datetime, payload: rdflib.Graph, event_type: str):
    e = Event()
    e.timestamp = timestamp
    e.payload = payload.serialize(format="json-ld")
    e.event_type = event_type

class EventStationAssociation(Base):
    """
    ORM mapper for associating an Event with an entity document
    """

    __tablename__ = "eventsAssociation"

    # id of the event
    event_id = sqlalchemy.Column(sqlalchemy.Integer, sqlalchemy.ForeignKey(Event.id), primary_key=True)

    # iri of the entity
    entity_document_iri = sqlalchemy.Column(sqlalchemy.String(length=255), primary_key=True)

    # type of association
    association_property_class = sqlalchemy.Column(sqlalchemy.String(length=255))