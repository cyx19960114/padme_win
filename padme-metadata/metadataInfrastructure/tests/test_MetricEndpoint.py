import unittest
import rdflib
from rdflib.graph import Graph
from tornado.testing import AsyncHTTPTestCase
from tornado.escape import json_decode, json_encode
from unittest.mock import Mock, call
from datetime import datetime

import tornado.web as web
from ..PHTMetadataGenerator import DynamicMetadataGenerator

from ..HTTPInterface.metric_endpoint import MetricHandler

testURI = 'http://telegraf.test#'


class Test_TelegrafEndpointServer(AsyncHTTPTestCase):
    def setTestingUp(self):
        self.generator = Mock()
        self.generator.memory_event = Mock(return_value=Graph())
        self.generator.cpu_event = Mock(return_value=Graph())
        self.generator.log_event = Mock(return_value=Graph())
        self.test_pid = "http://example.org/test"
        self.test_buffer = Mock()
        self.test_buffer.add = Mock()
        self.test_time = datetime.now()

    def get_app(self):
        self.setTestingUp()
        return web.Application([
            web.url(r'/metric', MetricHandler,
                    dict(dynamic_generator=self.generator, buffer=self.test_buffer, return_metadata=True))
        ])
    
    def test_metric_list(self):
        test_timestamp = str(int(self.test_time.timestamp()))
        metrics = [
            {
                    "pid": self.test_pid,
                    "type": "memory",
                    "value": 20,
                    "timestamp": test_timestamp
                },
                {
                    "pid": self.test_pid,
                    "type": "cpu",
                    "value": 10,
                    "timestamp": test_timestamp
                },
                {
                    "pid": self.test_pid,
                    "type": "log",
                    "value": "test",
                    "timestamp": test_timestamp
                }
        ]
        for metric in metrics:
            jsonBody = json_encode(metric)
            self.fetch("/metric", raise_error=True,
                            method="POST", body=jsonBody)
        self.assertEqual(self.test_buffer.add.call_count,3)


if __name__ == '__main__':
    unittest.main()
