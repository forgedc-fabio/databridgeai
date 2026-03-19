# DataBridge AI

## What This Is

A content intelligence platform for pharmaceutical commercial operations. Users manage ontologies, data dictionaries, and classification rules via a web UI, upload content files for AI-powered classification using Cognee (open-source knowledge graph framework), and view structured metadata results. The system uses ontology-driven entity extraction — not raw LLM prompting — to produce governed, consistent classifications.

Built as a reusable product for Forge DC. v1 is validated internally before client deployment.

## Core Value

Content uploaded to the system is accurately classified against a user-defined ontology, data dictionary, and rule set — using Cognee's knowledge graph pipeline — with structured metadata queryable via the dashboard.

## Requirements

### Validated

- [x] Deploy infrastructure (Vercel + Supabase + Cloud Run with Cognee) — Validated in Phase 01: Infrastructure
- [x] Ontology editor UI (classes, properties, hierarchies, constraints) — Validated in Phase 02: Ontology Management
- [x] Ontology visualisation (read-only, presentation mode, export) — Validated in Phase 02: Ontology Management
- [x] Ontology sync to Cognee (OWL/RDF generation, stale indicator) — Validated in Phase 02: Ontology Management

### Active
- [ ] Data dictionary management (45+ fields across 7 categories, versioning)
- [ ] Data dictionary visualisation (graph and table/tree views)
- [ ] Rules editor (structured L0-L4 hierarchy, JSONB, versioned, Markdown export)
- [ ] Rules hierarchy visualisation (tree/DAG, coverage matrix)
- [ ] Content upload (drag-and-drop, signed URLs, bulk, status pipeline)
- [ ] Content list/view UI

### Out of Scope

- Customer profiling/segmentation — v2+ (Customer component)
- Channel performance measurement — v2+ (Channel component)
- Impact attribution/forecasting — v2+ (Impact component)
- Full classification results dashboard — v2 (v1 focuses on upload + status pipeline)
- Mobile app — web-first
- MLR review workflows — pharma orgs have existing tools
- Content editing — read-only on content, write-only on metadata

## Context

**Product vision:** DataBridge AI is the Content pillar of a broader Omnichannel Data Model (Content, Customer, Channel, Impact). v1 builds the content intelligence foundation.

**Positioning:** "The missing data foundation pharma needs for the human-AI partnership to work." Tagline: "Confidence for Humans. Context for AI."

**Target users (v1):** ForgeDC internal team — Tom Botting (product owner), Fabio Barboza (technical lead).

**Cognee:** Open-source AI framework for knowledge graph construction and entity extraction. Self-hosted on Cloud Run. Uses ontology files (OWL/RDF) to constrain extraction. NetworkX graph store runs inside the container.

**Data dictionary:** 45+ taxonomy fields across 7 categories. Seed data exists in `TaxonomyDataDic.json`. Fields have: field_name, label, definition, value_type, enum values, governance, tagging method.

**Classification model:** Five-level hierarchy (L0-L4) with structured rules per level covering terminology, audience defaults, campaign detection, compliance flags, fair balance.

## Constraints

- **Tech stack (fixed):** Vercel (Next.js frontend, free tier), Supabase (Auth + Postgres + Storage), GCP Cloud Run (Cognee FastAPI), Anthropic Claude API (via Cognee), shadcn/ui + Tailwind CSS
- **Frontend libraries:** react-cytoscapejs (ontology graph), react-force-graph (data dictionary/rules graphs), Recharts (charts)
- **Backend:** Cognee (Python, FastAPI) with rdflib for OWL generation
- **Security:** Secrets via GCP Secret Manager. RLS on all Supabase tables. Tenant-scoped data.
- **Deployment:** Vercel auto-deploys frontend. Supabase Vercel Integration syncs credentials. Cloud Run for Cognee.
- **Single developer:** Built and maintained by one developer with AI assistance.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cognee for classification (not direct Claude agents) | Knowledge graph + ontology-driven extraction produces governed, consistent results vs raw LLM prompting | -- Pending |
| Frontend on Vercel | Native Next.js support, preview deployments, Supabase integration | Validated — Phase 01 |
| Supabase for data + auth + storage | Unified data plane, RLS, Realtime, Storage for OWL files and content | Validated — Phase 01 |
| Cloud Run for Cognee | Scale-to-zero, pay-per-request, europe-west1 | Validated — Phase 01 |
| Ontology as first-class UI concept | Users define and manage the domain model directly, not just flat taxonomy | Validated — Phase 02 |
| Structured rules in JSONB (not raw documents) | Enables structured editing, validation, versioning, and Markdown export | -- Pending |
| react-cytoscapejs for ontology graphs | Supports editable DAG layouts, hierarchical views | Validated — Phase 02 |

---
*Last updated: 2026-03-19 — Phase 02 Ontology Management complete*
