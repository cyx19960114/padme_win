from typing import Annotated

from fastapi import Depends
from rdflib import Graph
import redis.asyncio as redis

from app.core.config import settings
from app.core.database import graph_singleton
from app.core.logger import logger


async def get_redis():
    """
    Redis connection dependency that automatically closes the connection
    when the request is complete.
    """
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        db=settings.REDIS_DB,
        decode_responses=True,  # Auto-decode responses to strings
        health_check_interval=30,  # Check connection health every 30 seconds
    )
    try:
        # Check connection
        logger.info(f"Ping successful: {await redis_client.ping()}")
        yield redis_client
    finally:
        # Close connection when done
        await redis_client.close()


GraphDep = Annotated[Graph, Depends(graph_singleton.get_graph)]
RedisDep = Annotated[redis.Redis, Depends(get_redis)]
