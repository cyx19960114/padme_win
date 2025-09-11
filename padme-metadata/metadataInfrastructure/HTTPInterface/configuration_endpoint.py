from tornado import escape, web, routing
from tornado.web import HTTPError

from metadataInfrastructure.Configuration.Configuration import GatewayConfiguration, StationIriConfiguration
from metadataInfrastructure.PHTMetadataGenerator import DynamicMetadataGenerator

from metadataInfrastructure.Gateway import EventFilter
from metadataInfrastructure.SchemaUtil import event_classes

from .SHACLParser import parseIntoDescriptionList


class ConfigurationHandler(web.RequestHandler):
    """This handler provides and interface for configuring the metadata provider via http."""

    def initialize(self, dynamic_generator: DynamicMetadataGenerator, station_iri_config: StationIriConfiguration):
        self.generator = dynamic_generator
        self.config = station_iri_config

    def post(self, url_args=None):
        if self.config.set_via_env:
            raise HTTPError(400, "tried to set identifier while it was setted via env", reason="Cannot set config hard-coded identifier")
        self.args = escape.json_decode(self.request.body)
        if "stationIdentifier" in self.args:
            self.config.iri = self.args["stationIdentifier"]
            self.config.save()
        self.set_status(200)

    def get(self, url_args=None):
        self.write({
            "stationIdentifier": str(self.config.iri),
            "ready": bool(self.generator.ready())
        })

class SecretKeyHandler(web.RequestHandler):
    """
    Request Handler for setting the secret Key.
    Does not provide a getter to keep the secret, well, secret.
    We do not use json here, because then we can relinquish on base-64 encoding of the
    bytes of the secret key.
    """

    def initialize(self, gateway_config: GatewayConfiguration):
        self.config = gateway_config

    def post(self, url_args=None):
        """
        Setter for secret key
        """
        secret_key = self.request.body
        self.config.secret_key = secret_key
        self.config.save()



class ListEditHandler(web.RequestHandler):
    """This handler is responsible for the http endpoints which allows the user to edit the filter list. For this it provides a POST and a GET method."""

    def initialize(self, event_filter: EventFilter):
        self._event_filter = event_filter

    def post(self, url_args=None):
        """Overwrite the triple filter list. Expected is a JSON body with optional: list: List[str] and useAllowList: boolean"""
        self.args = escape.json_decode(self.request.body)
        if "list" in self.args:
            if isinstance(self.args["list"], list):
                self._event_filter.setList(self.args["list"])
            else:
                self.send_error(400)
                return
        if "useAllowList" in self.args:
            self._event_filter.setUseAllowList(bool(self.args["useAllowList"]))

    def get(self, url_args=None):
        resDict = dict()
        resDict["list"] = self._event_filter.getList()
        resDict["useAllowList"] = self._event_filter.getUseAllowList()
        self.write(resDict)
        self.flush()


class SchemaDescriptionHandler(web.RequestHandler):
    """This handler provides a descirption of the schema, used in the metadata editor to choose triples to be blocked/allowed"""

    def get(self, url_args=None):
        event_cl = event_classes()
        self.write({"event_classes": event_cl})


def create_app(dynamic_generator: DynamicMetadataGenerator, event_filter: EventFilter, station_iri_config: StationIriConfiguration, gateway_config: GatewayConfiguration):
    return web.Application([
        (r'(.*)/general', ConfigurationHandler, dict(dynamic_generator=dynamic_generator, station_iri_config=station_iri_config)),
        (r'(.*)/filter', ListEditHandler, dict(event_filter=event_filter)),
        (r'(.*)/descriptionList', SchemaDescriptionHandler),
        (r'(.*)/secret', SecretKeyHandler, dict(gateway_config=gateway_config))
    ])
