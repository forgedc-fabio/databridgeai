# Project Research Summary

**Project:** DataBridge AI
**Domain:** Pharma content intelligence / AI document classification pipeline
**Researched:** 2026-03-18
**Confidence:** MEDIUM (stack HIGH via live verification; features/architecture/pitfalls MEDIUM via training data)

## Executive Summary

DataBridge AI is a **content intelligence layer** for pharmaceutical organisations — not a CMS, not an MLR workflow tool, not a search engine. Its core value proposition is automated, rules-driven classification of content assets using an LLM, producing structured metadata that downstream systems can consume. The recommended build approach is a triggered pipeline architecture: a user-initiated ingest request fans out into per-file classification jobs processed by ephemeral Cloud Run containers, with Supabase as the shared data backbone and Anthropic Claude as the classification engine. The "rules-as-documents" paradigm — where classification behaviour is governed by uploaded JSON documents rather than code or ML model retraining — is the system's strongest differentiator and must be protected as a first-class architectural concern throughout every phase.

The stack is well-constrained by existing infrastructure decisions (Supabase, GCP Cloud Run, Next.js 15, Python 3.12) and the research confirms these choices are sound. Two deviations from the original build brief are recommended with HIGH confidence: replace pg-boss with direct Postgres polling using `SELECT ... FOR UPDATE SKIP LOCKED` (pg-boss is Node.js-only and incompatible with the Python agent ecosystem), and reverse the PDF extraction library priority to use PyMuPDF as primary (5-10x faster, includes OCR integration) with pdfplumber as fallback. All version numbers have been verified live against PyPI and npm registries.

The dominant risks are not technical — they are correctness and trust risks specific to pharma. LLM non-determinism, version drift mid-batch, audit trail gaps, and compliance flags treated as passive metadata are all patterns that would cause a pharma client to lose confidence in the system. These risks must be addressed in Phase 1 at the schema and agent design level, not retrofitted later. The architecture supports prevention of all these pitfalls through version-pinning, structured output via tool use, mandatory `raw_extraction` storage, and prominent compliance flag surfacing on the dashboard.

---

## Key Findings

### Recommended Stack

The stack is almost entirely fixed by existing infrastructure decisions. Versions have been verified live against package registries (2026-03-18). The two key recommendations that override the build brief are: (1) drop pg-boss entirely in favour of direct Postgres polling — it is a Node.js library incompatible with the Python agent ecosystem — and (2) use PyMuPDF as the primary PDF extraction library rather than pdfplumber, due to significantly better performance, lower memory usage, and built-in OCR support for scanned documents (common in pharma).

See `.planning/research/STACK.md` for full dependency manifests with pinned versions.

**Core technologies:**
- **Next.js 15 + shadcn/ui 4 + Tailwind 4:** Frontend — pin to v15, not v16; shadcn/ui and `@supabase/ssr` not yet verified on v16
- **Supabase (Postgres + Auth + Storage + Realtime + Edge Functions):** Unified backend — JWT-based RLS, Realtime WebSocket subscriptions, Deno Edge Functions as the trigger layer
- **GCP Cloud Run (Jobs + Service):** Agents run as ephemeral Jobs; Orchestrator and Frontend run as always-on Services
- **Python 3.12 + Pydantic 2.12 + supabase-py 2.28:** Agent language and shared model validation — use 3.12, not 3.13 (C-extension wheel availability)
- **Anthropic Claude (claude-sonnet-4-20250514):** Classification engine — use tool use / structured output, not free-text JSON
- **PyMuPDF 1.27 (primary) + pdfplumber 0.11 (fallback):** PDF extraction — PyMuPDF is faster, lower memory, includes OCR integration
- **structlog 25.5 + google-cloud-logging 3.14:** Structured JSON logging — Cloud Logging parses structlog output into queryable fields; never use stdlib `logging` directly
- **tenacity 9.1:** Retry logic for Claude API and external fetches — exponential backoff with jitter, handles 429/529 responses
- **Direct Postgres polling (`FOR UPDATE SKIP LOCKED`):** Job queue — replaces pg-boss; zero dependencies, fully visible in the `jobs` table, safe for concurrent orchestrators

