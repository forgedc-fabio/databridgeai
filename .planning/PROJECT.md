# DataBridge AI — Project Definition

## Vision

DataBridge AI is a content intelligence and data foundation platform purpose-built for pharmaceutical commercial operations. It extracts strategic intent from brand plans, journey designs, and content assets, encoding it as structured, relational data that contextualises every customer engagement against the brand strategy.

**Positioning:** The missing data foundation pharma needs for the human-AI partnership to work — making data trusted, unified, and ready to power intelligent engagement at scale.

**Tagline:** Confidence for Humans. Context for AI.

## Problem Statement

Pharma organisations generate rich strategic thinking during annual planning cycles, but that thinking is trapped in PowerPoints, spreadsheets, and people's heads. The **reasoning layer** — the strategic intent connecting a content asset to a brand objective, a journey plan to a conversion goal — was never treated as data.

The result: measurement environments that report *what happened* but cannot explain *why it mattered* in the context of the brand strategy. AI agents cannot reason about engagement without this context.

## Solution — v1 (Content Classification Pipeline)

v1 delivers an automated content intelligence system. Point it at a source of files (S3, SFTP, URL), AI agents extract metadata using governed rules and taxonomy, and structured results are stored in a queryable database with a dashboard.

### What v1 Does

1. **Ingest** — Connect to content sources (S3, SFTP, URL), crawl files, detect types
2. **Classify** — AI agents read each file, classify against rules and taxonomy, extract structured metadata
3. **Store** — Persist validated metadata to PostgreSQL with full audit trail
4. **Govern** — Rules and taxonomy documents control classification behaviour; updatable without code changes
5. **Visualise** — Dashboard showing classification results, job status, compliance flags, and ingestion stats
6. **Manage** — Upload/activate rules and taxonomy versions; trigger ingestion runs

### What v1 Does Not Do

- Customer profiling or segmentation (v2+ — Customer component)
- Channel performance measurement (v2+ — Channel component)
- Impact attribution or forecasting (v2+ — Impact component)
- Real-time monitoring or continuous ingestion
- Regulatory compliance sign-off (flags for triage only)

## Broader Vision (v2+)

The full platform implements a four-component Omnichannel Data Model:

| Component | Purpose | v1 Status |
|-----------|---------|-----------|
| **Content** | Contextual data applied to each content piece using common taxonomy | **In scope** |
| **Customer** | Unified customer profiles with interaction history, clinical context, behavioural/attitudinal segments | Deferred |
| **Channel** | Standardised interaction data enabling cross-channel performance comparison | Deferred |
| **Impact** | Attribution and forecasting combining engagement, cost, and strategic context | Deferred |

v1 schema and architecture are designed to accommodate these components without re-platforming.

## Target Users

### v1: ForgeDC Internal Team

- Fabio Barboza (technical lead) — building and validating
- ForgeDC colleagues — testing with real pharma content
- Goal: prove the classification pipeline works before client deployment

### Production Users (post-v1)

- VP/Director Omnichannel & Digital
- Head of Marketing Operations / MarTech
- Brand Directors / Franchise Leads
- Data & Analytics teams

## Tech Stack

| Layer | Technology | Flexibility |
|-------|-----------|-------------|
| Database | Supabase PostgreSQL (eu-west-1) | Fixed |
| Auth | Supabase Auth + RLS | Fixed |
| File storage | Supabase Storage | Fixed |
| Job queue | pg-boss (on Supabase Postgres) | Open to alternatives |
| API trigger | Supabase Edge Function (Deno) | Open to alternatives |
| Compute | GCP Cloud Run (europe-west1) | Fixed |
| Container registry | GCP Artifact Registry | Fixed |
| Secrets | GCP Secret Manager | Fixed |
| Frontend | Next.js (App Router) + shadcn/ui + Tailwind CSS | Fixed |
| Frontend hosting | GCP Cloud Run (custom domain, Google-managed SSL) | Open to alternatives |
| LLM | Anthropic Claude API (claude-sonnet-4) | Fixed |
| CI/CD | GitHub Actions | Fixed |
| Language (agents) | Python | Fixed |
| Validation | Pydantic | Fixed |

Core stack (Supabase, Cloud Run, Claude, Next.js, Python) is firm. Implementation details (job queue mechanism, dispatch patterns, edge function vs alternatives) are open to research-based challenge.

## Architecture

### Three Platforms

- **Supabase** — Data & control plane (database, auth, file storage, job queue, realtime)
- **GCP Cloud Run** — Compute (agents, orchestrator, frontend hosting)
- **Anthropic Claude API** — Intelligence (content classification)

