"""
Provides EventManager class implementation
"""
import sqlalchemy
import sqlalchemy.orm as orm
import typing

from .mapper import Event, EventStationAssociation, mapper_registry

class EventManager:

    def __init__(self, session=None, engine=None) -> None:
        self.engine: any = engine
        self.session: any = session
    
    def initialize_connection(self, database_url):
        """Short hand setter for engine & session. Connects to given database url."""
        if self.engine == None:
            self.engine = sqlalchemy.create_engine(database_url, future=True, pool_pre_ping=True)
            self.session = orm.Session(self.engine, future=True)

    def get_events_associated_with_document(self, document_iri: str) -> typing.List[typing.Tuple[Event, EventStationAssociation]]:
        """
        Get events associated with the given document
        """
        print(f"get events associated with: {document_iri}")
        stmnt = sqlalchemy.select(Event, EventStationAssociation).join(EventStationAssociation).where(EventStationAssociation.entity_document_iri==document_iri)
        return list(map(lambda x: (x.Event, x.EventStationAssociation), self.session.execute(stmnt)))

    def add_event(self, event: Event):
        """
        Add the given event. Returns the id of the event created.
        """
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def get_event_data(self, event_iri: str) -> str:
        stmnt = sqlalchemy.select(Event).where(Event.event_iri==event_iri)
        res = self.session.scalars(stmnt).first()
        return None if res is None else res.payload

    def get_event_data_for_document(self, document_iri: str) -> str:
        stmnt = sqlalchemy.select(Event).where(Event.document_iri==document_iri)
        res = self.session.scalars(stmnt).first()
        return None if res is None else res.payload

    def associate_entity_with_event(self, event: Event, entity_document_iri: str, association_property_class: str):
        """
        Associate the given event with the given entity
        """
        esa = EventStationAssociation(entity_document_iri=entity_document_iri, event_id=event.id, association_property_class=association_property_class)
        self.session.add(esa)
        self.session.flush()

    def create_tables(self):
        """Create tables in the database."""
        if self.engine is not None:
            mapper_registry.metadata.create_all(self.engine, checkfirst=True)

    @classmethod
    def with_connection(cls, database_url: str):
        em = cls()
        em.initialize_connection(database_url)

        return em

    