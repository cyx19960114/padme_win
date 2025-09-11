"""
This module contains the secret key and enrollment handlers.
"""
import json
import logging
from typing import Awaitable, List, Optional
from dataclasses import dataclass, field

from tornado import web

from ..StationManager import StationManager, ResourceIRIConflict, MissingSecret

def get_document_containing(entity_iri: str):
    """
    Returns the document that would hold this entity iri by subtracting the anchor suffix
    """
    index_of_anchor = entity_iri.find('#')
    return entity_iri[:index_of_anchor] if index_of_anchor > -1 else entity_iri

@dataclass
class SecretKeyHandlerConfiguration:
    station_manager: StationManager
    registry_keys: List[str] = field(default_factory=list)

class SecretKeyHandler(web.RequestHandler):
    """Handler for setting/updating public keys."""

    def initialize(self, configuration: SecretKeyHandlerConfiguration):
        self.station_manager = configuration.station_manager

    def post(self, *extra_args):
        token = self.get_query_argument("token", None)
        if token is None:
            raise web.HTTPError(
                400, "User did not provide secret", reason="No secret provided")
            return

        secret_key = self.request.body
        if secret_key is None:
            raise web.HTTPError(
                400, "User did not provide public key", reason="No public key provided")

        try:
            self.station_manager.set_secret_key(token, secret_key)
        except MissingSecret:
            raise web.HTTPError(
                400, log_message="Invalid secret or public key not found", reason="Invalid arguments")
        else:
            self.station_manager.delete_secret(token)

        self.set_status(200)


class EnrollmentHandler(web.RequestHandler):
    """Handler for creating new one-time use tokens/secrets for stations.
    The access is restriced by a simple list of registry tokens.
    The request body is a json document containing the url (key uri:) of the station
    and the stations registry key.
    If successful, the response will contain a json with the secret"""

    def initialize(self, configuration: SecretKeyHandlerConfiguration) -> None:
        self.station_manager = configuration.station_manager
        self.registry_keys = configuration.registry_keys
        self.parsed_body: any = None

    def prepare(self) -> Optional[Awaitable[None]]:
        try:
            self.parsed_body = json.loads(self.request.body)
        except json.decoder.JSONDecodeError:
            raise web.HTTPError(
                404, "Error while decoding json", reason="Invalid JSON")
        return super().prepare()

    def post(self, *extra_args):
        if "registry_key" not in self.parsed_body:
            raise web.HTTPError(400, "No registry key provided",
                                reason="No registry key provided")
        if "iri" not in self.parsed_body:
            raise web.HTTPError(400, "No station iri to enroll provided",
                                reason="No station iri provided")

        registry_key = str(self.parsed_body["registry_key"])
        station_url = self.parsed_body["iri"]
        # we enroll via the document url, since this allows more flexible querying without knowing the exact anchor
        document_url = get_document_containing(station_url)

        if registry_key not in self.registry_keys:
            raise web.HTTPError(403, "Invalid registry key",
                                reason="Invalid registry key")

        try:
            secret = self.station_manager.enroll_station(document_url)
            self.set_status(200)
            self.write(json.dumps({"secret": secret}))
        except ResourceIRIConflict as r:
            raise web.HTTPError(
                409, "IRI conflict", reason="IRI conflict in enrollment. Probably IRI already exist")


def create_app(configuration: SecretKeyHandlerConfiguration):
    """Create an application with the station feed handler."""
    return web.Application([
        (r"(.*)/secretkey", SecretKeyHandler,
         dict(configuration=configuration)),
        (r"(.*)/enroll", EnrollmentHandler,
         dict(configuration=configuration))
    ])
