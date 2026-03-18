"""Shared test fixtures for DataBridge AI backend tests."""

import pytest


@pytest.fixture
def sample_ontology_data() -> dict:
    """Minimal ontology data for testing OWL generation."""
    return {
        "classes": [
            {"name": "Drug", "description": "A pharmaceutical product", "domain_group": "Clinical"},
            {"name": "Disease", "description": "A medical condition", "domain_group": "Clinical"},
        ],
        "relationships": [
            {"source_name": "Drug", "target_name": "Disease", "type": "related-to"},
        ],
    }


@pytest.fixture
def hierarchy_ontology_data() -> dict:
    """Ontology data with is-a hierarchy for testing subclass generation."""
    return {
        "classes": [
            {"name": "Entity", "description": "Top-level entity", "domain_group": None},
            {"name": "Drug", "description": "A pharmaceutical product", "domain_group": "Clinical"},
            {"name": "Biologic", "description": "A biologic drug", "domain_group": "Clinical"},
        ],
        "relationships": [
            {"source_name": "Drug", "target_name": "Entity", "type": "is-a"},
            {"source_name": "Biologic", "target_name": "Drug", "type": "is-a"},
        ],
    }
