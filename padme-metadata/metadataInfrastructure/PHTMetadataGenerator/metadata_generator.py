from typing import Union
import rdflib

class Metadata_Generator:
    def convert_to_URI(self, uri: Union[str, rdflib.URIRef]) -> rdflib.URIRef:
        if isinstance(uri, rdflib.URIRef):
            return uri
        else: 
            rdflib.URIRef(uri)

    def create_graph(self) -> rdflib.Graph:
        return rdflib.Graph()