### Expected Features

DataBridge AI operates at the intersection of pharma content management (Veeva Vault PromoMats dominates this space) and AI document processing (Rossum, Hyperscience, ABBYY Vantage). Its positioning is narrower and more focused: an intelligence layer that sits alongside existing CMS platforms rather than replacing them. The "rules-as-documents" paradigm and LLM-powered classification (no training data required) are genuine differentiators versus traditional ML-based competitors.

See `.planning/research/FEATURES.md` for full feature analysis with competitive context.

**Must have (table stakes):**
- Multi-format ingestion (PDF, HTML, DOCX, images) — pharma content lives in diverse formats
- Source connectors for S3, SFTP, and URL — enterprise content lives in diverse storage systems
- Hierarchical taxonomy classification (L0-L4) with confidence scoring — industry standard metadata structure
- Audience segmentation, brand association, language detection, channel attribution — fundamental pharma metadata dimensions
- Compliance flags (Missing ISI, Off-label Risk, PII) — pharma regulatory triage, prominently surfaced in UI
- Versioned rules and taxonomy with active-version management — core governance and key differentiator
- Audit trail (raw extraction storage, rules version pinned per job) — non-negotiable for pharma
- Dashboard with real-time job status, compliance alert panel, classification distribution charts

**Should have (competitive differentiators):**
- Confidence threshold routing — low-confidence results flagged for human review
- Source deduplication — prevents reprocessing, reduces Claude API costs
- CSV/JSON export — required for enterprise adoption, table stakes pre-client deployment
- Manual override with audit logging — users need a correction path that reinforces rules-as-documents

**Defer to v2+:**
- Classification agents for HTML, images, DOCX, CSV (v1 classifies PDF only)
- Content library analytics (strategic portfolio views)
- Reclassification on rule change with before/after impact
- Multi-tenant architecture (required before commercial deployment, design schema for it now)
- REST API for downstream integrations
- SharePoint source connector (very common in pharma orgs)
- Adverse event detection as a compliance flag type

**Explicit anti-features (never build):**
- Full CMS with check-in/check-out workflows — Veeva owns this, competing is a losing battle
- MLR review workflows — deeply embedded in existing tooling, multi-year effort with compliance risk
- Content editing — DataBridge AI is read-only on content, write-only on metadata
- Real-time streaming ingestion — pharma content is batch-updated, not streamed
- Semantic / natural language search — a different product requiring a different architecture
- User annotation / labelling UI — wrong product category; corrections should update rules, not individual records

### Architecture Approach

DataBridge AI follows a **triggered pipeline** architecture with fire-and-forget dispatch at every inter-component boundary. An Edge Function serves as the authenticated trigger layer (thin Deno proxy, no business logic), a polling Orchestrator (Cloud Run Service, always-on) dispatches ephemeral agent containers (Cloud Run Jobs), and Supabase serves as the shared state store, file store, and Realtime notification bus. The critical structural principle is that the Orchestrator is stateless — agents self-report their own outcomes to the `jobs` table, and the database is the single source of truth for all job state.

See `.planning/research/ARCHITECTURE.md` for full component diagrams, code patterns, and anti-patterns.

**Major components:**
1. **Edge Function (Deno)** — validates Supabase JWT, generates `run_id`, triggers Source Connector Cloud Run Job, returns immediately (fire-and-forget)
2. **Source Connector (Cloud Run Job)** — crawls S3/SFTP/URL source, detects MIME types, snapshots active rules version, creates one `jobs` row per file; does NOT download files
3. **Orchestrator (Cloud Run Service, always-on)** — polls `jobs` table every 5s with `FOR UPDATE SKIP LOCKED`, dispatches typed Cloud Run Jobs per `agent_type`, detects stale jobs (stuck in `running` > 10 min)
4. **PDF Agent (Cloud Run Job)** — downloads file via signed URL, fetches rules/taxonomy by version label from job record, calls Claude via tool use, validates Pydantic response, upserts `content_metadata`, self-reports status
5. **Frontend (Next.js 15 / Vercel)** — auth, dashboard with Supabase Realtime subscriptions, Rules Manager UI, Ingestion Trigger UI; uses anon key + RLS only
6. **Supabase** — Postgres (jobs, content_metadata, rules_versions, taxonomy_versions), Auth (JWT with custom role claims), Storage (agent-context, source-content buckets), Realtime (postgres_changes on jobs + content_metadata)

