"""Contains implementaiton of a container for graphs."""
import typing
from collections import defaultdict
from copy import deepcopy
from hmac import HMAC, compare_digest

import rdflib
from rdflib import URIRef
from rdflib.namespace import RDF

from .const import HASH_METHOD


class GraphContainer():
    """A graph container with a signed hash and an optional authority. The graph is immutable and the serialized version is also stored. 
    This is because we need to be able to create a consistent hash which is only possible with a serialized version.
    When sending a signed graph over the network u also need to be able to have a consistent serialized version.
    """

    def __init__(self, g: rdflib.Graph, authority: typing.Union[str, URIRef] = None, signature: bytes = None, serialized: str = None) -> None:
        """Create a SignedGraphContainer with the given graph and optional with the given signature and serialization.
        The serialization and signature is used to validate the graph if needed.
        For a repeatable hash calculation it is necessary that the serialization is consistent,
        thats why it is additionally stored in this container.
        The serialization is always stored as a string."""

        assert g is not None, "Cannot container None"
        self._graph = g
        self._authority = URIRef(authority) if authority is not None else None
        self._signature = signature
        self._serialized = serialized
        self._verified = False

    def graph(self):
        """Returns copy of graph"""
        return deepcopy(self._graph)

    def serialized(self):
        """Return serialized representation"""
        return self._serialized

    def serialize(self, serialization_format="ttl", **kwargs):
        """Serialize the graph. If a serialization is stored, it is overwritten."""
        self._serialized = self._graph.serialize(
            destination=None, format=serialization_format, **kwargs)

    def sign(self, secret_key: bytes, serialization_format="ttl") -> bytes:
        """Serialize the graph if no serialization is stored and sign it by creating a HMAC keyed hash."""
        if self._serialized is None:
            self.serialize(serialization_format=serialization_format)
        # create hmac object, for this utf8 encode the serialization
        hmac = HMAC(secret_key, bytes(self._serialized,
                    "utf-8"), digestmod=HASH_METHOD)
        self._signature = hmac.digest()
        return self._signature

    def verify(self, secret_key: bytes) -> bool:
        """Verify the given signature of the graph."""
        assert self._signature is not None, "Signature cannot be None for verification"
        assert self._serialized is not None, "Signature cannot be checked without given serialization."
        # create hmac object, for this utf8 encode the serialization
        hmac = HMAC(secret_key, bytes(self._serialized,
                    "utf-8"), digestmod=HASH_METHOD)
        digest = hmac.digest()
        return compare_digest(digest, self._signature)

    def graph(self):
        return self._graph

    def authority(self):
        """
        Returns the authority of the graph.
        """
        return self._authority

    def __add__(self, o):
        if not isinstance(o, GraphContainer):
            raise NotImplemented()
        new_authority = self.authority() if self.authority() == o.authority() else None
        return GraphContainer(self._graph + o.graph(), authority=new_authority, signature=None, serialized=None)

    def __radd__(self, o):
        return self.__add__(o)

class EventGraphContainer(GraphContainer):

    def __init__(self, g: rdflib.Graph, authority: typing.Union[str, URIRef] = None, signature: bytes = None, serialized: str = None, event_iri: URIRef = None) -> None:
        self._event_iri = event_iri
        super().__init__(g, authority, signature, serialized)

    def get_event_iri(self) -> URIRef:
        return self._event_iri

    def get_event_class(self):
        return self._graph.value(self.get_event_iri(), RDF.type)

class PrefixGuardValidator:
    """Container for a Graph."""

    def __init__(self, guarded_prefix: str) -> None:
        self._guarded_prefix = guarded_prefix

    def _rec_check_connections(self, iri: rdflib.URIRef, connections, visited=None):
        """
        Recursive method for checking connections.
        Params:
            iri: the iri to check
            connections: A dict containing for each iri the connections
            visited: A set of already visited iris used so no iri is processed twice
        The steps performed are:
            1. Return if the iri was already visited
            2. Add the iri to the visited set, to prevent endless recursion
            3. call the method on all connected iris
        """
        if visited == None:
            visited = set()
        if iri in visited:
            return
        visited.add(iri)
        for con in connections[iri]:
            # if not trigger recursion for this iri, if not already visited
            self._rec_check_connections(con, connections, visited)

    def check_resource_validation(self, container: GraphContainer) -> typing.Tuple[bool, bool]:
        """
        Check the graph validation w.r.t. the expresivity of the startpoint and the prefix-
        A graph is valid if there is no IRI in the graph with the given prefix besides the starting point and is fully connected.
        This prevents expression of information about unauthorized resources.
        As a starting point for reachability, the authority of the graph is used.
        """

        prefix = self._guarded_prefix
        startpoint = container.authority()

        connections = defaultdict(lambda: [])

        

        contains_prefix = False
        for (i_s, _, i_o) in container.graph():
            connections[i_o].append(i_s)
            connections[i_s].append(i_o)
            contains_prefix = contains_prefix or self._check_prefix(
                prefix, i_s) and not i_s == startpoint
            contains_prefix = contains_prefix or self._check_prefix(
                prefix, i_o) and not i_o == startpoint

        connected_component = True
        visited = set()
        # create list from iterator, since size of keys can change
        # if we access in the default dict for a new key
        self._rec_check_connections(startpoint, connections, visited=visited)

        for k in connections.keys():
            connected_component = connected_component and (k in visited)
        return (connected_component, contains_prefix)

    def _check_prefix(self, prefix: str, uri: rdflib.URIRef):
        """
        Checks whether a URI has a specific prefix.
        """
        return len(str(uri)) >= len(prefix) and str(uri)[:len(prefix)] == prefix

    