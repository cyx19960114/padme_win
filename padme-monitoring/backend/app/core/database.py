from rdflib import Graph, Namespace
from rdflib_sqlalchemy.store import SQLAlchemy
from sqlalchemy.engine.url import URL

from app.core.config import settings
from app.core.logger import logger

DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=settings.DB_USERNAME,
    password=settings.DB_PASSWORD,
    host=settings.DB_URL_HOST,
    port=settings.DB_URL_PORT,
    database=settings.DB_URL_DATABASE,
)

PHT = Namespace("https://schema.padme-analytics.de/#")
TrainNS = Namespace(f"https://{settings.DOMAIN}/trains/")
StationNS = Namespace(f"https://{settings.DOMAIN}/stations/")
JobNS = Namespace(f"https://{settings.DOMAIN}/jobs/")
MemoryNS = Namespace(f"https://{settings.DOMAIN}/memory/")
CpuNS = Namespace(f"https://{settings.DOMAIN}/cpu/")
NetworkNS = Namespace(f"https://{settings.DOMAIN}/network/")


class RDFGraphSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RDFGraphSingleton, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        logger.info("Initializing the Graph Database")
        self.store = SQLAlchemy(configuration=DATABASE_URL)
        self.rdf_graph = Graph(self.store, identifier="rdf_store")
        self.rdf_graph.open(configuration=DATABASE_URL, create=True)
        logger.info("Successfully connected to the database")

    def get_graph(self) -> Graph:
        return self.rdf_graph

    def close_graph(self) -> None:
        logger.info("Closing database connection")
        self.rdf_graph.close()


# Singleton instance
graph_singleton = RDFGraphSingleton()
