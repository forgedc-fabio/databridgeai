# DataBridge AI

## What This Is

An automated content intelligence system for pharmaceutical commercial operations. Users upload content files (PDFs, HTML pages, images, Word documents, spreadsheets) via a web dashboard, AI agents classify each file against governed rules and taxonomy, and structured metadata is stored in a queryable database. The system's classification behaviour is controlled by versioned documents, not code — rules and taxonomy can be updated without redeployment.

Built as a reusable product for Forge DC. v1 is validated internally before client deployment.

## Core Value

Content uploaded to the system is accurately classified against the active rules and taxonomy, with structured metadata queryable via the dashboard — without any human reading a single file.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Supabase schema with jobs, rules_versions, taxonomy_versions, content_metadata tables + RLS
- [ ] Storage buckets for agent context (rules, taxonomy, prompts) and source content
- [ ] Shared Python library with Pydantic validation models and Supabase client
- [ ] Source connector that crawls content sources, detects MIME types, and queues jobs
- [ ] Orchestrator that polls job queue and dispatches to correct agent
- [ ] PDF agent that classifies content via Claude API against active rules/taxonomy
- [ ] Supabase Edge Function as authenticated trigger endpoint
- [ ] GitHub Actions CI/CD deploying agents to GCP Cloud Run
- [ ] Next.js frontend on Vercel with login, dashboard, rules manager, and ingestion trigger
- [ ] Admin account creation and role assignment
- [ ] Real-time job status updates via Supabase Realtime
- [ ] Import and storage capability for HTML, Image, DOCX, and CSV files

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Customer profiling/segmentation — v2+ (Customer component of broader data model)
- Channel performance measurement — v2+ (Channel component)
- Impact attribution/forecasting — v2+ (Impact component)
- Real-time continuous monitoring — system processes on-demand when triggered
- Regulatory compliance sign-off — flags are for triage only, not legal approval
- Full classification agents for HTML/Image/DOCX/CSV — v2 (import and storage only in v1)
- Mobile app — web-first

## Context

**Product vision:** DataBridge AI is the first component of a broader Omnichannel Data Model with four pillars (Content, Customer, Channel, Impact). v1 builds the Content pillar as a standalone product. Architecture is designed to accommodate the other three pillars without re-platforming.

**Positioning:** "The missing data foundation pharma needs for the human-AI partnership to work." Tagline: "Confidence for Humans. Context for AI."

**Target users (v1):** ForgeDC internal team — Tom Botting (product owner), Fabio Barboza (technical lead), and colleagues validating with real pharma content.

**Production users (post-v1):** VP/Director Omnichannel & Digital, Head of Marketing Operations/MarTech, Brand Directors, Data & Analytics teams.

**Rules & taxonomy:** Already exist. Versioned in Supabase Storage, updatable via Rules Manager UI. Running jobs complete against the version they started with.

**Classification model:** Five-level hierarchy (L0 domain → L1 sector → L2 therapeutic area → L3 condition → L4 product) plus metadata fields (language, title, brand, audience, content format, channel, key claims, compliance signals).

**Build brief:** A detailed technical build brief exists in NinjaWiki with exact schema DDL, Pydantic models, agent code patterns, and Cloud Run specs. Available at `NinjaWork/ForgeDC/_internal/DataBridgeAI/Briefs/architecture-build-brief.md`.

## Constraints

- **Tech stack (fixed):** Supabase PostgreSQL, Supabase Auth + RLS, GCP Cloud Run (europe-west1), Anthropic Claude API (claude-sonnet-4), Next.js on Vercel, Python agents, Pydantic validation, GitHub Actions CI/CD
- **Tech stack (flexible):** Job queue (pg-boss specified but open to alternatives), API trigger (Edge Function specified but open to alternatives)
- **Security:** SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY must never appear in source files — GCP Secret Manager only. RLS enabled on all tables. Multi-stage Docker builds.
- **Code standards:** All Python code must use type hints. All Dockerfiles must use multi-stage builds.
- **Deployment:** Vercel auto-deploys frontend from GitHub. Supabase Vercel Integration syncs credentials. GCP Cloud Run for agents/orchestrator.
- **Single developer:** Built and maintained by one developer with AI assistance — code must be clean, documented, and maintainable.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frontend on Vercel (not Cloud Run) | Native Next.js support, preview deployments on PRs, Supabase integration for credential sync | -- Pending |
| Supabase for data + auth + storage | Unified data plane, built-in RLS, Realtime subscriptions, Edge Functions | -- Pending |
| GCP Cloud Run for agents | Scale-to-zero containers, pay-per-use, europe-west1 region | -- Pending |
| Rules-driven classification | Decouples classification logic from code, enables non-technical updates | -- Pending |
| PDF agent only for v1 classification | Prove pattern with one agent, other file types get import/storage only | -- Pending |
| Admin-only account creation | Controlled access for internal validation phase | -- Pending |
| Monorepo structure | Frontend, agents, shared lib, and infra in one repo for single-developer workflow | -- Pending |

---
*Last updated: 2026-03-18 after initialization*
