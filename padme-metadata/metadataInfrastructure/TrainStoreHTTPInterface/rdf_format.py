"""
Contains util code for rdf formats
"""

from enum import Enum, auto
class RDFFormat(Enum):
    TURTLE = auto()
    JSONLD = auto()

    def content_header(self):
        if self.value == RDFFormat.TURTLE.value:
            return "text/turtle"
        if self.value == RDFFormat.JSONLD.value:
            return "application/ld+json"

    def __str__(self) -> str:
        if self.value == RDFFormat.TURTLE.value:
            return "ttl"
        elif self.value == RDFFormat.JSONLD.value:
            return "json-ld"
        return "UNDEFINED"