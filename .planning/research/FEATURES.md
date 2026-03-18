# Feature Landscape

**Domain:** Pharma content intelligence and automated document classification
**Researched:** 2026-03-18
**Research mode:** Ecosystem (features dimension)
**Confidence:** MEDIUM (training data only — no web verification available)

---

## Competitive Context

DataBridge AI operates at the intersection of two established markets: **pharmaceutical content management** (dominated by Veeva Vault PromoMats, OpenText, Aprimo) and **AI-powered document classification** (a rapidly growing space with tools like Rossum, Hyperscience, ABBYY Vantage, and custom LLM pipelines). The critical distinction is that DataBridge AI is not a full content management system — it is a **content intelligence layer** that ingests, classifies, and structures metadata from existing content assets. This is a narrower, more focused value proposition.

Key competitors and adjacent products to benchmark features against:

| Product | Category | Relevance |
|---------|----------|-----------|
| Veeva Vault PromoMats | Pharma content lifecycle management | Market leader — defines table stakes for pharma |
| Acrolinx | Content intelligence / governance | Content scoring and compliance patterns |
| ABBYY Vantage | Intelligent document processing | Multi-format classification and extraction |
| Hyperscience | Document automation | Classification + extraction workflows |
| Saepio (now Elateral) | Digital asset management for pharma | Pharma-specific metadata and taxonomy |
| AWS Comprehend Medical | ML text analysis for healthcare | NER and medical entity extraction |
| Custom LLM pipelines | Internal tooling | Emerging competitor pattern |

---

## Table Stakes

Features users expect. Missing any of these and the product feels incomplete or untrustworthy for pharma use.

### Ingestion and Processing

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-format file ingestion (PDF, HTML, DOCX, images) | Every competitor handles multiple formats. Pharma content lives in diverse formats. | Medium | v1 scopes PDF classification only; others import/store. This is acceptable for internal validation but must expand before client deployment. |
| Source connector flexibility (S3, SFTP, URL) | Enterprise pharma content lives in diverse storage systems. S3 and SFTP are the minimum. | Medium | Already in scope. Consider SharePoint connector for v2 — very common in pharma orgs. |
| MIME type detection (not extension-based) | File extensions are unreliable. Misclassification of file type breaks downstream agents. | Low | Already specified (python-magic). Good decision. |
| Batch processing | Users will not trigger one file at a time. Ingesting entire content libraries is the norm. | Medium | Source connector already handles listing all files at a source. Ensure UX communicates batch progress. |
| Job queue with retry logic | Long-running AI classification fails intermittently. Without retries, users lose trust. | Medium | Already specified (pg-boss, 3 retries). |
| Processing status visibility | Users must know what happened to every file. "Did it work?" is the first question. | Low | Already in scope via Supabase Realtime on jobs table. |

### Classification and Metadata

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hierarchical taxonomy classification | Every pharma content system uses multi-level categorisation. The 5-level hierarchy (L0-L4) is standard practice. | Medium | Already in scope. Well-designed. |
| Confidence scoring | Users need to know which classifications to trust and which to review. Every ML/AI classification system provides this. | Low | Already in scope (0-1 numeric). |
| Audience segmentation tagging | Pharma content is always audience-specific (HCP, patient, consumer, internal). This is a fundamental metadata dimension. | Low | Already in scope with constrained enum. |
| Brand/product association | Pharma companies organise everything by brand. Missing brand metadata makes the output unusable for commercial teams. | Low | Already in scope. |
| Language detection | Pharma companies operate globally. Content exists in dozens of languages. Not detecting language makes multi-market content unmanageable. | Low | Already in scope. |
| Channel attribution | Knowing where content was published (email, web, social, print) is essential for omnichannel analytics. | Low | Already in scope. |
| Key claims extraction | Extracting the marketing claims from content is core to pharma compliance. Claims need to be traceable to source material. | Medium | Already in scope as JSONB array. Consider linking claims to source text positions in v2. |
| Compliance flag detection | Pharma content has strict regulatory requirements. Flagging potential issues (missing ISI, off-label risk, PII) is expected from any intelligence tool. | Medium | Already in scope. These are triage flags, not legal sign-off — this distinction is correct and important. |

