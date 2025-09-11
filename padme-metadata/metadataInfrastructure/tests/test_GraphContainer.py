from hashlib import new
import os
import unittest

import rdflib

from ..GraphContainer import GraphContainer, PrefixGuardValidator
from .graphs_examples import example_dummy_graph, example_station_dummy_graph


class TestPrefixGuardValidator(unittest.TestCase):

    def test_resource_validation_valid_graph(self):
        g = rdflib.Graph()
        e = rdflib.Namespace("http://example.org/test#")
        g.add((e["sub1"], e["p1"], e["o1"]))
        g.add((e["sub1"], e["p1"], e["o2"]))
        g.add((e["sub1"], e["p2"], e["o3"]))
        gc = GraphContainer(g, authority=e["sub1"])
        prefix = str(e["sub"])

        PGV = PrefixGuardValidator(prefix)

        con, contains_pre = PGV.check_resource_validation(gc)
        
        self.assertTrue(con)
        self.assertFalse(contains_pre)

    def test_resource_validation_valid_graph_connect_via_object(self):
        g = rdflib.Graph()
        e = rdflib.Namespace("http://example.org/test#")
        g.add((e["s1"], e["p1"], e["sub1"]))
        g.add((e["s1"], e["p2"], e["o1"]))
        g.add((e["s1"], e["p3"], e["o2"]))
        gc = GraphContainer(g, authority=e["sub1"])
        prefix = str(e["sub"])

        PGV = PrefixGuardValidator(prefix)

        con, contains_pre = PGV.check_resource_validation(gc)
        
        self.assertTrue(con)
        self.assertFalse(contains_pre)

    def test_resource_validation_nonvalid_graph_contains_pref(self):
        g = rdflib.Graph()
        e = rdflib.Namespace("http://example.org/test#")
        g.add((e["sub1"], e["p1"], e["o1"]))
        g.add((e["sub1"], e["p1"], e["sub2"]))
        g.add((e["sub2"], e["p2"], e["o3"])) 
        gc = GraphContainer(g, authority=e["sub1"])
        prefix = str(e["sub"])

        PGV = PrefixGuardValidator(prefix)

        con, contains_pre = PGV.check_resource_validation(gc)
        self.assertTrue(con)
        self.assertTrue(contains_pre)

    def test_resource_validation_nonvalid_graph_not_connected(self):
        g = rdflib.Graph()
        e = rdflib.Namespace("http://example.org/test#")
        g.add((e["sub1"], e["p1"], e["o1"]))
        g.add((e["sub1"], e["p1"], e["o2"]))
        g.add((e["frr2"], e["p2"], e["o3"]))
        gc = GraphContainer(g, authority=e["sub1"])
        prefix = str(e["sub"])

        PGV = PrefixGuardValidator(prefix)

        con, contains_pre = PGV.check_resource_validation(gc)
        self.assertFalse(con)
        self.assertFalse(contains_pre)


class Test_Signature_Container(unittest.TestCase):
    def test_sign_verify_SHA_256(self):
        s = GraphContainer(rdflib.Graph(
        ), signature=None, serialized="Testserializationasdasdasdasdasdasdasds")
        secret = bytes("testsecret", "utf-8")
        s.sign(secret)
        self.assertTrue(s.verify(secret))

    def test_sign_verify_SHA_256_invalid(self):
        s = GraphContainer(rdflib.Graph(
        ), signature=None, serialized="Testserializationasdasdasdasdasdasdasds")
        secret_real = bytes("katz", "utf-8")
        secret_fake = bytes("brot", "utf-8")
        if secret_real == secret_fake:
                self.skipTest("Key generation error: keys not different, skip test...")
        s.sign(secret_real)
        self.assertFalse(s.verify(secret_fake))

    def test_graph_container_sign_without_user_provided_signature(self):
        from .graphs_examples import example_dummy_graph
        s = GraphContainer(example_dummy_graph)
        self.assertIsNone(s._serialized)
        signature = s.sign(b"katzenbrot")
        v = s.verify(b"katzenbrot")
        self.assertTrue(v)
        self.assertIsNotNone(s._signature)

class Test_Graph_Container_Operators_Overloading(unittest.TestCase):
    def setUp(self) -> None:
        self.gc1_1 = GraphContainer(example_dummy_graph, "http://1.example.org")
        self.gc1_2 = GraphContainer(example_station_dummy_graph, "http://1.example.org")
        self.gc2_2 = GraphContainer(example_station_dummy_graph, "http://2.example.org")
    def test_add_same_authority(self):
        new_gc = self.gc1_1 + self.gc1_2
        self.assertEqual(new_gc.authority(), self.gc1_1.authority())
        self.assertTrue(new_gc.graph().isomorphic(example_dummy_graph+example_station_dummy_graph))
    def test_add_different_authority(self):
        new_gc = self.gc1_1 + self.gc2_2
        self.assertIsNone(new_gc.authority())
