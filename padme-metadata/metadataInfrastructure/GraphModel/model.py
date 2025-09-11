"""Source code for model class"""

import logging
from typing import *
from os import PathLike
from rdflib import Dataset, Graph, URIRef, ConjunctiveGraph
from ..GraphContainer import GraphContainer

logger = logging.getLogger("Graph Model")
logger.setLevel(logging.INFO)


class GraphModel:
    """This model stores rdf graphs of metadata of entities with the persistence functionality of rdflib.
    The store is partitioned w.r.t. the different entities in the PHT Architecture."""

    def __init__(self, dataset: ConjunctiveGraph) -> None:
        self._dataset = dataset

    def add_feed_from_entity(self, graph_container: GraphContainer, entity: URIRef):
        """Update with graph send by an architectural entity."""
        entity_graph = self._dataset.get_context(entity)
        count = 0
        for triple in graph_container.graph():
            entity_graph.add(triple)
            count += 1

        logger.info(f"{count} triples added to graph {str(entity)}")

    def get_context_graph(self, context: str):
        """
        Returns the context graph for the given context
        """
        return self._dataset.get_context(context)

    def graph_exist(self, context: str):
        """
        Checks whether a graph for the given context exists
        """
        return next(self._dataset.triples((None, None, None), context=context), None) is not None

    def set_context_graph(self, context: str, graph):
        """
        Sets the given graph as context graph for the specified context.
        Replaces the graph if it already exists
        """
        if self.graph_exist(context):
            print("Graph exists, delete!")
            self._dataset.remove_context(self._dataset.get_context(context))
        cg = self._dataset.get_context(context)
        cg += graph

    def query(self, query, on_entity: str = None):
        """Query the Graphmodel. If an entity is specified, query the graph of this entity.
        If no entity is specified, query on whole store."""
        if on_entity is None:
            return self._dataset.query(query, processor="sparql")
        else:
            return self._dataset.get_context(on_entity).query(query, processor="sparql")

    @classmethod
    def with_berkleydb(cls, path: PathLike, create=True):
        """Create a GraphModel instance with a BerkeleyDB at the given path.
        path: The Path of the database
        create: Create new database if it does not exist"""
        d = ConjunctiveGraph(store="BerkeleyDB")
        d.open(path, create=create)
        gm = GraphModel(d)
        return gm

    @classmethod
    def with_sql(cls, url: str, create=True):
        """Create a GraphModel instance with the given sql database as a backend.
        It uses the SQLAlchemy plugin and hence supports all databases which it supports.
        url: The url of the database containing all information
        create: Create new database if it does not exist.

        For testing purposes, using sqlite in memory is a good way: url="sqlite://"
        """
        d = ConjunctiveGraph(store="SQLAlchemy")
        d.open(url, create=create)
        gm = GraphModel(d)
        return gm