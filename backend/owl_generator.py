"""OWL/RDF-XML generator for DataBridge AI ontologies."""

from rdflib import Graph, Namespace, Literal, URIRef, RDF, RDFS, OWL
import re


def sanitise_uri(name: str) -> str:
    """Convert a human-readable name to a valid URI fragment.

    Replaces spaces with underscores, removes special characters.
    Keeps the human-readable name as rdfs:label.

    Args:
        name: Human-readable name (e.g. "Drug Product").

    Returns:
        URI-safe fragment (e.g. "Drug_Product").
    """
    sanitised = re.sub(r"[^a-zA-Z0-9_]", "_", name.replace(" ", "_"))
    return sanitised


def generate_owl(ontology_data: dict) -> str:
    """Generate OWL/RDF-XML from ontology class and relationship data.

    Args:
        ontology_data: Dict with "classes" list and "relationships" list.
            Each class: {"name": str, "description": str|None, "domain_group": str|None}
            Each relationship: {"source_name": str, "target_name": str, "type": str}

    Returns:
        OWL/RDF-XML string.
    """
    g = Graph()

    ns = Namespace("http://databridgeai.forgedc.com/ontology#")
    g.bind("dba", ns)
    g.bind("owl", OWL)
    g.bind("rdfs", RDFS)

    # Declare ontology
    ontology_uri = URIRef("http://databridgeai.forgedc.com/ontology")
    g.add((ontology_uri, RDF.type, OWL.Ontology))
    g.add((ontology_uri, RDFS.label, Literal("DataBridge AI Ontology")))

    # Add classes
    for cls in ontology_data.get("classes", []):
        class_uri = ns[sanitise_uri(cls["name"])]
        g.add((class_uri, RDF.type, OWL.Class))
        g.add((class_uri, RDFS.label, Literal(cls["name"])))
        if cls.get("description"):
            g.add((class_uri, RDFS.comment, Literal(cls["description"])))

    # Add relationships
    for rel in ontology_data.get("relationships", []):
        source_uri = ns[sanitise_uri(rel["source_name"])]
        target_uri = ns[sanitise_uri(rel["target_name"])]

        if rel["type"] == "is-a":
            g.add((source_uri, RDFS.subClassOf, target_uri))
        else:
            prop_uri = ns[sanitise_uri(rel["type"])]
            g.add((prop_uri, RDF.type, OWL.ObjectProperty))
            g.add((prop_uri, RDFS.label, Literal(rel["type"])))
            g.add((prop_uri, RDFS.domain, source_uri))
            g.add((prop_uri, RDFS.range, target_uri))

    return g.serialize(format="xml")
