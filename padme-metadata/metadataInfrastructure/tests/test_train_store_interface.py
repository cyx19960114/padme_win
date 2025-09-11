import base64
from unittest import TestCase
from unittest.mock import Mock

import rdflib
from rdflib import Graph
from tornado.testing import AsyncHTTPTestCase
from tornado.web import Application, HTTPError

from ..TrainStoreHTTPInterface import SecretKeyHandler, StationFeedHandler, SecretKeyHandlerConfiguration

class TestPublicKeyHandler(AsyncHTTPTestCase):
    def get_app(self):
        self.station_manager = Mock()
        self.graph_model = Mock()
        return Application([("/(.*)", SecretKeyHandler, dict(configuration=SecretKeyHandlerConfiguration(self.station_manager)))])

    def test_setting_public_key(self):
        test_public_key = b"45621354"
        test_token = "123456789"
        self.station_manager.set_secret_key = Mock(
            return_value=test_public_key)
        resp = self.fetch(
            f"/?token={test_token}", raise_error=True, method="POST", body=test_public_key)
        self.assertEqual(resp.code, 200)
        self.station_manager.set_secret_key.assert_called_once_with(
            test_token, test_public_key)


class TestMethodsStationFeedHandler(TestCase):
    def setUp(self) -> None:
        self.skipTest("Feature will be implemented differently")
        StationFeedHandler.__dir__
        self.mock_handler = Mock(spec=["station_manager", "signed_g"])
        return super().setUp()

    def test_check_signature_valid(self):
        self.mock_handler.station_manager.get_secret_key = Mock(
            return_value=b"secretkey")
        self.mock_handler.signed_g.verify = Mock(return_value=True)
        self.mock_handler.station_hint = "test"
        try:
            res = StationFeedHandler.check_signature(self.mock_handler)
        except Exception as e:
            self.fail("Unexpected exception during signature check: " + str(e))

    def test_check_signature_no_secret_key(self):
        self.mock_handler.station_manager.get_secret_key = Mock(
            return_value=None)
        self.mock_handler.signed_g.verify = Mock(return_value=True)
        self.mock_handler.station_hint = "test"
        with self.assertRaises(HTTPError) as e:
            res = StationFeedHandler.check_signature(self.mock_handler)
        self.assertEqual(e.exception.status_code, 404)

    def test_check_signature_invalid(self):
        self.mock_handler.station_manager.get_secret_key = Mock(
            return_value=b"secretkey")
        self.mock_handler.signed_g.verify = Mock(return_value=False)
        self.mock_handler.station_hint = "test"
        with self.assertRaises(HTTPError) as e:
            res = StationFeedHandler.check_signature(self.mock_handler)
        self.assertEqual(e.exception.status_code, 403)

    def test_shacl_validitiy_valid(self):
        self.mock_handler.shacl_validation_method = Mock(
            return_value=(True, None, ""))
        self.mock_handler.shacl_graph = None
        self.mock_handler.signed_g.graph = Mock(return_value=None)
        # desired behavior: nothing happens
        StationFeedHandler.check_shacl_validity(self.mock_handler)

    def test_shacl_validitiy_invalid(self):
        self.mock_handler.shacl_validation_method = Mock(
            return_value=(False, None, ""))
        self.mock_handler.shacl_graph = None
        self.mock_handler.signed_g.graph = Mock(return_value=None)
        # desired behavior: nothing happens
        with self.assertRaises(HTTPError) as e:
            StationFeedHandler.check_shacl_validity(self.mock_handler)
        self.assertEqual(e.exception.status_code, 403)


class TestStationFeedHandlerServer(AsyncHTTPTestCase):

    def get_app(self) -> Application:
        from .graphs_examples import example_station_dummy_graph, PHT_TEST_REGISTRY
        """Create application, listen to everything"""
        self.key = b"testsecretkey"
        self.station_manager = Mock()
        self.station_manager.get_secret_key = Mock(return_value=self.key)
        self.pgv = Mock()
        self.pgv.check_resource_validation = Mock(return_value=(True, False))
        self.iri = str(PHT_TEST_REGISTRY["station1"])

        self.graph_model = Mock()
        self.graph_model.add_feed_from_entity = Mock()
        

        # we do not test the shacl checking capabilities
        # if the graph does not contain constrains, everything passes
        self.shacl_graph = rdflib.Graph()
        self.test_graph = example_station_dummy_graph

        return Application([
            ("/(.*)", StationFeedHandler,  dict(station_manager=self.station_manager,
             graph_model=self.graph_model, pgv=self.pgv, shacl_graph=self.shacl_graph))
        ])

    def test_valid_metadata_feed_request_integration(self):
        from ..GraphContainer import GraphContainer
        self.skipTest("Feature will be implemented differently")
        # we sign a container

        container = GraphContainer(self.test_graph)

        signature = container.sign(self.key, serialization_format="json-ld")
        serialized = container.serialized()

        # the test request
        self.fetch("/?station=" + self.iri + "&signature=" + base64.urlsafe_b64encode(signature).decode(),
                   method="POST", headers={"Content-Type": "application/ld+json"}, body=serialized, raise_error=True)