**Key patterns to follow:**
- Fire-and-forget dispatch at every boundary (prevents cascading timeouts)
- Self-reporting agents (Orchestrator stateless, agents own their status)
- Stale job detection on every Nth poll cycle
- Idempotent job processing (check status before processing, upsert on `content_metadata.job_id`)
- Version-pinned jobs (Source Connector snapshots active rules version at job creation, agents read from job record — never re-query `is_active = true`)
- Immutable rules storage (versioned paths, never `rules/current.json`)

### Critical Pitfalls

Seven critical pitfalls identified; all preventable in Phase 1 if addressed at design time rather than retrofit. The two with highest recovery cost are LLM non-determinism (requires rebuilding extraction logic) and missing audit trail (retroactive reconstruction may be impossible).

See `.planning/research/PITFALLS.md` for full prevention strategies, warning signs, and recovery steps.

1. **LLM output non-determinism** — Use Claude tool use / structured output with enum-constrained parameters from day one; never free-text JSON. Pin taxonomy values as literals in Pydantic models. Add a confidence threshold gateway (< 0.85 routes to human review). *Prevention: Phase 1 PDF Agent design.*

2. **Rules/taxonomy version drift mid-batch** — Source Connector must snapshot the active rules version when creating job rows. Agents must read the version from their job record, never re-query `WHERE is_active = true`. *Prevention: Phase 1 Schema + Source Connector.*

3. **PDF text extraction producing silent garbage** — Pharma PDFs have complex layouts, scanned pages, non-standard fonts. Add a text quality gate (length + entropy check) before sending to Claude. Store extracted text in `raw_extraction`. Flag jobs as `needs_ocr` rather than classifying garbage. *Prevention: Phase 1 PDF Agent.*

4. **Audit trail gaps** — `raw_extraction` must be `NOT NULL` in schema. Rules documents must use versioned storage paths (never overwrite). `triggered_by` must reference `auth.users(id)`, not a free-text string. *Prevention: Phase 1 Schema design.*

5. **RLS policies silently broken** — Custom JWT claims (`role = 'admin'`) must be explicitly configured in Supabase Auth; they do not set themselves. Test every RLS policy with a non-service-role client during development. Never test exclusively via service role key. *Prevention: Phase 1 Schema + Frontend.*

6. **Compliance flags treated as passive metadata** — Compliance flags have operational semantics; they require action, not just storage. Surface a "Compliance Alerts" panel on the main dashboard from Phase 1. Add `compliance_status` column (`pending_review`, `reviewed`, `cleared`, `escalated`). *Prevention: Phase 1 Frontend Dashboard.*

7. **pg-boss incompatibility with Supabase** — pg-boss is Node.js only, conflicts with PgBouncer transaction mode, requires session-level LISTEN/NOTIFY. Drop it. Use `SELECT ... FOR UPDATE SKIP LOCKED` on the `jobs` table. This was the recommended resolution, not a fallback. *Prevention: Phase 1 Architecture decision — already resolved.*

---

## Implications for Roadmap

The dependency chain is clear from architecture research and enforced by the pitfall analysis: schema integrity and agent correctness must come before any user-facing features. All critical pitfalls resolve to Phase 1 concerns.

### Phase 1: Foundation and Data Layer

**Rationale:** Every other component depends on schema, auth, and storage being correct. RLS policies and audit trail constraints must be baked in at migration time — they cannot be retrofitted. The rules/taxonomy version-pinning pattern is a schema-level design decision that affects every agent downstream.

**Delivers:** Postgres schema with all tables, RLS policies, storage buckets, auth configuration with custom role claims, shared Python library with Pydantic models.

