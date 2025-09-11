import logging
import sys

from app.core.config import settings
from uvicorn.logging import DefaultFormatter


IS_DEVELOPMENT_ENV = settings.ENVIRONMENT == "local"
FORMAT: str = "%(levelprefix)s [%(asctime)s] - %(message)s"

# Create Logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG if IS_DEVELOPMENT_ENV else logging.INFO)


# Console Stream Handler
stream_handler = logging.StreamHandler(sys.stdout)
log_formatter = DefaultFormatter(FORMAT)

stream_handler.setFormatter(log_formatter)
logger.addHandler(stream_handler)
