import typing

from .resource_list import ResourceList
from ..GraphContainer import EventGraphContainer
from ..Configuration import EventFilterConfiguration



class EventFilter:
    def __init__(self, configuration: EventFilterConfiguration) -> None:
        """
        Creates an EventFilter
        args:
            event_list: the list to use either as block or allow list, containing iris of events
            is_allow_list: whether the list should be treated as an allow list, blocking all events not in this list or as a block list,
                blocking all event in this list and allowing the rest
        """
        self._config = configuration
        self._list = ResourceList(configuration.list)

    def is_allowed(self, container: EventGraphContainer) -> bool:
        """
        Returns true if the event is allowed, false if not.
        """
        contains = str(container.get_event_class()) in self._config.list
        if self._config.use_as_allow_list:
            return contains
        else: 
            return not contains


    def setList(self, filterList: typing.Iterable[str]):
        self._list = ResourceList(filterList)
        self._config.list = list(filterList)
        self._config.save()

    def getList(self) -> typing.List[str]:
        return self._list.getResources()

    def setUseAllowList(self, useAllowList: bool):
        self._config.use_as_allow_list = useAllowList
        self._config.save()

    def getUseAllowList(self) -> bool:
        return self._config.use_as_allow_list