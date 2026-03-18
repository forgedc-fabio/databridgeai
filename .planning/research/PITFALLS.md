# Pitfalls Research

**Domain:** Pharma content intelligence / AI document classification pipeline
**Researched:** 2026-03-18
**Confidence:** MEDIUM (based on training data -- web search and WebFetch unavailable for live verification)

## Critical Pitfalls

### Pitfall 1: LLM Output Non-Determinism Breaks Classification Consistency

**What goes wrong:**
Claude returns structurally valid JSON that passes Pydantic validation but assigns different classifications to identical or near-identical content across runs. The same PDF processed twice yields `l1_category: "Oncology"` one time and `l1_category: "Haematology-Oncology"` the next. In pharma, where classification drives compliance workflows and audit trails, this inconsistency is unacceptable. Stakeholders lose trust in the system when the same document gets different metadata depending on when it was processed.

**Why it happens:**
LLMs are probabilistically generative, not deterministic classifiers. Even with `temperature=0`, model responses can vary between API calls due to infrastructure-level non-determinism (batching, quantisation differences across serving instances). The taxonomy hierarchy compounds this -- pharma content frequently spans multiple categories legitimately (a branded oncology patient leaflet could classify under brand, therapeutic area, or audience depending on which signal the model weights most on a given call).

**How to avoid:**
1. Use Claude's structured output / tool use to constrain the output format rather than free-text JSON generation. Define the classification as a tool call with enum parameters matching exact taxonomy values.
2. Pin taxonomy values as literal enums in the prompt and the Pydantic model. Never allow free-text where a controlled vocabulary exists.
3. Implement a confidence threshold gateway: if `confidence_score < 0.85`, route to a human review queue rather than auto-accepting.
4. For critical compliance flags, require the model to provide chain-of-thought reasoning (stored in `raw_extraction`) that can be audited.
5. Consider running classification twice and comparing results -- flag discrepancies for human review.

**Warning signs:**
- Dashboard shows the same source URL with different metadata across re-runs
- `content_metadata` has many records with `confidence_score` below 0.8
- Compliance flags appear inconsistently on similar content
- Users report "the system classified this wrong" regularly

**Phase to address:**
Phase 1 (PDF Agent build). Bake enum constraints and confidence gating into the initial agent design. Retrofitting determinism into a free-text extraction pipeline is expensive.

---

### Pitfall 2: Rules/Taxonomy Version Drift During Processing

**What goes wrong:**
A batch of 500 PDFs begins processing against rules v2.3. Midway through, someone activates rules v2.4 via the Rules Manager UI. Some documents are classified against v2.3, others against v2.4. The `content_metadata` table now contains records that are structurally incomparable. Reports mixing v2.3 and v2.4 classifications produce misleading aggregations.

**Why it happens:**
The build brief states "running jobs complete against the version they started with" but the schema design uses a simple `is_active` boolean with a unique index. The PDF agent fetches the active rules version at runtime (`rules_versions WHERE is_active = true`). If the agent fetches rules per-job rather than per-batch, and a version change happens between job dispatches, drift occurs. The current schema stores `rules_version` as TEXT on both `jobs` and `content_metadata`, but nothing enforces that the version was actually the active one when the batch started.

**How to avoid:**
1. Capture the rules version at batch initiation time (in the Source Connector), not at individual job execution time. Store the `rules_version` on each `jobs` row when the job is created.
2. The PDF agent must read the `rules_version` from its `jobs` row and fetch that specific version from storage -- never query `WHERE is_active = true`.
3. Add a UI warning when changing active rules: "X jobs are currently processing against version Y. Changing the active version will not affect in-flight jobs."
4. Consider a `batch_id` column on `jobs` to group all jobs from a single ingestion trigger, making version consistency auditable.

**Warning signs:**
- `content_metadata` records from the same batch show different `rules_version` values
- Users change active rules version while jobs are still processing
- Agents query `is_active = true` directly instead of reading from their job record

