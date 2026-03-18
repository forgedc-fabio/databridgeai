# Roadmap: DataBridge AI

## Overview

DataBridge AI delivers a content intelligence platform for pharmaceutical commercial operations in five phases. Phase 1 establishes infrastructure (Vercel, Supabase, Cloud Run with Cognee, auth). Phases 2-4 build the three knowledge management pillars — ontology, data dictionary, and classification rules — each as a complete vertical slice with CRUD, visualisation, and integration. Phase 5 delivers the content ingestion pipeline that ties everything together, uploading files and processing them through Cognee against the ontology, dictionary, and rules defined in earlier phases.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure** - Deploy Vercel + Supabase + Cloud Run with Cognee, auth, and protected routes (completed 2026-03-18)
- [ ] **Phase 2: Ontology Management** - Ontology editor UI with class/relationship CRUD, graph visualisation, and Cognee sync
- [ ] **Phase 3: Data Dictionary** - Taxonomy field management with category grouping, versioning, and graph/tree visualisation
- [ ] **Phase 4: Rules Management** - L0-L4 classification rules editor with structured forms, versioning, and hierarchy visualisation
- [ ] **Phase 5: Content Ingestion** - File upload pipeline with drag-and-drop, signed URLs, status tracking, and Cognee processing

## Phase Details

### Phase 1: Infrastructure
**Goal**: Users can access a deployed, authenticated application with all backend services running
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06
**Success Criteria** (what must be TRUE):
  1. User can open the application URL and see a login page served from Vercel
  2. User can log in via Supabase Auth and is redirected to a protected dashboard shell
  3. Unauthenticated users are redirected away from protected routes
  4. Cognee FastAPI health endpoint responds on Cloud Run (europe-west1)
  5. OWL files and content can be stored in and retrieved from Supabase Storage
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 16 project, Supabase auth, proxy route protection, and login page
- [x] 01-02-PLAN.md — Cognee backend Dockerfile, dependencies, and Cloud Run deployment
- [x] 01-03-PLAN.md — Dashboard shell with sidebar, health status, Storage bucket, and full integration

### Phase 2: Ontology Management
**Goal**: Users can define, visualise, and sync a domain ontology that constrains Cognee's entity extraction
**Depends on**: Phase 1
**Requirements**: ONT-01, ONT-02, ONT-03, ONT-04, ONT-05, ONT-06, ONT-07, ONT-08, ONT-09, ONT-10, ONT-11, ONT-12, ONT-13
**Success Criteria** (what must be TRUE):
  1. User can create ontology classes with properties, define relationships and hierarchies between them, and see all classes in a DataTable
  2. User can switch between Class List, Relationship Editor, and Visual Graph views in the ontology editor
  3. User can view a read-only presentation-optimised graph with filter, expand/collapse, search, and PNG/SVG export
  4. User can sync the ontology to Cognee and sees a stale indicator when the ontology has changed since last sync
  5. Ontology data is tenant-scoped and enforced by RLS
**Plans**: 6 plans

Plans:
- [ ] 02-00-PLAN.md — Wave 0: Test scaffold files for Nyquist compliance (9 TypeScript + 2 Python stubs)
- [ ] 02-01-PLAN.md — Database schema, TypeScript types, shadcn/ui + Cytoscape dependencies, nav enablement
- [ ] 02-02-PLAN.md — Class List DataTable with CRUD side panel, tab container, empty state, delete confirmation
- [ ] 02-03-PLAN.md — Relationship Editor DataTable with CRUD dialog, hierarchy validation, inline type creation
- [ ] 02-04-PLAN.md — Cytoscape graph visualisation, presentation view, filter/search/export controls
- [ ] 02-05-PLAN.md — Cognee sync pipeline: OWL generation on Cloud Run, sync button, stale indicator

### Phase 3: Data Dictionary
**Goal**: Users can manage a versioned taxonomy of 45+ fields across 7 categories with visual exploration
**Depends on**: Phase 1
**Requirements**: DD-01, DD-02, DD-03, DD-04, DD-05, DD-06, DD-07, DD-08, DD-09
**Success Criteria** (what must be TRUE):
  1. User can view taxonomy fields grouped by 7 categories in an expandable DataTable, seeded from TaxonomyDataDic.json
  2. User can add, edit, and delete fields with a conditional form that adapts to value_type, and can manage categories
  3. User can view a colour-coded force-graph of categories, fields, and hierarchies, and switch to a table/tree view
  4. User can create and browse dictionary versions
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Rules Management
**Goal**: Users can author, version, and visualise structured classification rules that drive Cognee's content processing
**Depends on**: Phase 1
**Requirements**: RULES-01, RULES-02, RULES-03, RULES-04, RULES-05, RULES-06, RULES-07, RULES-08, RULES-09, RULES-10
**Success Criteria** (what must be TRUE):
  1. User can view a list of classification rules and create/edit them via structured form with terminology, audience, campaign, compliance, and fair balance sections
  2. User can navigate L0-L4 hierarchy with validation (L3 requires L2 brand, L4 requires market code)
  3. User can view version history with diff view and export rules as Markdown
  4. User can view a visual L0-L4 hierarchy tree/DAG with coverage matrix (brands x markets)
  5. Published rules are ingested by Cognee via /add endpoint
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Content Ingestion
**Goal**: Users can upload content files and track their processing status through the Cognee pipeline
**Depends on**: Phase 1, Phase 2 (ontology sync to Cognee)
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06, CONTENT-07
**Success Criteria** (what must be TRUE):
  1. User can drag-and-drop files (PDF, PPT, DOCX, HTML, images) for upload, including bulk upload
  2. Uploaded files are stored via signed URL flow to Supabase Storage
  3. Each file shows a status pipeline progressing through Uploaded, Ingesting, Cognified, Ready for Classification
  4. User can view a list of all uploaded content with metadata and current status
  5. Uploaded content is sent to Cognee /add endpoint on Cloud Run for processing
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

Note: Phases 2, 3, and 4 all depend on Phase 1 but not on each other. They are ordered by architectural priority (ontology establishes Cognee sync patterns used by later phases) but could theoretically be reordered.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure | 3/3 | Complete   | 2026-03-18 |
| 2. Ontology Management | 0/6 | Planned | - |
| 3. Data Dictionary | 0/2 | Not started | - |
| 4. Rules Management | 0/3 | Not started | - |
| 5. Content Ingestion | 0/2 | Not started | - |
