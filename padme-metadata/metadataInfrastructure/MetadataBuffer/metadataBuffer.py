"""File containing the metadata buffer class"""
from typing import Type
from functools import reduce
from typing import List, Optional
from queue import SimpleQueue, Queue

import rdflib
from rdflib import URIRef

from ..GraphContainer import GraphContainer

class MetadataContainerBuffer():
    """Buffer for storing metadata container."""
    
    def __init__(self, c_queue: Queue = SimpleQueue(), guard_authority: URIRef = None) -> None:
        """
        Creates a new container buffer based on the given queue.
        If a guard authority is provided, only container with the guard are provided.
        """
        self._queue = c_queue
        self._guard_authority_provided = guard_authority != None
        self._guard_authority = guard_authority

    def _check_authority(self, c: GraphContainer) -> bool:
        """
        Check if a container has the buffer specific authority.
        Arguments:
            c: The container to check
        """
        return c.authority() is not None and c.authority() == self._guard_authority

    def add(self, c: GraphContainer) -> bool:
        """
        Add a container to the buffer.
        Arguments:
            c: The container.
        """
        if self._guard_authority_provided and not self._check_authority(c):
            return False
        self._queue.put(c)
    
    def get(self, block=False) -> Optional[GraphContainer]:
        """
        Returns the first element from the buffer.
        Arguments:
            block: block argument forwarded to queue.get(). Blocks if queue is empty.
        """
        self._queue.get(block=block)
    
    def flush_to_list(self) -> List[GraphContainer]:
        l = []
        while not self._queue.empty():
            l.append(self._queue.get())
        return l

    def reduce_to_container(self) -> GraphContainer:
        """
        Reduces all stored container to one. 
        If guarded authority is enabled, it is maintained into the new container.
        """
        if self._queue.empty():
            return None
        else:
            return reduce(lambda x,y: x + y, self.flush_to_list())


