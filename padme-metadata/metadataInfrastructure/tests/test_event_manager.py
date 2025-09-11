import unittest
import copy
from datetime import datetime

from .graphs_examples import example_station_dummy_graph

from ..EventModel.eventManager import EventManager
from ..EventModel.mapper import Event, EventStationAssociation

class TestManagerBasic(unittest.TestCase):

    def setUp(self) -> None:

        self._event_manager = EventManager.with_connection("sqlite:///:memory:")
        self._test_event = Event(timestamp=datetime.now(), payload=example_station_dummy_graph.serialize(format="json-ld"), event_type="dummy")
        self._event_manager.create_tables()
        return super().setUp()

    def test_add_event(self):
        import sqlalchemy
        self._event_manager.add_event(copy.deepcopy(self._test_event))
        res = self._event_manager.session.execute(sqlalchemy.select(Event)).all()
        self.assertEqual(len(res),1)
        self.assertEqual(res[0][0].timestamp, self._test_event.timestamp)
        self.assertEqual(res[0][0].event_type, self._test_event.event_type)

    def test_get_event_for_document(self):

        test_entity = "http://example.org"
        test_property_class = "http://property.example.org"
        self._test_event.id = 1
        true_negative = Event(timestamp=datetime.now(), payload=example_station_dummy_graph.serialize(format="json-ld"), event_type="dummy")
        self._event_manager.session.add(self._test_event)
        self._event_manager.session.add(true_negative)
        assoc = EventStationAssociation(event_id=self._test_event.id, entity_document_iri=test_entity, association_property_class=test_property_class)
        self._event_manager.session.add(assoc)

        events = self._event_manager.get_events_associated_with_document(test_entity)

        self.assertEqual(len(events), 1)

        self.assertEqual(events[0][0].timestamp, self._test_event.timestamp)
        self.assertEqual(events[0][0].event_type, self._test_event.event_type)
        self.assertNotIn(true_negative, events)

    def test_get_event_data(self):
        import json
        test_data = '{"@id": "http://example.org"}'
        true_positive = Event(event_iri="http://example.org", timestamp=datetime.now(), payload=test_data, event_type="dummy")
        self._event_manager.session.add(true_positive)
        event_data = self._event_manager.get_event_data("http://example.org")
        self.assertEqual(json.loads(event_data), json.loads(test_data))