**Phase to address:**
Phase 1 (Schema + Source Connector). The version-pinning pattern must be enforced from the first migration. The Source Connector must stamp each job with the version at creation time.

---

### Pitfall 3: PDF Text Extraction Silently Produces Garbage

**What goes wrong:**
`pdfplumber` (or `pymupdf`) returns text from a PDF, but the text is garbled -- ligatures mangled, columns interleaved, tables flattened into nonsense, headers/footers mixed into body text, or (worst case) the PDF is image-based and no text is extracted at all. The agent sends this garbage to Claude, which dutifully classifies it with high confidence because it found a few recognisable keywords in the noise. The resulting metadata is wrong but looks plausible.

**Why it happens:**
Pharma content is notoriously difficult to extract text from. Marketing materials use complex layouts with multi-column designs, embedded charts, text-as-image for brand compliance, watermarks, and non-standard fonts. Regulatory documents may be scanned PDFs with no text layer. PDFs generated from PowerPoint or InDesign have especially unreliable text extraction. The build brief uses `pdfplumber` (primary) with `pymupdf` as fallback, but neither handles image-based PDFs.

**How to avoid:**
1. Add a text quality gate before sending to Claude: measure extracted text length, character entropy, and ratio of recognisable words. If the text is too short (< 100 chars for a multi-page PDF) or has low entropy, flag the job as `needs_ocr` rather than processing with garbage input.
2. Plan for OCR in the architecture even if it is out of scope for v1. Reserve an `extraction_method` field (e.g., `text_layer`, `ocr`, `hybrid`) so downstream consumers know how text was obtained.
3. Implement page-by-page extraction with quality scoring, not whole-document extraction. Drop pages that are clearly image-only or have sub-threshold text.
4. Store the extracted text in `raw_extraction` alongside Claude's response, so misclassifications can be traced back to extraction quality issues.
5. For v1, explicitly document which PDF types are supported (text-layer PDFs only) and fail gracefully on image-based PDFs with a meaningful `error_msg`.

**Warning signs:**
- `content_metadata` records with very short or empty `title` and `description` fields
- High confidence scores on documents that should be ambiguous
- `raw_extraction` contains garbled or very short text relative to page count
- Agents succeed on test PDFs but fail on real pharma content

**Phase to address:**
Phase 1 (PDF Agent). Build the text quality gate into the initial agent. Phase 2+ should add OCR capability (Tesseract or a cloud OCR service).

---

### Pitfall 4: Supabase RLS Policies Create Silent Data Invisibility

