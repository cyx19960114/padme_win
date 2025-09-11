import rdflib
from typing import List, Tuple
SHACL = rdflib.Namespace('http://www.w3.org/ns/shacl#')


def parseIntoDescriptionList(shaclGraph: rdflib.Graph) -> List[Tuple[str, str]]:
    """Parses a given SHACL definition into a List containing descriptions of the resources. 
    Every SHACL shape which has a targetClass property or a path attribute is included. 
    As a description, the name of the shape (sh:name) is utilized. 
    The return Value is a List of 2-Tuples with the URI and the name."""
    dl: List[Tuple[str, str]] = []
    # outer loop: iterate over classes
    # looking up all shapes which have a targetClass value:
    for (s, p, o) in shaclGraph.triples((None, SHACL["targetClass"], None)):
        # s is the subject with the target class attribute.
        # o is the target class which want to describe:
        # check for a sh:name :
        nameDescription = next(shaclGraph.triples(
            (s, SHACL["name"], None)), None)
        if not nameDescription == None:
            # append it to the description list
            dl.append((str(o), str(nameDescription[2])))

        # iterate now over the predicates:
        for (_, _, so) in shaclGraph.triples((s, SHACL["property"], None)):
            # so is the property shape
            pathTriple = next(shaclGraph.triples(
                (so, SHACL["path"], None)), -1)
            nameTriple = next(shaclGraph.triples(
                (so, SHACL["name"], None)), -1)
            if not pathTriple == -1 and not nameTriple == -1:
                dl.append((str(pathTriple[2]), str(nameTriple[2])))
    return dl
