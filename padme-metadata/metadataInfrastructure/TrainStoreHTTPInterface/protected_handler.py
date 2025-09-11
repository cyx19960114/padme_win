"""
Implements abstract Protected Handler super class
"""

import typing
import base64
import rdflib
import tornado.web as web

from .rdf_format import RDFFormat

from ..StationManager import StationManager
from ..GraphContainer import GraphContainer

class ProtectedWithSignatureHandler(web.RequestHandler):
    """
    Abstract handler which implements protection and signature functions.
    """

    def initialize(self, station_manager: typing.Optional[StationManager]=None):
        self._station_manager = station_manager

    def decode_signature(self):
        """decode the url-safe base64 encoded signature. Throw descriptive http error if none is provided."""
        # signature is base 64 encoded
        base64_signature = self.get_query_argument("signature", None)
        if base64_signature is None:
            raise web.HTTPError(
                400, "No signature provided", reason="No signature provided"
            )
        return base64.urlsafe_b64decode(base64_signature)

    def parse_to_graph(self, data):
        """Parse to graph, throw http error if something went wrong"""
        g = rdflib.Graph()
        try:
            g.parse(data=data, format=str(self.format))
        except Exception as e:
            raise web.HTTPError(
                400, "Error while parsing graph:" + str(e), reason="Invalid Graph or format")
        return g

    def identify_format(self):
        """Identifiy Format"""
        # identify format:
        self.format: typing.Optional[RDFFormat] = None
        if "Content-Type" in self.request.headers:
            if RDFFormat.TURTLE.content_header() in self.request.headers.get_list("Content-Type"):
                self.format = RDFFormat.TURTLE
            elif RDFFormat.JSONLD.content_header() in self.request.headers.get_list("Content-Type"):
                self.format = RDFFormat.JSONLD
            else:
                raise web.HTTPError(
                    400, f"Unknown content-type", reason="Unsopported Content-Type Header"
                )
        else:
            raise web.HTTPError(
                400, "Missing Content-Type header", reason="Missing Content-Type Header entry"
            )

    def parse_body(self):
        """Parse the body of the request"""
        rdf_body = self.request.body
        g = self.parse_to_graph(rdf_body)
        signature = self.decode_signature()

        signed_g = GraphContainer(
            g, signature=signature, serialized=rdf_body.decode())

        return signed_g

    def get_key_for_entity(self, iri: str):
        """
        Gets the key for the entity identified with the given iri.
        Throws error if not found or entity invalid
        """
        secret_key = self._station_manager.get_secret_key(iri)
        if secret_key is None:
            raise web.HTTPError(
                404, "User provided secret key is not found for iri:" + iri, reason="Station not found")

        return secret_key

    def check_signature(self, against_key: bytes):
        """Guard method for checking signature, return None if valid
        Send error to client if not."""
        # get secret key
        signed_g = self.parse_body()
        valid = False
        try:
            valid = signed_g.verify(against_key)
        except Exception as e:
            raise e
            raise web.HTTPError(
                500, "Error while checking signature", "Signature check error"
            )

        if valid:
            return
        else:
            raise web.HTTPError(403, "Signature is not valid",
                                reason="Invalid signature")