**What goes wrong:**
Agents use `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) during writes. The frontend uses the anon key with RLS. But the RLS policies are misconfigured or incomplete -- authenticated users cannot see data they should see, or worse, they see data they should not. The most insidious variant: everything works in development (where you test with the service role key) and breaks in production when the frontend hits RLS.

**Why it happens:**
The current schema defines `FOR SELECT TO authenticated USING (true)` which grants all authenticated users read access to everything. This is fine for v1's internal team, but when roles are introduced (admin vs. viewer, or multi-tenant per client), the permissive policies will need rewriting. The build brief also defines an admin-only write policy on `rules_versions` using `auth.jwt() ->> 'role' = 'admin'`, which requires custom JWT claims -- these must be configured in Supabase Auth or they will silently never match, locking everyone out of rules management.

**How to avoid:**
1. Test every RLS policy from the frontend client (not the service role key) as part of the development workflow. Create a test script that authenticates as a non-admin user and verifies read access.
2. Verify that custom JWT claims (`role = 'admin'`) are actually being set in Supabase Auth. This requires a custom hook or manual claim assignment -- it does not happen automatically.
3. Document the RLS policy intent for each table. Make it explicit: "v1 = all authenticated users can read everything. v2 = tenant isolation."
4. Never test database operations exclusively via the service role key. Always have at least one test path using the anon key + auth.

**Warning signs:**
- Frontend shows empty tables despite data existing in the database
- Rules Manager "toggle active" button fails silently (admin policy not matching)
- Developers only test with service role key or Supabase dashboard
- No test for the `auth.jwt() ->> 'role'` claim path

**Phase to address:**
Phase 1 (Schema + Frontend). RLS policies must be tested with actual authenticated users during the schema phase, not deferred to "when the frontend is ready."

---

### Pitfall 5: Compliance Flags Treated as Advisory When They Are Operationally Critical

**What goes wrong:**
The system detects "Missing ISI" (Important Safety Information) or "Off-label Risk" on a pharma content asset. The flag is stored as a JSONB array element in `compliance_flags`. Nobody sees it until they happen to look at that specific record in the dashboard. There is no alerting, no workflow trigger, no escalation. A flagged asset continues through downstream processes (e.g., distribution to HCPs) without anyone reviewing the compliance concern. In pharma, this is not a bug -- it is a regulatory incident.

**Why it happens:**
The build brief models compliance flags as passive metadata fields, equivalent to `tags` or `key_claims`. But compliance flags have fundamentally different operational semantics -- they require action. The schema treats them identically to other JSONB fields with a GIN index for querying, but nothing in the architecture routes flagged content to a review workflow.

**How to avoid:**
1. Design compliance flags as first-class entities with operational semantics from day one. At minimum: a dashboard widget showing unreviewed compliance flags, filterable by flag type, with a "reviewed/acknowledged" state.
2. Add a `compliance_status` column to `content_metadata` (`pending_review`, `reviewed`, `cleared`, `escalated`) that tracks whether flagged content has been actioned.
3. Use Supabase Realtime to push compliance flag notifications to the dashboard immediately when a flagged job completes.
4. In the PROJECT.md scope, the system explicitly states "flags are for triage only, not legal approval" -- make this visible in the UI. Each flag should display a disclaimer: "This flag is system-generated for triage purposes. It does not constitute a compliance assessment."
5. Build the compliance summary into the dashboard from Phase 1, not as a Phase 2 enhancement.

**Warning signs:**
- Compliance flags exist in the database but no UI element highlights them prominently
- No "unreviewed flags" counter on the dashboard
- Users discover compliance issues by manually browsing individual records
- No audit trail of who reviewed/acknowledged a compliance flag

**Phase to address:**
Phase 1 (Frontend dashboard). The dashboard must surface compliance flags prominently from the first build. Deferring this to "later" means the system is deployed without its most critical user-facing safety feature.

---

### Pitfall 6: pg-boss on Supabase Managed Postgres Has Hidden Constraints

**What goes wrong:**
pg-boss requires specific Postgres extensions and permissions to create its schema (`pgcrypto`, ability to create tables/indexes in a schema, `LISTEN/NOTIFY`). On Supabase's managed Postgres, some of these may be restricted or behave differently than on a self-hosted instance. pg-boss also runs maintenance operations (archive, expire, delete) that can lock tables and cause connection pool exhaustion on a shared Supabase instance. The orchestrator's 5-second polling loop adds persistent load.

**Why it happens:**
pg-boss was designed for self-hosted or fully-managed Postgres instances (RDS, Cloud SQL) where you control extensions and connection limits. Supabase uses a shared Postgres instance with connection pooling (PgBouncer in transaction mode by default), which can conflict with pg-boss's use of `LISTEN/NOTIFY` (requires session mode) and long-lived connections.

**How to avoid:**
1. Verify pg-boss compatibility with Supabase Postgres before building the orchestrator. Specifically test: schema creation, `LISTEN/NOTIFY` through the connection pooler, and maintenance operations.
2. Use Supabase's direct connection string (port 5432, bypasses PgBouncer) for pg-boss, not the pooled connection (port 6543). pg-boss needs session-level features that transaction-mode pooling breaks.
3. Set conservative pg-boss maintenance intervals to avoid table locks during peak processing.
4. Have a fallback plan: if pg-boss proves incompatible, a simple polling-based queue using the `jobs` table directly (SELECT ... FOR UPDATE SKIP LOCKED) is reliable, battle-tested, and requires no additional dependencies.
5. Monitor connection count -- Supabase free/pro tiers have connection limits, and pg-boss holds connections open.

**Warning signs:**
- pg-boss fails to create its schema on Supabase
- `LISTEN/NOTIFY` notifications not received through PgBouncer
- Connection pool exhaustion errors during batch processing
- pg-boss maintenance operations causing query timeouts on other tables

**Phase to address:**
Phase 1 (Orchestrator build). Validate pg-boss on Supabase early. If it fails, switch to `SELECT ... FOR UPDATE SKIP LOCKED` on the `jobs` table -- this is a 2-hour rewrite, not a project blocker.

---

### Pitfall 7: Audit Trail Gaps Make Classification History Unreconstructable

**What goes wrong:**
Six months after deployment, a pharma client asks: "Show me every classification decision made on our Q3 campaign assets, including which rules were applied, what the AI saw, and who triggered the process." The system cannot answer this because: (a) `raw_extraction` was not always stored (early bugs), (b) the rules document that was active at processing time was since overwritten in Supabase Storage, (c) `triggered_by` on the `jobs` table is a free-text field with no link to the auth system, and (d) there is no record of rules version content, only the version label.

**Why it happens:**
Audit requirements in pharma are strict but often underestimated by developers building content tools. The current schema stores `rules_version` as a TEXT label and `raw_extraction` as JSONB, which is a good start. But the rules document itself is mutable in Supabase Storage (overwriting a file at the same path changes its content), and there is no immutability guarantee on historical versions.

**How to avoid:**
1. Make rules and taxonomy documents immutable once published. Each version gets a unique storage path (e.g., `rules/v2.3.json`, never `rules/current.json`). The `storage_path` in `rules_versions` must be a versioned path, and overwriting is prevented by convention or storage policy.
2. Enforce `raw_extraction` as NOT NULL on `content_metadata`. Every classification must store the full Claude response. Never skip this to save storage.
3. Link `triggered_by` to the Supabase Auth user ID, not a free-text string. Add a `triggered_by_user_id UUID REFERENCES auth.users(id)` column.
4. Consider storing a hash of the rules document content alongside the version label, so you can verify that the rules file has not been tampered with.
5. Add a `classification_audit` view or table that joins `jobs`, `content_metadata`, `rules_versions`, and auth data into a single audit-friendly format.

**Warning signs:**
- `raw_extraction` is NULL on any `content_metadata` row
- Rules documents in Supabase Storage are overwritten rather than versioned
- `triggered_by` contains inconsistent values (email sometimes, name sometimes, NULL sometimes)
- No one has tested the "reconstruct classification history" query

**Phase to address:**
Phase 1 (Schema design). Audit trail completeness must be a schema-level constraint, not an application-level best practice. Make `raw_extraction NOT NULL`, use versioned storage paths, and link `triggered_by` to auth users.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Free-text JSON from Claude instead of tool-use structured output | Simpler prompt, faster to implement | Non-deterministic field names, parsing failures, inconsistent enums | Never for production classification -- use tool use from day one |
| Service role key for all backend operations | Bypasses RLS complexity | No RLS testing, policies never validated, security gaps hidden until frontend launch | Only in initial schema testing, never in agent code that ships |
| Storing rules at a mutable path (`rules/current.json`) | Simple to reason about "current" rules | Historical audit impossible, version label and content can diverge | Never -- always use versioned paths |
| Polling-based orchestrator without backoff | Simple implementation | Unnecessary Supabase load during idle periods, connection waste | Acceptable if exponential backoff is added (5s -> 10s -> 30s -> 60s when idle) |
| Single retry strategy for all failure types | Less code | API rate limits treated same as malformed PDFs, wasting retries on unrecoverable errors | Only in v1 if failures are categorised (retryable vs. terminal) even with uniform retry count |
| Hardcoded taxonomy enums in Pydantic models | Type safety, fast validation | Every taxonomy update requires code redeployment | Only if taxonomy changes are rare (< quarterly). For pharma with evolving therapeutics, load enums dynamically. |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude API | Parsing `response.content[0].text` as JSON without handling markdown wrapping (`\`\`\`json ... \`\`\``) | Use tool use for structured output, or strip markdown fences before `json.loads()`. Always wrap in try/except with the raw response logged. |
| Claude API | Not handling `overloaded` or rate limit errors | Implement exponential backoff with jitter. Check `response.stop_reason` -- `end_turn` is success, `max_tokens` means truncated output. |
| Supabase Storage | Using public URLs for private bucket files | Use signed URLs with short expiry (e.g., 60 seconds) for agent downloads. Never make `agent-context` or `source-content` buckets public. |
| Supabase Realtime | Subscribing to entire table changes without filters | Subscribe with filters (`eq('status', 'completed')`) to reduce WebSocket traffic. Unsubscribe on component unmount to prevent memory leaks. |
| GCP Cloud Run Jobs | Assuming environment variables persist between job executions | Each job execution is a fresh container. Fetch all state from Supabase/Secret Manager at startup. Never cache state between invocations. |
| GCP Secret Manager | Fetching secrets on every request | Fetch once at container startup, cache in memory. Secret Manager has API quota limits. For Cloud Run Jobs (short-lived), this is less critical but still good practice. |
| Supabase Edge Functions (Deno) | Using Node.js npm packages directly | Edge Functions run Deno, not Node. Use Deno-compatible imports. The Supabase JS client works, but other npm packages may not. |
| PgBouncer (Supabase) | Using prepared statements or session features through the pooled connection | Use the direct connection (port 5432) for pg-boss and any session-dependent features. Use the pooled connection (port 6543) for stateless queries. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching rules/taxonomy from Storage on every single job | Each PDF agent invocation downloads the same rules file | Cache rules in the orchestrator, pass as payload or pre-signed URL. For Cloud Run Jobs, this is unavoidable per-invocation but keep the files small (< 1MB). | 100+ concurrent jobs -- Storage API rate limits and latency compound |
| No pagination on dashboard queries | Dashboard loads all `content_metadata` records | Add `LIMIT/OFFSET` or cursor-based pagination from the first dashboard build. Default to 50 rows. | 1,000+ records -- browser freezes, Supabase response times degrade |
| GIN index scans on JSONB fields for dashboard filters | Slow queries when filtering by tags, claims, or compliance flags | GIN indexes are already planned (good). Ensure queries use `@>` containment operator, not `->>`  extraction for filtering. | 10,000+ records with complex JSONB filters |
| Single orchestrator instance polling every 5s | Works fine for 10 jobs, but no parallelism for dispatching | The orchestrator dispatches Cloud Run Jobs which run in parallel. The bottleneck is the orchestrator's serial dispatch loop, not the agents. Use async dispatch (fire-and-forget to Cloud Run). | 200+ pending jobs -- dispatch takes longer than polling interval |
| Storing full PDF content in `raw_extraction` | Massive JSONB column, slow queries on `content_metadata` | Store only Claude's response in `raw_extraction`, not the input text. The source PDF is in `source-content` bucket, the extracted text can go in a separate column if needed. | 500+ records with multi-page PDF extractions stored inline |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Sending pharma content to Claude API without data processing assessment | Potential GDPR/data protection issue if content contains PII (patient case studies, HCP contact details) | Implement a PII scan before sending content to Claude. At minimum, document the data processing relationship with Anthropic. Check if Anthropic's zero-retention API option is needed. |
| Compliance flags visible to all authenticated users | Non-compliance information leaked to unauthorised staff could trigger premature regulatory action or reputational damage | Phase 1 is internal-only (acceptable), but plan RLS policies for role-based access to compliance data before client deployment. |
| Service role key in Cloud Run environment variables without rotation | Compromised container exposes full database access | Use GCP Secret Manager with automatic rotation. Set up alerts on Secret Manager access patterns. The build brief mandates Secret Manager -- enforce it. |
| Source connector accessing client S3/SFTP with overly broad credentials | AWS credentials with `s3:*` permissions could access unrelated client data | Create per-source IAM roles with least-privilege access. Use temporary credentials (STS AssumeRole) rather than long-lived keys. |
| No rate limiting on the Edge Function trigger endpoint | Authenticated user could trigger thousands of ingestion runs, exhausting Claude API budget | Add rate limiting at the Edge Function level (e.g., max 10 triggers per user per hour). Monitor Anthropic API spend with alerts. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing raw classification output without explanation | Users see `l1_category: "CNS"` and do not know why, cannot trust or correct it | Show the classification chain (L0 > L1 > L2 > L3 > L4) with the confidence score and a "why" summary extracted from `raw_extraction` |
| No way to correct a misclassification | Users find an error but cannot fix it, losing trust in the system | Add a "manual override" workflow where a user can edit classification, with the override logged alongside the original AI classification for audit |
| Ingestion trigger gives no feedback after "queued" | User clicks "Start Ingestion", sees "queued", then waits with no progress indication | Use Supabase Realtime to show live job status updates. Display a progress bar (X of Y jobs completed) for the batch. |
| Dashboard shows all-time data by default | Overwhelming volume of records, slow load, no context for recent activity | Default to "last 7 days" with date range picker. Show trend indicators (up/down vs. previous period). |
| Compliance flags buried in a detail view | Users must click into individual records to discover compliance issues | Surface a prominent "Compliance Alerts" panel on the main dashboard with unreviewed flag count and severity breakdown |
| Rules Manager allows destructive actions without confirmation | Accidentally deactivating all rules versions leaves the system without active rules, causing all new jobs to fail | Add confirmation dialogs, prevent deactivating the last active version, show impact ("X pending jobs will use this version") |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **PDF Agent:** Passes on test PDFs but not validated against real pharma content with complex layouts, multi-column designs, embedded images, and scanned pages. Verify with 20+ real production PDFs.
- [ ] **Classification output:** JSON validates against Pydantic model but taxonomy values are free-text, not constrained to the actual taxonomy dictionary values. Verify that every `l0` through `l4` value exists in the active taxonomy.
- [ ] **RLS policies:** Defined in migration but never tested with a non-service-role client. Verify by querying through the Supabase JS client with an authenticated anon-key session.
- [ ] **Audit trail:** `raw_extraction` is stored but `triggered_by` is not linked to auth users, and rules documents are mutable in storage. Verify the full audit reconstruction query works.
- [ ] **Error handling:** Agents write `error_msg` on failure but the dashboard does not display error details to users. Verify that failed jobs are visible and debuggable from the UI.
- [ ] **Retry logic:** Retries are implemented but all failures are retried indiscriminately. Verify that unrecoverable errors (unsupported MIME type, malformed PDF) are not retried.
- [ ] **Edge Function auth:** JWT validation is implemented but custom `role` claim is not configured in Supabase Auth. Verify that `auth.jwt() ->> 'role' = 'admin'` actually matches for admin users.
- [ ] **Realtime subscriptions:** Connected in the frontend but not cleaned up on component unmount. Verify no memory leaks by navigating between pages repeatedly.
- [ ] **Confidence scores:** Stored in the database but not used for any decision-making. Verify that low-confidence results are flagged or routed differently.
- [ ] **Docker images:** Build successfully but are oversized (Python base images with unnecessary system packages). Verify multi-stage builds actually reduce image size below 500MB.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Inconsistent classifications across runs | MEDIUM | Identify affected records via `rules_version` + `confidence_score` analysis. Re-run affected jobs against pinned rules version. Add determinism constraints (tool use, enum pinning) before re-processing. |
| Rules version drift mid-batch | LOW | Query `content_metadata` grouped by `rules_version` for the affected batch. Re-process any records that used the wrong version. Add version-pinning to the Source Connector. |
| Garbage PDF text extraction | MEDIUM | Flag records where `raw_extraction` shows short/garbled input text. Add text quality gate to PDF agent. Re-process flagged records after gate is in place. |
| RLS policy misconfiguration | LOW | Fix policies in a new migration. Test with non-service-role client. No data loss -- only visibility was wrong. |
| Missing audit trail data | HIGH | Retroactive reconstruction may be impossible if `raw_extraction` is NULL or rules documents were overwritten. Prevention is the only viable strategy. For partially recoverable cases, re-process affected documents against the closest available rules version. |
| pg-boss incompatibility with Supabase | LOW | Replace with `SELECT ... FOR UPDATE SKIP LOCKED` polling on the `jobs` table. This is a straightforward refactor of the orchestrator -- the rest of the system is unaffected. |
| Compliance flags not surfaced | MEDIUM | Add dashboard widget. Backfill `compliance_status` column for existing records. Audit all historical records with compliance flags to determine if any required action was missed. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| LLM output non-determinism | Phase 1: PDF Agent | Run the same PDF 10 times and compare classification output. Variance on enum fields should be 0%. |
| Rules version drift | Phase 1: Schema + Source Connector | Process a batch, change active rules mid-batch, verify all records in batch have the original version. |
| PDF text extraction quality | Phase 1: PDF Agent | Process 20+ real pharma PDFs covering marketing, regulatory, and scientific content. Manually verify extraction quality. |
| RLS policy gaps | Phase 1: Schema + Frontend | Create a non-admin test user, authenticate via frontend, verify read access to all tables and write-block on rules. |
| Compliance flags not actionable | Phase 1: Frontend dashboard | Verify compliance flags appear on the main dashboard without navigating to individual records. |
| pg-boss on Supabase | Phase 1: Orchestrator | Run pg-boss schema creation and a 100-job batch on Supabase Postgres. Monitor connection count and `LISTEN/NOTIFY` delivery. |
| Audit trail gaps | Phase 1: Schema design | Write and run the "full audit reconstruction" query. Verify it returns: who triggered, what rules, what the AI saw, what it classified. |
| PII in content sent to Claude | Phase 1: PDF Agent | Document the data flow to Anthropic. Confirm zero-retention API usage if required. Add PII detection if content may contain patient data. |
| No manual override for misclassification | Phase 2: Enhanced UI | Verify that overrides are logged alongside original classification, preserving audit trail. |
| Dashboard performance at scale | Phase 2: Optimisation | Load test with 10,000+ records. Verify pagination, query performance, and Realtime subscription stability. |

## Sources

- Training data on Supabase RLS, pg-boss, Claude API structured output, and pharma content classification patterns (MEDIUM confidence -- no live verification available)
- Build brief architecture analysis (`NinjaWork/ForgeDC/_internal/DataBridgeAI/Briefs/architecture-build-brief.md`) -- HIGH confidence for project-specific details
- PROJECT.md constraints and scope -- HIGH confidence for project-specific decisions
- General knowledge of pharma regulatory requirements (MLR review, ISI requirements, off-label promotion rules) -- MEDIUM confidence

**Note:** Web search and WebFetch were unavailable during this research session. All findings are based on training data and direct analysis of the project architecture. Recommendations for pg-boss compatibility with Supabase, Claude API structured output behaviour, and Supabase RLS edge cases should be validated against current documentation before implementation.

---
*Pitfalls research for: DataBridge AI -- pharma content intelligence platform*
*Researched: 2026-03-18*
