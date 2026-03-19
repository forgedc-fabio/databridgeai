"""DataBridge AI Cognee backend with custom OWL sync endpoint."""

import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client

from owl_generator import generate_owl

# Import Cognee's FastAPI app and include its routes alongside ours
try:
    from cognee.api.v1.routes import router as cognee_router

    HAS_COGNEE_ROUTES = True
except ImportError:
    HAS_COGNEE_ROUTES = False

app = FastAPI(title="DataBridge AI Cognee Backend")

if HAS_COGNEE_ROUTES:
    app.include_router(cognee_router)


class OntologyClass(BaseModel):
    """A single ontology class for OWL generation."""

    name: str
    description: str | None = None
    domain_group: str | None = None


class OntologyRelationship(BaseModel):
    """A single ontology relationship for OWL generation."""

    source_name: str
    target_name: str
    type: str


class SyncRequest(BaseModel):
    """Request body for the /ontology/sync endpoint."""

    tenant_id: str
    classes: list[OntologyClass]
    relationships: list[OntologyRelationship]


class SyncResponse(BaseModel):
    """Response from the /ontology/sync endpoint."""

    owl_file_path: str
    synced_at: str
    class_count: int
    relationship_count: int


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run and monitoring."""
    return {"status": "ok", "service": "databridgeai-cognee"}


@app.post("/ontology/sync", response_model=SyncResponse)
async def sync_ontology(request: SyncRequest):
    """Generate OWL from ontology data and store in Supabase Storage."""
    try:
        # Generate OWL/RDF-XML
        ontology_data = {
            "classes": [c.model_dump() for c in request.classes],
            "relationships": [r.model_dump() for r in request.relationships],
        }
        owl_xml = generate_owl(ontology_data)

        # Store in Supabase Storage
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise HTTPException(
                status_code=500,
                detail="Supabase credentials not configured on backend",
            )

        supabase = create_client(supabase_url, supabase_key)

        # Upload OWL file to Storage
        file_path = f"ontologies/{request.tenant_id}/ontology.owl"
        owl_bytes = owl_xml.encode("utf-8")

        # Remove existing file if present (upsert)
        try:
            supabase.storage.from_("documents").remove([file_path])
        except Exception:
            pass  # File may not exist yet

        supabase.storage.from_("documents").upload(
            file_path,
            owl_bytes,
            file_options={"content-type": "application/rdf+xml", "upsert": "true"},
        )

        synced_at = datetime.now(timezone.utc).isoformat()

        return SyncResponse(
            owl_file_path=file_path,
            synced_at=synced_at,
            class_count=len(request.classes),
            relationship_count=len(request.relationships),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
