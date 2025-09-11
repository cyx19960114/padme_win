from email import header
import base64
import uuid

from unittest.mock import Mock
from tornado.web import Application
from tornado.testing import AsyncHTTPTestCase

from ..TrainStoreHTTPInterface.document_view import DocumentView, HTML_CONTENT_HEADER, DocumentViewConfiguration
from ..TrainStoreHTTPInterface.rdf_format import RDFFormat
from ..GraphContainer import GraphContainer
from .graphs_examples import example_station_dummy_graph

class Test_DocumentViewCompliance(AsyncHTTPTestCase):
    """
    Test Case for DocumentView
    """

    def set_up(self):
        """
        Custom set up
        """
        self._graph_model_mock = Mock()
        self._redirection_factory = lambda x: f"http://testval.example.org/{x}"
        self._document_prefix = "http://example.org/entities/" 

    def get_app(self):
        self.set_up()
        return Application([
            (r"/stations/(.*)", DocumentView, dict(configuration=DocumentViewConfiguration(self._graph_model_mock, self._document_prefix, self._redirection_factory)))
        ])

    def test_html_forward(self):
        """
        Test if automatic forwarding works as desired
        """
        station_id = str(uuid.uuid4())
        res = self.fetch(f"/stations/{station_id}#e", headers={"Content-Type": HTML_CONTENT_HEADER}, follow_redirects=False)
        self.assertEqual(res.code, 301)
        self.assertEqual(res.headers.get_list("Location")[0], self._redirection_factory(station_id))

    def test_entity_not_found(self):
        """
        Tests whether get on a not existing [entity/station] returns a 404
        """
        self.skipTest("Entity not found disabled to provide empty graphs with just the events")
        self._graph_model_mock.graph_exist = Mock(return_value=False)
        station_id = str(uuid.uuid4())
        res = self.fetch(f"/stations/{station_id}#e", headers={"Content-Type": RDFFormat.TURTLE.content_header()}, follow_redirects=False, raise_error=False)
        self.assertEqual(res.code, 404, "Did not return 404 for station that does not exist")

    def test_turtle_document(self):
        self._graph_model_mock.graph_exist = Mock(return_value=True)

        mock_serialization = "<a> <b> <c> ."

        test_g = Mock()
        test_g.serialize = Mock(return_value=mock_serialization)
        self._graph_model_mock.get_context_graph = Mock(return_value=test_g)
        station_id = str(uuid.uuid4())
        res = self.fetch(f"/stations/{station_id}#e", headers={"Content-Type": RDFFormat.TURTLE.content_header()}, follow_redirects=False)
        self.assertEqual(res.code, 200, "Code is not 200 OK for existing entity")
        self.assertEqual(res.body.decode(), mock_serialization)
        test_g.serialize.assert_called_once_with(format=str(RDFFormat.TURTLE))

class Test_DocumentViewProtection(AsyncHTTPTestCase):
    def set_up(self):
        """
        Custom set up
        """
        self._graph_model_mock = Mock()
        self._redirection_factory = lambda x: f"http://testval.example.org/{x}"
        self._document_prefix = "http://example.org/entities/"
        self._station_manager_mock = Mock() 

    def get_app(self):
        self.set_up()
        return Application([
            (r"/entities/stations/(.*)", DocumentView, dict(configuration=DocumentViewConfiguration(self._graph_model_mock, self._document_prefix, self._redirection_factory, self._station_manager_mock)))
        ])

    def test_put_protected_turtle_document(self):
        valid_secret_key_station = b"asecretkey"
        self._station_manager_mock.get_secret_key = Mock(return_value=valid_secret_key_station)
        gc = GraphContainer(example_station_dummy_graph)
        signature = gc.sign(valid_secret_key_station, str(RDFFormat.TURTLE))
        self.fetch("/entities/stations/teststation?signature=" + base64.urlsafe_b64encode(signature).decode(), raise_error=True, body=gc.serialized(), method="PUT", headers={"Content-Type": RDFFormat.TURTLE.content_header()})

class Test_DocumentViewKeyProtection(AsyncHTTPTestCase):
    def set_up(self):
        self._graph_model_mock = Mock()
        self._redirection_factory = lambda x: f"http://testval.example.org/{x}"
        self._document_prefix = "http://example.org/entities/"

    def get_app(self):
        self.set_up()
        return Application([
            (r"/entities/stations/(.*)", DocumentView, dict(configuration=DocumentViewConfiguration(self._graph_model_mock, self._document_prefix, self._redirection_factory, protection_keys=["1234"])))
        ])

    def test_put_protected_turtle_document(self):
        gc = GraphContainer(example_station_dummy_graph)
        gc.serialize(str(RDFFormat.TURTLE))
        self.fetch("/entities/stations/teststation", raise_error=True, body=gc.serialized(), method="PUT", headers={"Content-Type": RDFFormat.TURTLE.content_header(), "Store-key": "1234"})

    def test_put_protected_turtle_document_invalid_key(self):
        gc = GraphContainer(example_station_dummy_graph)
        gc.serialize(str(RDFFormat.TURTLE))
        res = self.fetch("/entities/stations/teststation", body=gc.serialized(), method="PUT",
                   headers={"Content-Type": RDFFormat.TURTLE.content_header(), "Store-key": "123"})
        self.assertEqual(res.code, 403)