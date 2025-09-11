import rdflib


from rdflib import Graph, Namespace, Literal

TEST_NAMESPACE = Namespace("http://pht.example.org/registry/")
PHT_TEST_NAMESPACE = Namespace("http://schema.pht.example.org/")
PHT_TEST_REGISTRY = Namespace("http://registry.pht.example.org/")

example_dummy_graph = Graph()
example_dummy_graph.add((TEST_NAMESPACE["train1"], PHT_TEST_NAMESPACE["name"], Literal("Testzug")))
example_dummy_graph.add((TEST_NAMESPACE["train1"], PHT_TEST_NAMESPACE["creator"], TEST_NAMESPACE["me"]))
example_dummy_graph.add((TEST_NAMESPACE["train1"], PHT_TEST_NAMESPACE["creator"], Literal("Somebody E. Lse")))
example_dummy_graph.add((TEST_NAMESPACE["me"], PHT_TEST_NAMESPACE["name"], Literal("Laurenz A. W. Neumann")))

example_station_dummy_graph = Graph()
example_station_dummy_graph.add((PHT_TEST_REGISTRY["station1"], PHT_TEST_NAMESPACE["name"], Literal("Miau")))
example_station_dummy_graph.add((PHT_TEST_REGISTRY["station1"], PHT_TEST_NAMESPACE["contactPerson"], TEST_NAMESPACE["me"]))