**Must implement:**
- All tables (`jobs`, `content_metadata`, `rules_versions`, `taxonomy_versions`) with correct constraints
- `raw_extraction NOT NULL` constraint
- `triggered_by_user_id UUID REFERENCES auth.users(id)` (not free-text)
- `content_metadata_job_id_unique` constraint for idempotent upserts
- `compliance_status` column on `content_metadata`
- Versioned storage paths convention for rules/taxonomy
- Supabase Auth with custom `role` JWT claim configured
- Shared Python library: Pydantic models, Supabase client wrapper, structlog setup, tenacity retry decorators

**Avoids:** Audit trail gaps (Pitfall 7), RLS silent failures (Pitfall 4), version drift (Pitfall 2)

**Research flag:** Standard patterns — skip research-phase.

---

### Phase 2: Pipeline Core (Source Connector + Orchestrator + PDF Agent)

**Rationale:** The pipeline must work end-to-end before the frontend has anything to show. Source Connector, Orchestrator, and PDF Agent form the value-generating core. This phase produces the first actual classifications.

**Delivers:** Working end-to-end classification pipeline for PDF files from S3, SFTP, and URL sources.

**Must implement:**
- Source Connector: strategy pattern (S3Connector, SFTPConnector, URLConnector), MIME type detection via python-magic, rules version snapshot at job creation, batch job insertion
- Orchestrator: asyncpg connection pool, 5s polling loop with `FOR UPDATE SKIP LOCKED`, async Cloud Run Job dispatch (fire-and-forget), stale job detection
- PDF Agent: PyMuPDF primary / pdfplumber fallback, text quality gate (length + entropy), Claude tool use with enum-constrained taxonomy parameters, Pydantic validation, idempotent `content_metadata` upsert, self-reporting status
- All agents: structlog JSON logging, tenacity retry on Claude API calls, multi-stage Docker builds, GCP Secret Manager for secrets

**Must avoid:**
- Free-text Claude JSON responses (Pitfall 1 — use tool use from day one)
- Agent re-querying `is_active = true` (Pitfall 2 — read version from job record)
- Processing garbage PDF text without quality gate (Pitfall 3)
- pg-boss (Pitfall 6 — confirmed as wrong approach)

**Research flag:** Cloud Run Jobs dispatch pattern is well-documented. Claude tool use / structured output worth validating against current API docs during implementation — MEDIUM confidence on specifics.

---

### Phase 3: Trigger Layer and CI/CD

**Rationale:** The pipeline can be tested manually (direct DB inserts) until the trigger layer is in place. CI/CD should be established before the frontend build to enforce quality from the start.

**Delivers:** Authenticated API trigger via Supabase Edge Function, GitHub Actions CI/CD pipeline for build/test/deploy.

**Must implement:**
- Edge Function (Deno): JWT validation, `run_id` generation, Cloud Run Job trigger via GCP service account, fire-and-forget response
- GCP service account with `roles/run.invoker` only, key stored in Supabase Edge Function secrets
- GitHub Actions: Docker build + push to Artifact Registry, Cloud Run deploy, Vercel deploy on merge to main
- Rate limiting on Edge Function trigger (max N triggers per user per hour)

**Research flag:** Edge Function to GCP auth chain (Supabase JWT → service account → Cloud Run API) is the most novel integration. Verify against current Supabase Edge Function docs during implementation. MEDIUM confidence.

---

### Phase 4: Frontend — Auth, Dashboard, and Compliance Panel

**Rationale:** Frontend can be built once the pipeline produces data. The dashboard, compliance panel, and real-time subscriptions are the primary user interface for the system. Compliance flags must be prominently surfaced here — deferring the compliance panel to a later phase would deploy the system without its most critical safety feature.

**Delivers:** Next.js 15 frontend with login, dashboard (live job status, compliance alert panel, classification charts), Supabase Realtime subscriptions.

**Must implement:**
- Auth: Supabase `@supabase/ssr` middleware, protected routes, admin/viewer role display
- Dashboard: stat cards, bar chart (L0 category distribution, Recharts), line chart (ingestion volume, 30 days), recent jobs table with status, **Compliance Alerts panel** (unreviewed flag count + severity, `compliance_status` acknowledge workflow), Supabase Realtime subscription with filter and component unmount cleanup
- All dashboard queries: `LIMIT/OFFSET` pagination from day one (default 50 rows), date range defaulting to last 7 days

