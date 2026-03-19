# Requirements: DataBridge AI

**Defined:** 2026-03-18
**Core Value:** Content classified against user-defined ontology, data dictionary, and rules via Cognee knowledge graph pipeline

## v1 Requirements

### Infrastructure

- [x] **INFRA-01**: Supabase project configured with Auth, Postgres, Storage, and RLS enabled
- [x] **INFRA-02**: Next.js frontend deployed on Vercel with Supabase credential sync
- [x] **INFRA-03**: Cognee FastAPI service deployed on Cloud Run (europe-west1)
- [x] **INFRA-04**: NetworkX graph store running inside Cognee container
- [x] **INFRA-05**: Supabase Storage bucket for OWL files and uploaded content
- [x] **INFRA-06**: User can log in via Supabase Auth and access protected routes

### Ontology Management

- [x] **ONT-01**: User can view list of ontology classes (entity types) in a DataTable
- [x] **ONT-02**: User can create, edit, and delete ontology classes with properties
- [x] **ONT-03**: User can define relationships between classes via form with dropdowns
- [x] **ONT-04**: User can define hierarchies and constraints between classes
- [x] **ONT-05**: Ontology data is tenant-scoped (tenant_id) with RLS
- [x] **ONT-06**: Ontology editor has three views: Class List, Relationship Editor, Visual Graph
- [x] **ONT-07**: Visual graph uses Cytoscape.js with hierarchical/DAG layout
- [x] **ONT-08**: User can view read-only presentation-optimised ontology visualisation
- [x] **ONT-09**: Visualisation supports filter by domain, expand/collapse, and search
- [x] **ONT-10**: User can export ontology visualisation as PNG/SVG
- [x] **ONT-11**: Ontology syncs to Cognee as OWL/RDF file via Cloud Run endpoint
- [x] **ONT-12**: UI shows stale indicator when ontology changed since last sync
- [x] **ONT-13**: OWL generated via rdflib on Cloud Run and stored in Supabase Storage

### Data Dictionary

- [x] **DD-01**: User can view 45+ taxonomy fields grouped by 7 categories in expandable DataTable
- [x] **DD-02**: User can add, edit, and delete dictionary fields (field_name, label, definition, value_type, enum values, governance, tagging method)
- [x] **DD-03**: Edit form is conditional on value_type
- [x] **DD-04**: User can manage categories (add, rename, reorder)
- [x] **DD-05**: Data dictionary supports versioning
- [ ] **DD-06**: Seed data loaded from TaxonomyDataDic.json
- [x] **DD-07**: User can view visual graph of categories, fields, and parent-child hierarchies
- [x] **DD-08**: Graph uses react-force-graph with colour-coded nodes by value_type
- [x] **DD-09**: Alternative table/tree view available alongside graph

### Rules Management

- [ ] **RULES-01**: User can view list of classification rules on a Rules page
- [ ] **RULES-02**: User can create and edit rules via structured form (not raw Markdown)
- [ ] **RULES-03**: Rules have structured sections: terminology, audience defaults, campaign detection, compliance flags, fair balance
- [ ] **RULES-04**: Rules follow L0-L4 hierarchy with validation (L3 → L2 brand, L4 → market code)
- [ ] **RULES-05**: Rules stored as JSONB in Supabase with RLS
- [ ] **RULES-06**: Rules support version history with diff view
- [ ] **RULES-07**: User can export rules as Markdown
- [ ] **RULES-08**: Published rules are ingested by Cognee via /add endpoint
- [ ] **RULES-09**: User can view visual L0-L4 hierarchy (tree/DAG layout)
- [ ] **RULES-10**: Hierarchy visualisation shows coverage matrix (brands x markets)

### Content Ingestion

- [ ] **CONTENT-01**: User can upload content files via drag-and-drop
- [ ] **CONTENT-02**: Upload uses signed URL flow to Supabase Storage
- [ ] **CONTENT-03**: Supported file types: PDF, PPT, DOCX, HTML, images
- [ ] **CONTENT-04**: Bulk upload supported
- [ ] **CONTENT-05**: Each file shows status pipeline: Uploaded → Ingesting → Cognified → Ready for Classification
- [ ] **CONTENT-06**: User can view list of uploaded content with metadata and status
- [ ] **CONTENT-07**: Uploaded content is processed by Cognee /add endpoint on Cloud Run

## v2 Requirements

### Classification & Results

- **CLASS-01**: Content classified against synced ontology, dictionary, and rules via Cognee
- **CLASS-02**: Classification results dashboard with charts and filters
- **CLASS-03**: Confidence scoring per classification
- **CLASS-04**: Compliance flag detection

### Advanced Features

- **ADV-01**: Multi-tenant architecture (tenant isolation)
- **ADV-02**: CSV/JSON export of classification results
- **ADV-03**: REST API for downstream integrations
- **ADV-04**: Content deduplication
- **ADV-05**: Reclassification on ontology/rule change

## Out of Scope

| Feature | Reason |
|---------|--------|
| Customer profiling/segmentation | v2+ (Customer component of broader data model) |
| Channel performance measurement | v2+ (Channel component) |
| Impact attribution/forecasting | v2+ (Impact component) |
| MLR review workflows | Deeply embedded in existing pharma tools (Veeva) |
| Content editing | DataBridge AI is read-only on content |
| Real-time streaming ingestion | Pharma content is batch-updated |
| Mobile app | Web-first, desktop users |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| ONT-01 | Phase 2 | Complete |
| ONT-02 | Phase 2 | Complete |
| ONT-03 | Phase 2 | Complete |
| ONT-04 | Phase 2 | Complete |
| ONT-05 | Phase 2 | Complete |
| ONT-06 | Phase 2 | Complete |
| ONT-07 | Phase 2 | Complete |
| ONT-08 | Phase 2 | Complete |
| ONT-09 | Phase 2 | Complete |
| ONT-10 | Phase 2 | Complete |
| ONT-11 | Phase 2 | Complete |
| ONT-12 | Phase 2 | Complete |
| ONT-13 | Phase 2 | Complete |
| DD-01 | Phase 3 | Complete |
| DD-02 | Phase 3 | Complete |
| DD-03 | Phase 3 | Complete |
| DD-04 | Phase 3 | Complete |
| DD-05 | Phase 3 | Complete |
| DD-06 | Phase 3 | Pending |
| DD-07 | Phase 3 | Complete |
| DD-08 | Phase 3 | Complete |
| DD-09 | Phase 3 | Complete |
| RULES-01 | Phase 4 | Pending |
| RULES-02 | Phase 4 | Pending |
| RULES-03 | Phase 4 | Pending |
| RULES-04 | Phase 4 | Pending |
| RULES-05 | Phase 4 | Pending |
| RULES-06 | Phase 4 | Pending |
| RULES-07 | Phase 4 | Pending |
| RULES-08 | Phase 4 | Pending |
| RULES-09 | Phase 4 | Pending |
| RULES-10 | Phase 4 | Pending |
| CONTENT-01 | Phase 5 | Pending |
| CONTENT-02 | Phase 5 | Pending |
| CONTENT-03 | Phase 5 | Pending |
| CONTENT-04 | Phase 5 | Pending |
| CONTENT-05 | Phase 5 | Pending |
| CONTENT-06 | Phase 5 | Pending |
| CONTENT-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
