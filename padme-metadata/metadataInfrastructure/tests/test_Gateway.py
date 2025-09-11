import unittest
from unittest.mock import Mock
import rdflib
from sqlalchemy import true
from base64 import urlsafe_b64decode

from metadataInfrastructure.Gateway import Gateway
from metadataInfrastructure.Gateway.uplink import SignedPostDataUpLink
from metadataInfrastructure.Configuration.Configuration import GatewayConfiguration, StationIriConfiguration


def loadRDFData(data):
    g = rdflib.Graph()
    g.parse(data=data, format='ttl')
    return g


class MockBuffer:
    def __init__(self):
        self.stack = []

    def add(self, g):
        self.stack.append(g)

    def flushToGraph(self):
        return self.stack


class MockUplink:
    def __init__(self, pingvalue):
        self.sendStack = []
        self.pingvalue = pingvalue

    def send(self, g):
        self.sendStack.append(g)

    def ping(self):
        return self.pingvalue


class GatewayTest(unittest.TestCase):

    async def test_flush_multipleuplinks(self):
        """
        Test flush to remote.
        For this, create mock container which is returned by the reduction method of
        the underlying buffer.
        Compare the send stack of uplink mock with the mock container.
        """
        mb = MockBuffer()
        mu = MockUplink(True)

        mock_container = Mock()
        mb.reduce_to_container = Mock(return_value=mock_container)
        gw = Gateway(mb, mu)
        await gw.flushToRemote()
        self.assertEqual(mu.sendStack, [mock_container])


class MockRespond:
    def __init__(self, raiseError, exceptionToRaise=None):
        self.raiseError = raiseError
        self.exceptionToRaise = exceptionToRaise

    def raise_for_status(self):
        if self.raiseError:
            raise self.exceptionToRaise


class MockRequests:
    def __init__(self):
        self.headerStack = []
        self.postDataStack = []
        self.endpointStack = []
        # this stack is populated by the test
        self.respondStack = []
        self.endpointStack = []
    # mock post method

    def post(self, endpoint, data, headers=None):
        if headers:
            self.headerStack.append(headers)
        self.dataStack.append(data)
        self.endpointStack.append(endpoint)
        return self.respondStack.pop(0)
    # mock get method

    def get(self, endpoint):
        return self.respondStack.pop(0)

# test the post data uplink class


class PostDataUpLinkTest(unittest.TestCase):
    def setUp(self) -> None:
        self.iri = "http://station1.example.com"
        self.test_event_iri = "http://events.example.org/1234#e"
        self.iri_c = StationIriConfiguration(False, self.iri)
        self.sparql_adress = "http://example.org/feed"
        self.gateway_c = GatewayConfiguration(False, self.sparql_adress)
        
    def test_get_full_url_with_params(self):
        test_obj = SignedPostDataUpLink(self.gateway_c, self.iri_c)
        self.assertEqual(test_obj._create_url_with_params(self.test_event_iri, "testhash", true), "http://events.example.org/1234" + "?signature=testhash&station=" + self.iri_c.iri)

        
    def test_encode_hash(self):
        test_obj = SignedPostDataUpLink(self.gateway_c, self.iri_c)
        es = test_obj._encode_signature(b"testhash")
        self.assertEqual(b"testhash", urlsafe_b64decode(es))


if __name__ == '__main__':
    print("Exceptions are tested, ignore Critical & Errors if tests are ok.")
    unittest.main()
