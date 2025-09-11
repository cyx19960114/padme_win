import unittest
from unittest.mock import Mock

from ..StationManager.mapper import ResourceIRI, Token
from ..StationManager.stationManager import StationManager, ResourceIRIConflict, MissingSecret


class TestStationManagerWorkflow(unittest.TestCase):
    def setUp(self) -> None:
        self.sm = StationManager()
        self.sm.initialize_connection("sqlite:///:memory:")
        self.sm.create_tables()
        self.test_iri = "http://example.org/stations/sample"

    def test_enrollment(self):
        """Test if the enrollment of a station works as desired
        Use mocked token generation"""
        # mock and fix token generator
        self.sm._token_generator = Mock(return_value="test")
        token = self.sm.enroll_station(self.test_iri)

        # check
        all = self.sm.session.query(ResourceIRI).all()
        self.assertEqual(len(all), 1)
        self.assertEqual(all[0].iri, self.test_iri)

        all = self.sm.session.query(Token).all()
        self.assertEqual(len(all), 1)
        self.assertEqual(token, "test")
        self.assertEqual(all[0].token, "test")

    def test_set_public_key(self):
        # set up
        si = ResourceIRI(iri=self.test_iri, id=None, secret_key=None)
        to = Token(token="test")
        si.tokens.append(to)
        self.sm.session.add(si)
        secret_key = bytes("publickeytest", "utf-8")

        # code
        self.sm.set_secret_key("test", secret_key)

        # check
        # public key is set
        tu = self.sm.session.query(ResourceIRI).first()
        self.assertEqual(tu.secret_key, secret_key)

    def test_delete_secret(self):
        # set up
        si = ResourceIRI(iri=self.test_iri, id=None, secret_key=None)
        to = Token(token="testsec")
        si.tokens.append(to)
        self.sm.session.add(si)

        # code
        res = self.sm.delete_secret("testsec")

        # check
        self.assertTrue(res)
        tu = self.sm.session.query(Token).all()
        print(tu)
        self.assertEqual(len(tu), 0)

    def test_enroll_twice_error(self):
        self.sm._token_generator = Mock(return_value="test")
        token = self.sm.enroll_station(self.test_iri)
        with self.assertRaises(ResourceIRIConflict):
            invalid = self.sm.enroll_station(self.test_iri)
    
    def test_update_secret_key_missing_error(self):
        si = ResourceIRI(iri=self.test_iri, id=None, secret_key=None)
        self.sm.session.add(si)
        with self.assertRaises(MissingSecret):
            self.sm.set_secret_key("wrong", b"not_setted_key")
        # check with one present, but wrong one
        to = Token(token="test")
        si.tokens.append(to)
        with self.assertRaises(MissingSecret):
            self.sm.set_secret_key("wrong", b"not_setted_key")
        
        