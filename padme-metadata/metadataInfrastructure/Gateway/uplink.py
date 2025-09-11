import logging
import uuid
from base64 import urlsafe_b64encode
from tornado.httpclient import AsyncHTTPClient, HTTPError

from ..Configuration import GatewayConfiguration, StationIriConfiguration
from ..GraphContainer import GraphContainer, EventGraphContainer

logger = logging.getLogger("Uplink")


class UplinkInterface:
    async def send(self, gc: GraphContainer):
        pass

    async def ping(self) -> bool:
        pass


# TODO: Implement authorization


class SignedPostDataUpLink(UplinkInterface):

    def __init__(self, config: GatewayConfiguration, iri: StationIriConfiguration, http_method="POST"):
        self.endpoint = config.uplink_adress
        self._http_client = AsyncHTTPClient()
        self.skip_ping = not config.enable_healthcheck
        self._gw_config = config
        self._iri = iri
        self._http_method = http_method

        # stores if the last healthcheck was successful
        # if skipped, set to true
        self._last_healthcheck = self.skip_ping

    async def ping(self):
        """
        Ping the endpoint
        """
        logger.debug("healthcheck endpoint:" + str(self.endpoint))
        if self.skip_ping:
            logger.debug("healthcheck skipped of endpoint" +
                         str(self.endpoint))

        try:
            res = await self._http_client.fetch(self.endpoint, raise_error=True)
        except HTTPError as http_err:
            logger.critical("Could not healthcheck endpoint:" +
                            str(self.endpoint) + " Error:" + str(http_err))
            return False
        except Exception as err:
            logger.critical("Unexpected Error while healthchecking endpoint:" +
                            str(self.endpoint) + " Error:" + str(err))
            return False
        else:
            return True

    def _encode_signature(self, hash: bytes) -> str:
        return urlsafe_b64encode(hash).decode()

    def _create_url_with_params(self, event_iri: str, encoded_hash: str, incorporate_station_hint: bool = True):
        """
        The iri is created by adding the encoded hash and optionally the station hint to the event iri.
        The event iri contaings the anchor of the event, but it is automatically stripped away during the request.
        """
        station_hint_params = f"&station={self._iri.iri}" if incorporate_station_hint else ""
        # strip the anchor element from the event_iri and append the parameters, the anchor is not needed since it is droped by the requesz
        return event_iri[:event_iri.index("#")] + f"?signature={encoded_hash}" + station_hint_params

    def _valid_iri(self, event_iri: str):
        return event_iri[:len(self.endpoint)] == self.endpoint


    async def send(self, gc: GraphContainer):
        """
        Async send the graph container to the uplink.
        """
        if not isinstance(gc, EventGraphContainer):
            logger.warn("Uplink received Graph which is not an event")
            return
        assert isinstance(gc, EventGraphContainer)
        event_iri = gc.get_event_iri()
        if not self._valid_iri(event_iri):
            logger.warn("Event iri does not comply with the uplink iri.")
            return

        headers = {'Content-Type': 'application/ld+json'}
        logger.info("sending to endpoint:" + str(event_iri))
        gc.serialize(serialization_format="json-ld", indent=0)
        # generate encrypted hash for signing
        enc_hash = gc.sign(self._gw_config.secret_key)
        encoded_hash = self._encode_signature(enc_hash)

        full_url = self._create_url_with_params(event_iri, encoded_hash)
        data = gc.serialized()
        import json
        try:
            res = await self._http_client.fetch(full_url, raise_error=True, body=data, method=self._http_method, headers=headers)
        except HTTPError as http_err:
            logger.critical("Could not send to Endpoint:" + str(self.endpoint) + " Error:" + http_err.message)
            return False
        except Exception as err:
            logger.critical(
                "Unexpected Error while sending to Endpoint:" + str(self.endpoint))
            return False
        else:
            logger.info("Data sent to endpoint:" + str(self.endpoint))
            return True
