import rdflib
from rdflib.namespace import RDFS

from functools import lru_cache

SCHEMA_URL = "https://schema.padme-analytics.de/1_0.ttl"
PHT = rdflib.Namespace("http://schema.padme-analytics.de#")

@lru_cache()
def get_schema() -> rdflib.Graph:
    g = rdflib.Graph()
    g.parse(source=SCHEMA_URL, format="ttl")
    print("Downloaded schema...")
    return g

def add_pht_namespace(graph: rdflib.Graph):
    graph.namespace_manager.bind("pht", PHT)

def get_namespaced_graph():
    g = rdflib.Graph()
    add_pht_namespace(g)
    return g

@lru_cache()
def event_classes():
    schema = get_schema()
    return set(map(lambda x: str(x), schema.transitive_subjects(RDFS.subClassOf, PHT["TripEvent"])))