### Governance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Versioned rules (update without code deploy) | Classification logic evolves as regulations and business needs change. Forcing redeployment for rule changes is a dealbreaker. | Medium | Already in scope and well-designed. This is a genuine strength. |
| Versioned taxonomy | Taxonomy evolves (new therapeutic areas, new product launches). Must be updatable independently. | Medium | Already in scope. |
| Active version management (one active at a time) | Running jobs must complete against the version they started with. New versions should not retroactively change in-flight classifications. | Medium | Already specified with unique index. Critical for audit trail. |
| Audit trail (raw extraction storage) | In pharma, you must be able to explain why a classification decision was made. Storing the raw LLM output is essential. | Low | Already in scope (raw_extraction JSONB). |

### Access and Security

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Authentication (email/password + magic link) | Basic access control. Pharma deals with sensitive content. | Low | Already in scope via Supabase Auth. |
| Role-based access (admin/viewer) | Not everyone should be able to change rules or trigger ingestion. Minimum viable RBAC. | Low | Already in scope. |
| Row-level security | Data isolation and access control at the database level. Expected in any enterprise-adjacent tool. | Low | Already in scope via Supabase RLS. |

### Dashboard and Reporting

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Classification distribution visualisation | Users need to see what their content library looks like — which categories dominate, where gaps exist. | Medium | Already in scope (bar chart by L0). |
| Ingestion volume over time | Understanding processing throughput and trends. | Low | Already in scope (line chart, 30 days). |
| Recent jobs table with status | Operational visibility into what the system is doing. | Low | Already in scope. |
| Summary statistics (totals, averages, failures) | At-a-glance health of the system and content library. | Low | Already in scope (stat cards). |
| Real-time updates | Users should not need to refresh to see job progress. | Medium | Already in scope via Supabase Realtime. |

---

## Differentiators

Features that set DataBridge AI apart from competitors. Not expected by every user, but valued when present. These create competitive moat.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Rules-as-documents paradigm** | Classification behaviour governed by uploaded JSON documents, not code or ML model retraining. Non-technical users can update classification logic. This is genuinely novel — most competitors require data science involvement to change classification. | Low (already designed) | This is DataBridge AI's strongest differentiator. Market it aggressively. |
| **LLM-powered classification (not traditional ML)** | Claude understands context, nuance, and can follow complex rules expressed in natural language. Traditional ML classifiers need training data and struggle with edge cases. LLM approach means zero training data needed and rules can be arbitrarily complex. | Low (already designed) | Genuine advantage. Traditional competitors (ABBYY, Hyperscience) use ML models that need labelled training sets. |
| **Pharma-specific compliance flagging** | Purpose-built compliance signals (Missing ISI, Off-label Risk, PII Detected) tuned for pharma regulatory requirements. Generic platforms flag generic issues. | Medium | Already partially in scope. Extend the flag vocabulary based on client feedback. |
| **Content library analytics** | Beyond individual file classification — aggregate views showing content portfolio composition, gap analysis, brand coverage, audience balance. | High | v2 feature. Dashboard already has basic charts. Extend to strategic content analysis (e.g., "Brand X has 47 HCP assets but only 3 patient assets"). |
| **Reclassification on rule change** | When rules or taxonomy are updated, ability to re-run classification against the content library using new rules. Shows before/after impact. | High | Not in current scope. Very valuable for rule development and validation. Add to v2/v3. |
| **Classification comparison / drift detection** | Compare classifications across rule versions. Detect when a rule change would reclassify significant portions of the library. | High | v2+ feature. Valuable for governance — prevents accidental rule changes from causing mass reclassification. |
| **Multi-tenant architecture** | Each client gets isolated data. Single deployment serves multiple pharma companies. | High | Not in v1 scope (internal validation). Essential before commercial deployment. Design schema to support this from day one even if not implemented. |
| **Export and integration APIs** | Classified metadata exportable to downstream systems (DAMs, CMS platforms, analytics tools). REST API for programmatic access. | Medium | Not in current scope. Table stakes for enterprise adoption but differentiator at launch. Prioritise CSV/JSON export first. |
| **Confidence threshold routing** | Low-confidence classifications automatically flagged for human review. Configurable thresholds per category or globally. | Medium | Natural extension of confidence scoring. High value — reduces false positives reaching downstream consumers. |
| **Source deduplication** | Detect when the same content has already been classified (by URL, content hash, or fuzzy matching). Prevent reprocessing and flag content reuse across channels. | Medium | Not in current scope. Valuable for cost control (LLM API calls are expensive) and content reuse analytics. |

---

## Anti-Features

