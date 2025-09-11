
import rdflib
import unittest
from tornado.testing import AsyncHTTPTestCase
from tornado.escape import json_encode
from tornado.web import Application

from unittest.mock import Mock
from datetime import datetime
from metadataInfrastructure.HTTPInterface.state_endpoint import create_app


TEST_PREFIX = "http://httpinterface.test#"


class Test_stateEndpoints(AsyncHTTPTestCase):
    # this method is not done in setUp, because it seems that the set up method is not allowed to be overwritten
    # therefore we just call this in the get_app method which is called prior to the test executions
    def setTestingUp(self):
        self.generator = Mock()
        self.central_generator = Mock()
        self.buffer = Mock()
        self.timestamp = datetime.now()
        self.test_obj = {
            "pid": rdflib.URIRef("http://example.org/testtrain"),
            "timestamp": self.timestamp.isoformat()
        }
        self.test_json = json_encode(self.test_obj)

    def get_app(self):
        self.skipTest("Changed Functionality, Tests deprecated")
        self.setTestingUp()
        return Application([
            (r"(.*)", create_app(dynamic_generator=self.generator, dynamic_central_generator=self.central_generator, buffer=self.buffer, return_metadata=False))
        ])
        
    def _check_correct_call_arguments_buffer_add(self, call_arg):
        """
        Since the buffer is not called with the graph directly, but with a GraphContainer, this asserts the correct call arguments for 
        the buffers add method by unwrapping that call to compare the graphes [i.e. mock objects]
        """
        self.assertEqual(self.buffer.add.call_args_list[0][0][0]._graph, call_arg)

    def test_startRunning(self):
        # Allow non standard method is needed, otherwise we would have to provide a body which is unecessary for testing purposes
        res = Mock()
        self.generator.started_running_at_station_event = Mock(
            return_value=res)
        resp = self.fetch('/startedRunning', raise_error=True,
                          method='POST', body=self.test_json)
        self.generator.started_running_at_station_event.assert_called_once_with(
            self.test_obj["pid"], self.timestamp)
        self._check_correct_call_arguments_buffer_add(res)

    def __finishRunning_with_success(self, success):
        # Allow non standard method is needed, otherwise we would have to provide a body which is unecessary for testing purposes
        self.test_obj["successful"] = success
        self.test_json = json_encode(self.test_obj)
        res = Mock()
        self.generator.finished_running_at_station_event = Mock(
            return_value=res)
        resp = self.fetch('/finished', raise_error=True,
                          method='POST', body=self.test_json)
        self.generator.finished_running_at_station_event.assert_called_once_with(
            self.test_obj["pid"], self.timestamp, success)
        self._check_correct_call_arguments_buffer_add(res)

    def test_finishRunningEventSuccessful(self):
        self.__finishRunning_with_success(True)

    def test_finishRunningEventUnsuccessful(self):
        self.__finishRunning_with_success(False)


    def test_startDownload(self):
        # Allow non standard method is needed, otherwise we would have to provide a body which is unecessary for testing purposes
        res = Mock()
        self.generator.finished_transmission_event = Mock(return_value=res)
        resp = self.fetch('/finishedDownloading',
                          raise_error=True, method='POST', body=self.test_json)
        self.generator.finished_transmission_event.assert_called_once_with(
            self.test_obj["pid"], self.timestamp)
        self._check_correct_call_arguments_buffer_add(res)

    def test_rejected(self):
        res = Mock()
        msg = "aldamdkadlkanskdnasklndlkandlkandna"
        self.test_obj["message"] = msg
        self.test_json = json_encode(self.test_obj)
        self.generator.rejected_event = Mock(return_value=res)
        resp = self.fetch('/rejected',
                          raise_error=True, method='POST', body=self.test_json)
        self.generator.rejected_event.assert_called_once_with(
            self.test_obj["pid"], self.timestamp, msg)
        self._check_correct_call_arguments_buffer_add(res)

    def test_instantiated(self):
        res = Mock()
        self.test_json = json_encode(self.test_obj)
        self.central_generator.train_instantiated_event = Mock(return_value=res)
        resp = self.fetch('/instantiated',
                          raise_error=True, method='POST', body=self.test_json)
        self.central_generator.train_instantiated_event.assert_called_once_with(
            self.test_obj["pid"], self.timestamp)
        self._check_correct_call_arguments_buffer_add(res)

if __name__ == '__main__':
    unittest.main()
