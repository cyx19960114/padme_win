"""
Source code for query handler
"""
from enum import Enum, auto
from tornado import web

from dataclasses import dataclass

from rdflib.query import Result

from ..GraphModel import GraphModel

from .station_feed import RDFFormat


class QueryFormat(Enum):
    SPARQL = auto()

    def __str__(self) -> str:
        if self.value == self.SPARQL.value:
            return "sparql"
        else:
            return "undefined"


@dataclass
class QueryHandlerConfiguration:
    graph_model: GraphModel

class QueryHandler(web.RequestHandler):
    """Handles Query Requests from clients. Supports not authorization or checking."""

    def initialize(self, configuration: QueryHandlerConfiguration):
        """Internal tornado intialization method"""
        self.graph_model = configuration.graph_model

    def get_station_restriction_iri(self):
        """Check if user provided a entitiy iri as a restriction."""
        iri = self.get_query_argument("entity", None)
        return iri

    def get_query_format(self):
        """
        Checks if the user provided an argument to specify the query type.
        Defaults to sparql.
        """
        qt = self.get_query_argument("qt", "sparql").lower()
        if qt == "sparql":
            return QueryFormat.SPARQL
        raise web.HTTPError(404, log_message="Bad query format",
                            reason="Invalid Query Format")

    def get_query(self):
        """
        Returns the body as string
        """
        return self.request.body.decode()

    def get_result_type(self):
        """
        Checks if the user provided a type for the result.
        Defaults to jsonld
        """
        rt = self.get_query_argument("rt", "json-ld")

        if rt == "json-ld":
            return RDFFormat.JSONLD
        if rt == "ttl":
            return RDFFormat.TURTLE
        raise web.HTTPError(
            404, log_message="Invalid return type", reason="Invalid Return Type")

    def write_sparql_select_result(self, result: Result):
        """
        Writes the Result of a SELECT query in an appropiate form.
        """
        self.write(result.serialize(format="json"))
        self.flush()
        return

    def write_sparql_result(self, result: Result):
        """
        Writes the results in an appropiate format.
        If the result is one of an ASK query, the responds is true or false
        If the result is one of a Construct, DESCRIBE query, the respon is in the user defined format.
        If the result is one of a SELECT query, the respond is 
        """
        if result.type == "ASK":
            self.write(str(bool(result)))

        if result.type in ["CONSTRUCT", "DESCRIBE"]:
            rt = self.get_result_type()
            self.write(result.serialize(None, format=str(rt)))

        if result.type == "SELECT":
            self.write_sparql_select_result(result)

        self.flush()

    def write_result(self, result: Result):
        if self.type == QueryFormat.SPARQL:
            self.write_sparql_result(result)

    def post(self, *extra_args):

        iri = self.get_station_restriction_iri()
        query = self.get_query()
        self.type = self.get_query_format()

        r = self.graph_model.query(query, iri)

        self.write_result(r)


def get_app(configuration: QueryHandlerConfiguration):
    return web.Application([
        (r"(.*)", QueryHandler, dict(configuration=configuration))
    ])