from typing import Iterable


class ResourceList:
    """This class wraps a set for easier use. It also allows easier implementation for perfomance tweaks
    or others things. We use a set because it seems to provide a speedup in contrast to the list and the lists used are not 
    changed very often, therefore the time to construct a set is neglicatable.
    See https://stackoverflow.com/questions/7571635/fastest-way-to-check-if-a-value-exists-in-a-list#7571665"""

    def __init__(self, resources: Iterable[str]=None):
        self.resources = set(resources or [])

    def setResources(self, list: Iterable[str]):
        self.resources = set(list)

    def getResources(self) -> list:
        return list(self.resources)

    def contains(self, resource: str):
        return resource in self.resources
    
    def __contains__(self, o: object):
        self.contains(o)
