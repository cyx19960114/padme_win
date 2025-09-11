from json import JSONDecoder
from tornado.testing import AsyncHTTPTestCase

from ..TrainStoreHTTPInterface.query import get_app, QueryHandlerConfiguration


class test_query_handler_integration(AsyncHTTPTestCase):

    def get_app(self):
        from ..GraphModel import GraphModel
        self.gm = GraphModel.with_sql("sqlite://")
        return get_app(QueryHandlerConfiguration(self.gm))

    def inject_test_data(self):
        from .graphs_examples import example_station_dummy_graph, PHT_TEST_REGISTRY
        self.test_data = example_station_dummy_graph
        for t in example_station_dummy_graph.triples(tuple([None] * 3)):
            self.gm._dataset.get_context(PHT_TEST_REGISTRY["station1"]).add(t)

    def test_simple_query_jsonld(self):
        self.inject_test_data()
        query = "SELECT ?a ?b ?c WHERE {?a ?b ?c}"
        res = self.fetch("/", method="POST", body=query, raise_error=True)
        # parse result
        d = JSONDecoder()
        res_obj = d.decode(res.body.decode())
        # simple assert to check if every triple is contained
        # we do not test the underlying query engine
        self.assertEqual(len(res_obj["results"]["bindings"]),len(self.test_data))