**Avoids:** Compliance flags as passive metadata (Pitfall 5), RLS silent failures (verify all queries via anon key, not service role)

**Research flag:** Standard Next.js + Supabase patterns — skip research-phase.

---

### Phase 5: Rules Manager and Ingestion Trigger UI

**Rationale:** The Rules Manager completes the self-service governance capability that is DataBridge AI's core differentiator. Non-technical users can update classification logic without code deployment. Ingestion Trigger UI closes the loop for user-initiated processing.

**Delivers:** Rules Manager UI (upload, version, activate rules/taxonomy), Ingestion Trigger UI (source config form, ingestion submission, live batch progress).

**Must implement:**
- Rules Manager: file upload to `agent-context/` bucket with versioned path, version list with active indicator, activate/deactivate with confirmation dialog (show in-flight job count, prevent deactivating last active), admin-only write enforced by RLS
- Ingestion Trigger UI: source type selector (S3/SFTP/URL) with credential fields, submit to Edge Function, live progress display (X of Y jobs completed via Realtime), link to dashboard on completion

**Research flag:** Standard patterns — skip research-phase.

---

### Phase 6: Non-PDF Import Pipeline and v1.x Enhancements

**Rationale:** HTML, images, DOCX, and CSV files are imported and stored in v1 scope but not classified. This phase adds the remaining import agents and early post-validation enhancements.

**Delivers:** Import agents for HTML, images (validation only), DOCX, CSV; confidence threshold routing; source deduplication; CSV/JSON export.

**Must implement:**
- HTML import agent (beautifulsoup4 + httpx, content stored to `source-content` bucket)
- Image import agent (Pillow format validation + metadata extraction)
- DOCX import agent (python-docx integrity validation)
- Confidence threshold routing: jobs below configurable threshold routed to `needs_review` status
- Source deduplication: content hash on import, skip re-processing if hash exists
- CSV/JSON metadata export from dashboard

**Research flag:** HTML agent JavaScript-rendering question — confirm whether target pharma sites use static HTML or React/SPA (Playwright would be required for latter). Likely static but worth verifying with client. MEDIUM confidence.

---

### Phase Ordering Rationale

- Schema integrity before everything: audit trail constraints, version-pinning, and RLS cannot be retrofitted cheaply
- Pipeline before frontend: the dashboard has nothing to show until jobs complete; building the UI first creates wasted UI work
- PDF classification before other formats: PDF is the primary pharma format and the primary value demonstration; other formats can wait
- Compliance panel in the same phase as the dashboard (Phase 4), not deferred: this is the most consequential UX decision, motivated directly by PITFALLS.md Pitfall 5
- Rules Manager before other UI enhancements (Phase 5): it completes the core product proposition before adding convenience features
- Non-PDF import in Phase 6: this is a width expansion (more formats), not a depth expansion; the core pipeline is proven before widening it

### Research Flags

**Needs implementation-time verification (MEDIUM confidence areas):**
- **Phase 2 (PDF Agent):** Claude tool use / structured output — verify current API parameters for tool use against Anthropic docs; enum constraint mechanism may have changed since training data
- **Phase 3 (Edge Function):** Supabase Edge Function to GCP Cloud Run auth chain — verify Deno-compatible GCP client library or REST API call pattern; outbound HTTPS from Edge Functions confirmed but specific GCP API call pattern needs live verification
- **Phase 3 (Edge Function):** Edge Function secrets mechanism — verify current Supabase Edge Function secrets API (Deno vs Node runtime differences)
- **Phase 6 (HTML Agent):** Confirm whether target pharma content URLs use static HTML or JavaScript-rendered SPAs before committing to httpx + beautifulsoup4

