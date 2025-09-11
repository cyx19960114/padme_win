import rdflib

from pathlib import Path
from unittest.mock import Mock
from unittest import TestCase
from tornado.testing import AsyncHTTPTestCase
from tornado.web import Application
from tornado.escape import json_encode, json_decode

from metadataInfrastructure.Gateway.event_filter import EventFilter
from metadataInfrastructure.HTTPInterface.configuration_endpoint import ConfigurationHandler
from metadataInfrastructure.Configuration import StationIriConfiguration, EventFilterConfiguration
from metadataInfrastructure.HTTPInterface.configuration_endpoint import create_app
from metadataInfrastructure.HTTPInterface.SHACLParser import parseIntoDescriptionList


class test_ConfigurationInterface(AsyncHTTPTestCase):
    def get_app(self):
        self.mockGen = Mock()
        self.test_station_iri_config = StationIriConfiguration(False)
        return Application([
            (r"/test", ConfigurationHandler, dict(dynamic_generator=self.mockGen,
             station_iri_config= self.test_station_iri_config)),
        ])

    def test_settingStationIdentifier(self):
        reqbody = {
            'stationIdentifier': "testidentifier"
        }
        self.fetch('/test', raise_error=True,
                   method="POST", body=json_encode(reqbody))
        self.assertEqual(self.test_station_iri_config.iri, "testidentifier")


class TestListHandler(AsyncHTTPTestCase):
    def set_up(self):
        self.tf = EventFilter(EventFilterConfiguration(False, [],))

    def get_app(self):
        self.set_up()
        return Application([
            (r"/test/(.*)", create_app(None, self.tf,  None, None))
        ])

    def test_getList(self):
        self.tf.setList(["1", "2", "3", "4"])
        self.tf.setUseAllowList = False
        resp = self.fetch('/test/filter', method='GET')
        self.assertEqual(resp.code, 200)
        responseObject = json_decode(resp.body)
        # order lists since the order of the lists are changed in the server (it is handles as a set internally)
        self.assertEqual(responseObject["list"].sort(), [
                         "1", "2", "3", "4"].sort())

    def test_getUseAllow(self):
        # test value, we test once with False once with True
        useAllowListTestValues = [False, True,
                                  False, True, False, False, True, True]
        for ual in useAllowListTestValues:
            self.tf.setList([])
            self.tf.setUseAllowList(ual)
            resp = self.fetch('/test/filter', method='GET')
            responseObject = json_decode(resp.body)
            self.assertEqual(responseObject["useAllowList"], ual)

    def test_setUseAllowList(self):
        useAllowListTestValues = [False, True,
                                  False, True, False, False, True, True]
        for ual in useAllowListTestValues:
            resp = self.fetch('/test/filter', method='POST',
                              body=json_encode({'useAllowList': ual}))
            self.assertEqual(resp.code, 200)
            self.assertEqual(ual, self.tf.getUseAllowList())

    def test_setList(self):
        testValues = [[], ["1", "2", "3", "4"]]
        for val in testValues:
            resp = self.fetch('/test/filter', method='POST',
                              body=json_encode({'list': val}))
            self.assertEqual(resp.code, 200)
            self.assertEqual(val.sort(), self.tf.getList().sort())


class TestSHACLParser(TestCase):
    def setUp(self) -> None:
        self.skipTest("Depracted feature")
        self.trainGraph = rdflib.Graph()
        self.stationGraph = rdflib.Graph()
        trainSHACLPath = Path(__file__).parent / '../../Schema/Train/shacl.ttl'
        stationSHACLPath = Path(__file__).parent / \
            '../../Schema/Station/shacl.ttl'
        self.trainGraph.parse(str(trainSHACLPath), format="turtle")
        self.stationGraph.parse(str(stationSHACLPath), format="turtle")
        self.phtprefix = "https://github.com/LaurenzNeumann/PHTMetadata#"
        return super().setUp()

    def test_FunctionViaSamplingWithTrain(self):
        samples = [
            (self.phtprefix + 'description', 'Train description'),
            (self.phtprefix + 'certificate', 'Certificate'),
            (self.phtprefix + 'certificateIssuer', 'Certificate Issuer'),
            (self.phtprefix + 'event', 'List of events of the execution'),
        ]
        dl = parseIntoDescriptionList(self.trainGraph)
        for x in samples:
            if not x in dl:
                self.fail(f"Sample {x} is not in descriptionList")