### Monorepo Structure

```
databridgeai/
├── frontend/           # Next.js dashboard
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/
│   │   ├── rules/
│   │   └── ingest/
│   ├── components/
│   ├── lib/supabase/
│   ├── middleware.ts
│   └── Dockerfile
├── agents/             # Python AI agents
│   ├── source-connector/
│   ├── orchestrator/
│   └── pdf-agent/
├── shared/             # Shared Python library
│   ├── models.py
│   └── supabase_client.py
├── supabase/           # Database migrations & edge functions
│   ├── migrations/
│   └── functions/ingest/
└── .github/workflows/  # CI/CD
```

### Data Flow

```
User triggers run → Edge Function → Source Connector (crawl + detect + queue)
→ Orchestrator (poll + dispatch) → Agent (fetch rules + classify via Claude + validate + store)
→ Dashboard (realtime updates)
```

### Key Design Principles

1. **Rules-driven, not code-driven** — Classification logic in versioned documents, not application code
2. **Scale to zero** — Agent workers only run when work exists
3. **Auditable** — Every record retains raw agent output, rules version, and source URL
4. **Separation of concerns** — Supabase owns data, GCP owns compute, Anthropic owns intelligence

## v1 Build Phases (from Build Brief)

| Step | Component | Description |
|------|-----------|-------------|
| 1 | Supabase Schema | DDL for jobs, rules_versions, taxonomy_versions, content_metadata + RLS + storage buckets |
| 2 | Shared Python Library | Pydantic models + Supabase client |
| 3 | Source Connector | Crawl sources, detect MIME types, queue jobs |
| 4 | Orchestrator | Poll job queue, dispatch to correct agent |
| 5 | PDF Agent | Fetch rules/taxonomy, classify PDF content via Claude, validate and store |
| 6 | Edge Function | Authenticated trigger endpoint (fire-and-forget) |
| 7 | CI/CD | GitHub Actions with Workload Identity Federation |
| 8 | Frontend | Login, Dashboard, Rules Manager, Ingestion Trigger |

Additional file types (HTML, Image, DOCX, CSV) need import and storage capability but full agent classification is deferred.

## Governance

### Rules & Taxonomy

- Rules document and taxonomy dictionary **already exist** and govern agent classification behaviour
- Both are versioned in Supabase Storage
- Updatable via the Rules Manager UI — no code changes needed
- Running jobs complete against the version they started with

### Access Control

| Role | Dashboard | Trigger Runs | Manage Rules | Export Data |
|------|-----------|-------------|-------------|-------------|
| Admin | Yes | Yes | Yes | Yes |
| Viewer | Yes | No | No | Yes |

## Security Constraints

- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must never appear in source files — Secret Manager only
- Rules and taxonomy fetched at runtime from Supabase Storage — never hardcoded
- RLS enabled on all tables
- All Python code must use type hints
- All Dockerfiles must use multi-stage builds

## Success Criteria (v1)

1. PDF content successfully classified against rules and taxonomy with >0.8 confidence
2. End-to-end pipeline working: trigger → crawl → classify → store → display
3. Dashboard showing real-time job status and classification results
4. Rules and taxonomy updatable without code deployment
5. ForgeDC team can ingest a batch of test files and query structured results
6. All infrastructure deployed via CI/CD to GCP

## Infrastructure

| Service | Detail |
|---------|--------|
| GitHub | [ForgeDC/databridgeai](https://github.com/ForgeDC/databridgeai) |
| Supabase Project | databridgeai (`vkdcliaocklnlbthwdpx`) |
| Supabase Org | Forge DC (`uwyhxwvvzcqywaakvgke`) |
| GCP Region | europe-west1 |
| Supabase Region | eu-west-1 |

## Dependencies

- Anthropic Claude API access (claude-sonnet-4)
- GCP project with Cloud Run, Artifact Registry, Secret Manager enabled
- Supabase project (exists: databridgeai)
- GitHub repository (exists: ForgeDC/databridgeai)
- Rules and taxonomy documents (exist)
- Test content files (not yet defined)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Classification quality depends on rules/taxonomy quality | Low confidence, poor metadata | Iterative rules refinement; audit trail enables reprocessing |
| Claude API latency/cost at scale | Slow processing, high costs | Batch processing, caching, model selection per agent |
| pg-boss on Supabase Postgres may have limitations | Job queue reliability | Research alternatives during planning |
| Single-developer project | Bus factor | Clean code, documentation, GSD planning |

---

*Generated by GSD new-project flow | 2026-03-18*
