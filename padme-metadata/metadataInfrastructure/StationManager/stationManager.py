from typing import Optional
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from .tokenGen import generate_token
from .mapper import mapper_registry, ResourceIRI, Token

class ResourceIRIConflict(Exception):
    """Indicates that there is a conflict for ResourcesIRIs"""
    pass

class MissingSecret(Exception):
    """Indicates a Missing one-time Secret used for setting the secret key"""
    pass

class StationManager:
    """Class for persistent management of Stations. Should be used as singleton."""

    def __init__(self) -> None:
        self.engine: any = None
        self.session: any = None
        # the generator which returns a new sufficient-random token
        # used to ease testing
        self._token_generator = generate_token

    def initialize_connection(self, database_url):
        """Short hand setter for engine & session. Connects to given database url."""
        if self.engine == None:
            """
            We overwrite the json serializer/parser since we do not want to serialize at insert-time but rather at creation time of the mapper objects,
            since we use the serialization function to json ld from rdflib at creation time.
            """
            self.engine = create_engine(database_url, future=True, json_serializer=lambda x: x, json_deserializer=lambda x: x, pool_pre_ping=True)
            self.session = Session(self.engine, future=True)

    def find_iri(self, iri: str) -> Optional[ResourceIRI]:
        return self.session.query(ResourceIRI).filter(ResourceIRI.iri == iri).first()

    def enroll_station(self, station_iri: str) -> Optional[str]:
        """Enroll a station and return the secret token for this station."""
        if self.session == None:
            return None
        
        if self.find_iri(station_iri) != None:
            raise ResourceIRIConflict()
        new_station = ResourceIRI(id=None, iri=station_iri, secret_key=None)

        # generate the textual secret token
        generated_token = self._token_generator()

        # generate the token orm mapper object
        new_token = Token(iri_id=None, token=generated_token)
        new_station.tokens = [new_token]

        self.session.add(new_station)
        self.session.commit()

        return generated_token

    def set_secret_key(self, secret: str, secret_key: bytes) -> bytes:
        """Update a stations secret key using the given one-time secret. 
        Returns the new secret key if successful
        Returns None if one-time secret was not found."""
        assert self.session is not None, "Not ready, Session not initialized"

        station_iri: ResourceIRI = self.session.query(ResourceIRI).join(
            ResourceIRI.tokens).filter(Token.token == secret).first()
        if station_iri is not None:
            station_iri.secret_key = secret_key
            self.session.commit()
            return secret_key
        raise MissingSecret()

    def delete_secret(self, secret: str) -> bool:
        """Deletes secret token.
        Returns True if successful
        Returns False if not"""
        if self.session == None:
            return False
        token = self.session.query(Token).filter(Token.token == secret).first()
        if token is not None:
            self.session.delete(token)
            self.session.commit()
            return True

    def get_secret_key(self, station_iri: str) -> Optional[bytes]:
        """Get the secret key associate with the given station iri"""
        if self.session is None:
            return
        key = self.session.query(ResourceIRI.secret_key).filter(
            ResourceIRI.iri == station_iri).first()
        if key is None:
            return None
        return key.secret_key

    def create_tables(self):
        """Create tables in the database."""
        if self.engine is not None:
            mapper_registry.metadata.create_all(self.engine, checkfirst=True)

    @classmethod
    def with_connection(cls, database_url: str):
        sm = StationManager()
        sm.initialize_connection(database_url)

        return sm