Features to explicitly NOT build. These are traps that seem valuable but would dilute focus, increase complexity disproportionately, or position the product incorrectly.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Full content management system (check-in/check-out, versioning, workflows)** | Veeva owns this space with 80%+ market share in pharma. Competing on content lifecycle management is a losing battle. DataBridge AI is an intelligence layer, not a CMS. | Integrate with existing CMS platforms. Ingest from them, classify, and push metadata back. |
| **MLR (Medical, Legal, Regulatory) review workflow** | Regulatory review workflows are deeply embedded in pharma organisations' existing tools (Veeva Vault, Zinc Maps). Building one from scratch is a multi-year effort with enormous compliance risk. | Flag compliance concerns for triage. Let existing MLR tools handle the formal review process. The current "flags are for triage only, not legal approval" positioning is exactly right. |
| **Content creation or editing** | DataBridge AI classifies existing content. Adding editing means building a CMS. Scope creep of the worst kind. | Stay read-only on content. Only create/modify metadata. |
| **Custom ML model training** | Offering per-client ML model training sounds powerful but creates a maintenance nightmare, requires data science staffing, and is unnecessary when LLM-based classification with rules-as-documents achieves the same goal with less complexity. | Lean into the rules-as-documents approach. If a client needs specialised classification, they update their rules document. |
| **Real-time streaming ingestion** | Already marked out of scope. Tempting for "enterprise" positioning but massively increases infrastructure complexity (Kafka/Kinesis, always-on consumers). Pharma content is updated in batches, not streams. | On-demand triggered processing. Scheduled batch runs via cron if needed. |
| **Natural language search over content** | Full-text search with semantic understanding sounds impressive but requires vector databases, embedding pipelines, and a completely different architecture. It is a separate product. | Provide structured metadata search (filter by brand, audience, category, etc.). If semantic search is needed later, it is a separate service that consumes DataBridge AI metadata. |
| **OCR from scratch** | Building custom OCR for scanned pharma documents is a rabbit hole. Quality varies enormously by document type. | Use proven extraction libraries (pdfplumber, pymupdf). For image-based PDFs, use Claude's vision capabilities directly. Defer complex OCR to v2+ and evaluate cloud OCR services (Google Vision, AWS Textract) then. |
| **User-facing annotation or labelling UI** | A UI for humans to correct/annotate classifications sounds useful but shifts the product from automated intelligence to a labelling tool. Different product category entirely. | If classification is wrong, the fix should be updating the rules document — not manually correcting individual records. This reinforces the rules-as-documents paradigm. |
| **Regulatory submission formatting** | Generating regulatory submission packages (eCTD, IDMP) is a specialised domain with its own tooling (Veeva Vault Submissions, IQVIA). | Export metadata in standard formats. Let specialised tools handle submission packaging. |
| **Mobile application** | Already out of scope. Pharma content teams work on desktop. Mobile adds complexity with no proportional value for the target persona. | Responsive web design is sufficient. |

---

## Feature Dependencies

```
Authentication ──────────────────────────────┐
                                              │
RLS Policies ─────────────────────────────────┤
                                              ▼
                                    Dashboard (read-only)
                                              │
Rules Version Management ────────┐            │
                                  │            │
Taxonomy Version Management ─────┤            │
                                  ▼            │
                           Rules Manager UI    │
                                  │            │
Storage Buckets ──────────────────┤            │
                                  ▼            │
                         Source Connector       │
                                  │            │
                         Job Queue (pg-boss)    │
                                  │            │
                           Orchestrator         │
                                  │            │
                            PDF Agent           │
                                  │            │
                       Content Metadata ────────┘
                                  │
                     Realtime Subscriptions
                                  │
                      Live Job Status on Dashboard
```

### Critical path (must be built in order):
1. **Supabase schema + RLS** (everything depends on this)
2. **Auth + roles** (RLS depends on auth context)
3. **Storage buckets + rules/taxonomy upload** (agents need rules to classify)
4. **Shared Python library** (agents import this)
5. **Source connector** (creates jobs)
6. **Orchestrator** (dispatches jobs to agents)
7. **PDF agent** (first classification capability)
8. **Frontend** (can be built in parallel from step 2 onwards, but useful only after step 7)

### Parallelisable work:
- Frontend shell (login, dashboard skeleton) can start as soon as schema + auth are ready
- CI/CD pipeline can be set up from the start
- Rules Manager UI can be built as soon as storage buckets exist

---

## MVP Recommendation

The current v1 scope in PROJECT.md is well-judged. Prioritise in this order:

### Must Ship (v1 — internal validation)

