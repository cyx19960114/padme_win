from ..MetadataBuffer import MetadataContainerBuffer
from ..GraphContainer import GraphContainer
from .event_filter import EventFilter
from .uplink import UplinkInterface
from typing import Optional
import logging
from queue import SimpleQueue

logger = logging.getLogger("Gateway")


class Gateway:
    def __init__(self, buffer: MetadataContainerBuffer, uplink: UplinkInterface):
        self.buffer = buffer
        self.filter: Optional[EventFilter] = None
        self.uplink = uplink

    async def flushToRemote(self):
        assert self.uplink is not None, "cannot send to undefined uplink"
        logger.debug("Start sending buffered metadata to uplink...")
        for container in self.buffer.flush_to_list():
            if self.filter is not None and self.filter.is_allowed(container):
                await self.uplink.send(container) 

    def setUplink(self, uplink: UplinkInterface):
        assert isinstance(uplink, UplinkInterface)
        self.uplink = uplink

    def setFilter(self, filter: EventFilter):
        assert isinstance(filter, EventFilter)
        self.filter = filter

