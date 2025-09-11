from sqlalchemy import ForeignKey, Column, Integer, String, LargeBinary
from sqlalchemy.orm import registry, relationship
from .tokenGen import length_of_secret

mapper_registry = registry()
Base = mapper_registry.generate_base()
class ResourceIRI(Base):
    """ORM mapper for storing a relationship between an iri describing a 
    resource with its secret keys"""
    __tablename__ = 'station_iris'

    # id for database entry
    id = Column(Integer, primary_key=True)
    # the iri of the resource (station, train...)
    iri = Column(String, unique=True)
    # the secret key
    secret_key = Column(LargeBinary, nullable=True)

    tokens = relationship("Token", back_populates="iri")

    def __repr__(self) -> str:
        return f"IRI: {self.iri} PK: {self.secret_key}"


class Token(Base):
    """ORM mapper for storing one-time use secrets for updating the secret keys."""
    __tablename__ = 'tokens'


    token = Column(String(length_of_secret))
    iri_id = Column(Integer, ForeignKey("station_iris.id"), primary_key=True)

    iri = relationship("ResourceIRI", back_populates="tokens")