1. **Schema + RLS + storage buckets** — Foundation. Nothing works without this.
2. **Auth with admin/viewer roles** — Security baseline.
3. **Rules and taxonomy version management** — Core governance. Non-negotiable for the product's value proposition.
4. **Shared library with Pydantic models** — Agent contract definition.
5. **Source connector (S3, SFTP, URL)** — Content ingestion.
6. **Orchestrator + job queue** — Processing backbone.
7. **PDF agent with Claude classification** — The core value demonstration.
8. **Dashboard with real-time job status** — Proof the system works.
9. **Rules Manager UI** — Non-technical users can update classification logic.
10. **Ingestion trigger UI** — Users can initiate processing.

### Defer to v1.x (post internal validation, pre-client)

- **File import/storage for HTML, images, DOCX, CSV** (without classification) — Already in v1 scope but lower priority than working PDF pipeline end-to-end.
- **Confidence threshold routing** — Easy win after PDF agent is working.
- **Source deduplication** — Cost savings and data quality.
- **CSV/JSON export** — Clients will need to get data out of the system.

### Defer to v2 (post first client)

- **Classification agents for HTML, images, DOCX, CSV** — Expand from PDF-only.
- **Content library analytics** — Strategic portfolio views.
- **Reclassification on rule change** — Rule development workflow.
- **Multi-tenant architecture** — Required for commercial SaaS model.
- **REST API for integrations** — Enterprise adoption enabler.
- **SharePoint connector** — Very common in pharma orgs.

### Defer to v3+ (future product evolution)

- **Classification drift detection** — Advanced governance.
- **Customer pillar** (profiling/segmentation) — Part of broader Omnichannel Data Model.
- **Channel pillar** (performance measurement) — Part of broader Omnichannel Data Model.
- **Impact pillar** (attribution/forecasting) — Part of broader Omnichannel Data Model.

---

## Pharma-Specific Feature Considerations

### Regulatory context shapes feature priorities

Pharma content is subject to regulations (FDA 21 CFR Part 11, EU MDR, ABPI Code) that create specific feature expectations:

| Regulatory Concern | Feature Implication | How DataBridge AI Addresses It |
|--------------------|--------------------|-------------------------------|
| Audit trail requirements | Every classification decision must be traceable and explainable | Raw extraction storage, rules version pinning per job |
| Content approval workflows | Content must go through MLR review before use | NOT our scope — flag for triage, do not replicate MLR workflow |
| Data integrity (ALCOA+) | Metadata must be attributable, legible, contemporaneous, original, accurate | Timestamped records, rules version recorded, confidence scores |
| Multi-market compliance | Same content may need different classification in different markets | Language detection, taxonomy supports market-specific hierarchies |
| Adverse event detection | Content might contain reportable adverse events | Consider adding as a compliance flag type in v2 |

### Content types unique to pharma

The classification taxonomy should account for pharma-specific content types that generic platforms miss:

- **Prescribing Information (PI) / Summary of Product Characteristics (SmPC)** — Core regulatory documents
- **Patient Information Leaflets (PIL)** — Mandated patient-facing content
- **Key Visual Aids (KVAs)** — Sales rep presentation materials
- **Detail Aids** — HCP engagement materials
- **Medical Science Liaison (MSL) materials** — Medical affairs content
- **Congress materials** — Posters, abstracts, booth content
- **Digital banners / email templates** — Multi-channel promotional content
- **Advisory board materials** — KOL engagement content

These should be values in the `content_format` field or addressable via taxonomy.

---

## Sources and Confidence

| Finding | Confidence | Source |
|---------|------------|--------|
| Veeva dominance in pharma content lifecycle | MEDIUM | Training data — well-established market fact, but specific market share figures unverified |
| Rules-as-documents as a differentiator | HIGH | Direct analysis of project architecture vs competitor patterns in training data |
| MLR workflow as anti-feature | HIGH | Domain knowledge — pharma MLR is deeply entrenched in existing tooling |
| Feature dependency ordering | HIGH | Direct analysis of project architecture and build brief |
| Compliance flag types (Missing ISI, off-label risk) | MEDIUM | Training data — standard pharma compliance concerns |
| Pharma content types list | MEDIUM | Training data — standard pharma commercial operations content |
| Multi-tenant as pre-commercial requirement | HIGH | Standard SaaS architecture pattern, explicit in project vision |
| Reclassification on rule change as differentiator | HIGH | Direct analysis — unique to rules-as-documents paradigm |

**Note:** Web search was unavailable for this research session. All competitor analysis and market positioning claims are based on training data (cutoff May 2025). Recommend verifying competitor feature sets with current product pages before finalising positioning statements.

---

*Research conducted for DataBridge AI feature landscape — pharma content intelligence domain.*