**Standard patterns (skip research-phase):**
- **Phase 1 (Schema):** Postgres RLS, partial unique indexes, Supabase Auth custom claims — well-documented
- **Phase 2 (Orchestrator):** `FOR UPDATE SKIP LOCKED` polling — PostgreSQL 9.5+ stable feature, HIGH confidence
- **Phase 4 (Frontend):** Next.js 15 App Router + Supabase SSR + Recharts — all well-documented, established patterns
- **Phase 5 (Rules Manager):** Supabase Storage upload + versioning — standard patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All version numbers verified live via PyPI/npm on 2026-03-18. pg-boss rejection is HIGH confidence (Node.js-only, confirmed). PyMuPDF vs pdfplumber performance claims MEDIUM (training data, widely reported). |
| Features | MEDIUM | Competitor feature sets based on training data (cutoff ~May 2025). No live competitor product verification. Rules-as-documents differentiator analysis is HIGH confidence (direct architectural analysis). |
| Architecture | MEDIUM-HIGH | Core patterns (Postgres job queues, Cloud Run Jobs, Supabase Realtime) are well-established and unlikely to have changed. Edge Function to GCP auth chain is the least-verified integration point. |
| Pitfalls | MEDIUM | Pharma regulatory requirements (ISI, off-label rules) and pg-boss/Supabase incompatibility are HIGH confidence. Claude API structured output behaviour should be verified against current docs. |

**Overall confidence:** MEDIUM-HIGH

The stack is the most solid part of the research (verified live). The architecture patterns are standard and well-established. The features and pitfalls are based on training data with no live web verification, but the domain knowledge is stable (pharma regulatory requirements do not change quickly).

### Gaps to Address

- **Claude tool use structured output specifics:** Verify current parameter schema for tool use in the Anthropic Python SDK before building the PDF Agent. The enum-constraint pattern is correct in principle but API details may have evolved.
- **Supabase Edge Function + GCP auth chain:** Verify the specific mechanism for calling `run.googleapis.com` from a Deno Edge Function (REST API call with service account JWT vs. using a GCP client library). This is a real implementation risk.
- **Supabase custom JWT claims configuration:** The admin RLS policy depends on `auth.jwt() ->> 'role' = 'admin'`. Verify the current Supabase mechanism for setting custom claims (custom access token hook vs. manual assignment). This must work before Rules Manager is usable.
- **PyMuPDF AGPL-3.0 licence:** Standard interpretation is that SaaS use does not trigger AGPL disclosure requirements. Recommend a brief legal review before client deployment given the pharma context.
- **paramiko 4.0.0 SFTP compatibility:** v4 dropped some legacy cryptographic algorithms. Verify SFTP connectivity with target client SFTP servers before committing to v4. If legacy algorithm support is needed, consider paramiko 3.x.
- **Tailwind CSS 4 + shadcn/ui v4 stability:** Both are relatively new. If issues arise during `npx shadcn@latest init`, fall back to Tailwind 3.4.19.
- **Multi-tenant schema design:** Must be considered at schema design time (Phase 1) even though multi-tenancy is not implemented until v2. The schema should support tenant isolation without a full migration rewrite later.

---

## Sources

### Primary (HIGH confidence — live verified)
- PyPI package registry — all Python package versions verified 2026-03-18
- npm registry — all Node.js package versions verified 2026-03-18
- Project build brief: `NinjaWork/ForgeDC/_internal/DataBridgeAI/Briefs/architecture-build-brief.md`
- Project plan: `.planning/PROJECT.md`

### Secondary (MEDIUM confidence — training data, well-established)
- PostgreSQL documentation — `FOR UPDATE SKIP LOCKED`, partial unique indexes, RLS
- GCP Cloud Run Jobs documentation — ephemeral job pattern, env var overrides
- Supabase documentation — Realtime `postgres_changes`, Edge Functions, Storage, Auth custom claims
- pg-boss GitHub repository — Node.js-only confirmation

### Tertiary (MEDIUM confidence — training data, domain knowledge)
- Pharma content management market analysis — Veeva dominance, MLR workflow tooling
- PyMuPDF vs pdfplumber performance comparison — widely reported, not independently benchmarked
- Claude API structured output behaviour — verify against current Anthropic docs before implementation
- AGPL-3.0 SaaS licence interpretation — recommend legal review for pharma client context

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
