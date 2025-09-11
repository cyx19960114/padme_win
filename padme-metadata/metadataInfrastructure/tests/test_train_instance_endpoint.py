from tornado.testing import AsyncHTTPTestCase
from tornado.escape import json_encode

from unittest.mock import Mock
from metadataInfrastructure.HTTPInterface.train_instance_endpoint import create_app
from metadataInfrastructure.PHTMetadataGenerator import Static_Train_Instance_Metadata_Generator

class TestTrainInstanceEndpoints(AsyncHTTPTestCase):
    def setTestingUp(self):
        self.generator = Mock()
        self.static_generator = Mock(spec=Static_Train_Instance_Metadata_Generator)
        self.buffer = Mock()
        self.test_pid = "http://trainregistry.example.org/#test"

    def get_app(self):
        self.setTestingUp()
        return create_app(self.static_generator, buffer=self.buffer, return_metadata=False)

    def test_create_train_instance_endpoint(self):
        res = Mock()
        self.static_generator.instancing_pid = Mock(return_value=res)
        test_json = json_encode({
            "pid": self.test_pid
        })
        resp = self.fetch('/create', raise_error=True,
                          method='POST', body=test_json)
        self.static_generator.instancing_pid.assert_called()
        # check if buffer was called with correct graph container argument
        gc = self.buffer.add.mock_calls[0].args[0]
        self.assertEqual(gc._graph, res)
