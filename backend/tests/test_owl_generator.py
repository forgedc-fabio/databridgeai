"""Tests for OWL/RDF-XML generator."""

import pytest
from owl_generator import generate_owl, sanitise_uri


class TestSanitiseUri:
    """Tests for URI sanitisation."""

    def test_converts_spaces_to_underscores(self) -> None:
        assert sanitise_uri("Drug Product") == "Drug_Product"

    def test_removes_special_characters(self) -> None:
        assert sanitise_uri("Drug (oral)") == "Drug__oral_"

    def test_preserves_alphanumerics_and_underscores(self) -> None:
        assert sanitise_uri("Drug_123") == "Drug_123"

    def test_handles_empty_string(self) -> None:
        assert sanitise_uri("") == ""

    def test_handles_hyphens(self) -> None:
        assert sanitise_uri("is-a") == "is_a"


class TestGenerateOwl:
    """Tests for OWL generation."""

    def test_generates_valid_rdf_xml_with_ontology_declaration(
        self, sample_ontology_data: dict
    ) -> None:
        result = generate_owl(sample_ontology_data)
        assert "owl:Ontology" in result
        assert "DataBridge AI Ontology" in result

    def test_includes_owl_class_for_each_class(
        self, sample_ontology_data: dict
    ) -> None:
        result = generate_owl(sample_ontology_data)
        assert "owl:Class" in result
        # Check for rdfs:label with class names
        assert "Drug" in result
        assert "Disease" in result

    def test_includes_rdfs_comment_for_classes_with_descriptions(
        self, sample_ontology_data: dict
    ) -> None:
        result = generate_owl(sample_ontology_data)
        assert "A pharmaceutical product" in result
        assert "A medical condition" in result

    def test_maps_is_a_relationships_to_subclass_of(
        self, hierarchy_ontology_data: dict
    ) -> None:
        result = generate_owl(hierarchy_ontology_data)
        assert "rdfs:subClassOf" in result

    def test_maps_custom_relationship_types_to_object_property(
        self, sample_ontology_data: dict
    ) -> None:
        result = generate_owl(sample_ontology_data)
        assert "owl:ObjectProperty" in result
        assert "related-to" in result or "related_to" in result

    def test_handles_empty_classes_list(self) -> None:
        result = generate_owl({"classes": [], "relationships": []})
        assert "owl:Ontology" in result
        assert "owl:Class" not in result

    def test_handles_empty_relationships_list(self) -> None:
        data = {
            "classes": [{"name": "Drug", "description": None, "domain_group": None}],
            "relationships": [],
        }
        result = generate_owl(data)
        assert "owl:Class" in result
        assert "owl:ObjectProperty" not in result

    def test_returns_xml_string(self, sample_ontology_data: dict) -> None:
        result = generate_owl(sample_ontology_data)
        assert result.startswith("<?xml")

    def test_class_without_description_has_no_comment(self) -> None:
        data = {
            "classes": [{"name": "Thing", "description": None, "domain_group": None}],
            "relationships": [],
        }
        result = generate_owl(data)
        assert "rdfs:comment" not in result
