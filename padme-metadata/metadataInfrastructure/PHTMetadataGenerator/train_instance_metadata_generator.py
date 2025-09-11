import rdflib
from typing import Union

from .metadata_generator import Metadata_Generator
from .const import pht_namespace

class Static_Train_Instance_Metadata_Generator(Metadata_Generator):
    def __init__(self) -> None:
        pass

    def instancing_pid(self, pid: Union[str, rdflib.URIRef]):
        """Returns Graph containing description that the given PID is a Train instance"""
        c_pid = self.convert_to_URI(pid)
        g = self.create_graph()
        g.add((c_pid, rdflib.namespace.RDF["type"],pht_namespace["TrainExecution"]))
        return g