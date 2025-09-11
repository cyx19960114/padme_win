"""This module contains the model for storing Graphs in persistent storage
For this, it relies on the storing capabilites of rdflibs Graph.
Graphs are stored in a multi-graph store, where the graph is identified by the architectural entity which provided the data.
For querying, interfaces which proxy sparql requests are provided."""
from .model import GraphModel