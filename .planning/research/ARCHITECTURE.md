# Architecture Patterns

**Domain:** Pharma content intelligence / document processing pipeline
**Researched:** 2026-03-18
**Confidence:** MEDIUM (training data only -- no live verification available; patterns are well-established)

## Recommended Architecture

DataBridgeAI is a **triggered pipeline** architecture: an external event (user click or scheduled trigger) initiates a crawl, which fans out into parallel classification jobs, each processed by ephemeral agent containers. The architecture separates concerns into five layers: trigger, orchestration, processing, data, and presentation.

```
[Frontend (Vercel/Cloud Run)]
        |
        | POST /functions/v1/ingest
        v
[Edge Function (Supabase)]  -----> [Source Connector (Cloud Run Job)]
        |                                    |
        | returns run_id                     | inserts rows into jobs table
        v                                    v
[Frontend shows run_id]            [jobs table (Supabase Postgres)]
                                             |
                                             | polled by
                                             v
                                   [Orchestrator (Cloud Run Service)]
                                             |
                                             | dispatches Cloud Run Jobs
                                             v
                                   [PDF Agent / HTML Agent / Image Agent]
                                             |
                                             | writes classification results
                                             v
                                   [content_metadata table]
                                             |
                                             | Realtime subscription
                                             v
                                   [Frontend Dashboard (live updates)]
```

### Component Boundaries

| Component | Responsibility | Communicates With | Runtime |
|-----------|---------------|-------------------|---------|
| **Frontend** | User interface, auth, dashboard, rules management, ingestion trigger | Supabase (data, auth, realtime), Edge Function (trigger) | Cloud Run Service (always-on) |
| **Edge Function** | Authenticated API trigger, fire-and-forget job dispatch | Frontend (receives POST), GCP Cloud Run API (starts source-connector) | Supabase Edge (Deno, ephemeral) |
| **Source Connector** | Crawl sources, detect MIME types, create job rows | Source systems (S3, SFTP, URL), Supabase (reads rules, writes jobs) | Cloud Run Job (ephemeral) |
| **Orchestrator** | Poll job queue, dispatch agent containers, manage retries | Supabase Postgres (reads/writes jobs), GCP Cloud Run API (starts agent jobs) | Cloud Run Service (always-on, min 1) |
| **PDF Agent** | Download PDF, extract text, call Claude API, validate, write results | Supabase Storage (rules, taxonomy, prompts), Supabase DB (jobs, content_metadata), Anthropic API | Cloud Run Job (ephemeral) |
| **Supabase** | Database, auth, storage, realtime subscriptions, edge functions | All components | Managed service |

### Data Flow

**Ingestion flow (happy path):**

1. User submits ingestion request via frontend form
2. Frontend calls Edge Function with source config and auth token
3. Edge Function validates JWT, generates `run_id`, triggers Source Connector as Cloud Run Job
4. Edge Function returns `run_id` immediately (fire-and-forget)
5. Source Connector runs: connects to source, lists files, detects MIME types, inserts one `jobs` row per file with `status = 'pending'`
6. Orchestrator (polling every 5s) picks up pending jobs
7. Orchestrator dispatches appropriate Cloud Run Job per `agent_type`, sets `status = 'running'`
8. Agent downloads file, fetches active rules/taxonomy from Supabase Storage, calls Claude API
9. Agent validates response via Pydantic, writes to `content_metadata`, sets `status = 'completed'`
10. Frontend receives status changes via Supabase Realtime subscription on `jobs` table

**Rules update flow:**

1. Admin uploads new rules JSON via Rules Manager UI
2. Frontend uploads file to Supabase Storage `agent-context/rules/`
3. Frontend inserts row into `rules_versions` with `is_active = false`
4. Admin clicks "activate" -- frontend sets `is_active = true` (unique partial index ensures single active)
5. Next job execution fetches the new active rules at runtime (hot-reload without redeployment)

---

## Key Architecture Decisions

### 1. Job Queue: Direct Postgres Polling (Not pg-boss)

**Recommendation: Drop pg-boss. Use direct Postgres queries with `SELECT ... FOR UPDATE SKIP LOCKED`.**

**Rationale:**

pg-boss is a Node.js library. There is no official Python client. The build brief specifies agents in Python. Using pg-boss would require either:
- Running a separate Node.js sidecar purely for queue management (unnecessary complexity)
- Using an unofficial Python port (maintenance risk, low adoption)
- Having the orchestrator speak raw SQL to pg-boss's internal tables (fragile, undocumented)

The Postgres-native alternative is simpler and proven:

```sql
-- Claim a batch of pending jobs atomically
WITH claimed AS (
    SELECT id
    FROM jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 10
    FOR UPDATE SKIP LOCKED
)
UPDATE jobs
SET status = 'dispatching',
    started_at = now()
WHERE id IN (SELECT id FROM claimed)
RETURNING *;
```

**Why this works:**
- `FOR UPDATE SKIP LOCKED` is a Postgres primitive designed for exactly this pattern -- concurrent workers claiming jobs without conflicts
- Zero additional dependencies
- Works directly with the existing `jobs` table schema
- The orchestrator is a single instance (`min: 1, max: 1`), so contention is not even a concern in v1
- If you scale to multiple orchestrators later, `SKIP LOCKED` handles it natively
- Full visibility -- the job queue IS the `jobs` table, no hidden internal tables

**Confidence:** HIGH -- `FOR UPDATE SKIP LOCKED` is a well-documented Postgres feature available since PostgreSQL 9.5. Supabase runs Postgres 15+.

**What to remove from build brief:** All references to pg-boss. Replace with direct SQL polling in the orchestrator.

---

### 2. Orchestrator: Polling Service (Not Event-Driven)

**Recommendation: Keep the orchestrator as an always-on Cloud Run Service that polls every 5 seconds.**

**Alternatives considered:**

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Polling (recommended)** | Simple, debuggable, no infrastructure beyond Postgres | 5s latency, always-on cost | Best for v1 |
| **Supabase Database Webhooks** | Event-driven, lower latency | Requires webhook endpoint, adds failure mode, harder to debug | Overkill for v1 |
| **Postgres LISTEN/NOTIFY** | Near-instant, native Postgres | Requires persistent connection, messages lost if listener is down, no guaranteed delivery | Risky for job dispatch |
| **Supabase Realtime (server-side)** | Event-driven | Realtime is designed for client-side; server-side usage is unofficial and poorly documented | Not recommended |

**Rationale:**

Polling is the pragmatic choice for a single-developer system. The orchestrator is already always-on (`min: 1`), so the cost argument against polling is moot. The 5-second latency is irrelevant for a batch document processing system where classification takes 10-30 seconds per file.

LISTEN/NOTIFY is tempting but dangerous: if the orchestrator restarts and misses a notification, jobs are silently orphaned. You'd need a polling fallback anyway, which means you're maintaining two mechanisms.

**Polling loop pattern:**

```python
import asyncio
import asyncpg

async def poll_loop(pool: asyncpg.Pool):
    while True:
        async with pool.acquire() as conn:
            jobs = await conn.fetch("""
                WITH claimed AS (
                    SELECT id
                    FROM jobs
                    WHERE status = 'pending'
                    ORDER BY created_at ASC
                    LIMIT 10
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE jobs
                SET status = 'dispatching', started_at = now()
                WHERE id IN (SELECT id FROM claimed)
                RETURNING *
            """)
            for job in jobs:
                await dispatch_agent(job)
        await asyncio.sleep(5)
```

**Confidence:** HIGH -- polling with `SKIP LOCKED` is the standard pattern for Postgres-based job queues in production systems.

---

### 3. Agent Lifecycle: Cloud Run Jobs (Not Services)

**Recommendation: Agents (source-connector, pdf-agent, html-agent, image-agent) run as Cloud Run Jobs. The orchestrator and frontend run as Cloud Run Services.**

**Why Cloud Run Jobs for agents:**
- **Ephemeral by design** -- start, process, exit. No idle cost.
- **Built-in timeout** -- 300s for PDF agent, 600s for source connector. Cloud Run enforces this.
- **Built-in retry** -- Cloud Run Jobs have native retry configuration (though the orchestrator manages retry logic at the application level for more control).
- **Resource isolation** -- each job execution gets its own container instance. A memory-heavy PDF won't affect other jobs.

**How the orchestrator dispatches a Cloud Run Job:**

```python
from google.cloud import run_v2

async def dispatch_agent(job: dict):
    client = run_v2.JobsAsyncClient()
    job_name = f"projects/{GCP_PROJECT}/locations/{GCP_REGION}/jobs/{agent_job_name(job['agent_type'])}"

    overrides = run_v2.RunJobRequest.Overrides(
        container_overrides=[
            run_v2.RunJobRequest.Overrides.ContainerOverride(
                env=[
                    run_v2.EnvVar(name="JOB_ID", value=str(job['id'])),
                    run_v2.EnvVar(name="SOURCE_URL", value=job['source_url']),
                ]
            )
        ]
    )

    request = run_v2.RunJobRequest(name=job_name, overrides=overrides)
    operation = await client.run_job(request=request)
    # operation is a long-running operation -- don't await it
    # The agent updates job status directly in Supabase when done
```

**Key design point:** The orchestrator fires the Cloud Run Job and does NOT wait for completion. The agent itself is responsible for updating `jobs.status` to `completed` or `failed`. This avoids the orchestrator becoming a bottleneck.

**Agent-type to Cloud Run Job mapping:**

| agent_type | Cloud Run Job name | Notes |
|-----------|-------------------|-------|
| PDFAgent | `pdf-agent` | 2GB RAM, 2 CPU, 300s timeout |
| HTMLAgent | `html-agent` | 1GB RAM, 1 CPU, 180s timeout (v2) |
| ImageAgent | `image-agent` | 1GB RAM, 1 CPU, 180s timeout (v2) |
| DocxAgent | `docx-agent` | 1GB RAM, 1 CPU, 180s timeout (v2) |
| CSVAgent | `csv-agent` | 1GB RAM, 1 CPU, 180s timeout (v2) |

**Confidence:** HIGH -- Cloud Run Jobs are GA and designed for exactly this batch-processing pattern.

---

### 4. Edge Function as Trigger Layer

**Recommendation: Keep the Supabase Edge Function as the authenticated entry point. It's a thin API layer, not a compute layer.**

The Edge Function does three things:
1. Validates the Supabase JWT (authentication)
2. Generates a `run_id`
3. Triggers the Source Connector Cloud Run Job via GCP API
4. Returns `{ run_id, status: "queued" }` immediately

**Important constraint:** Supabase Edge Functions run on Deno with a default execution limit (typically 150s on Pro plans, but the function should complete in <2s since it's fire-and-forget).

**The Edge Function needs a GCP service account key to call the Cloud Run API.** This is the one awkward part of the architecture. Options:

| Approach | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Service account key in Supabase secrets** | Simple, works | Static credential to manage | Acceptable for v1 |
| **Workload Identity Federation** | No static keys | Complex setup for Edge Functions (no native support) | Overkill for v1 |
| **Proxy via Cloud Run** | Use Cloud Run's native IAM | Extra hop, extra service to maintain | Unnecessary |

**Recommendation:** Store a GCP service account key as a Supabase Edge Function secret. The service account should have only `roles/run.invoker` permission. Rotate periodically.

**Alternative considered: Skip Edge Function, call Cloud Run directly from frontend.**

Rejected because:
- Would expose GCP credentials to the client
- Would bypass Supabase Auth as the single authentication layer
- Edge Function provides a clean API contract the frontend can call with just a Supabase JWT

**Confidence:** MEDIUM -- Edge Functions calling GCP APIs works but the auth chain (Supabase JWT validated in Edge Function, then Edge Function uses service account to call GCP) adds a credential to manage. Verify Edge Function can make outbound HTTPS calls to `run.googleapis.com` (it can -- Edge Functions have outbound network access).

---

### 5. Realtime Status Updates

**Recommendation: Use Supabase Realtime `postgres_changes` channel to subscribe to the `jobs` table from the frontend.**

**Pattern:**

```typescript
// Frontend: subscribe to job updates for a specific run
const channel = supabase
  .channel('job-updates')
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'jobs',
      filter: `triggered_by=eq.${runId}`,
    },
    (payload) => {
      // payload.new contains the updated row
      updateJobStatus(payload.new)
    }
  )
  .subscribe()
```

**Requirements for this to work:**
1. The `jobs` table must have Realtime enabled in Supabase dashboard (or via `ALTER PUBLICATION supabase_realtime ADD TABLE jobs;`)
2. RLS must allow the authenticated user to read the relevant rows (already covered by the `auth_read_jobs` policy)
3. The `triggered_by` column should store the `run_id` so filtering works

**Dashboard live updates:**
- Subscribe to `jobs` table with `event: '*'` for the live job feed
- Subscribe to `content_metadata` table with `event: 'INSERT'` for real-time dashboard metric updates

**Performance note:** Supabase Realtime uses WebSockets. Each client gets one WebSocket connection, multiplexed across channels. For an internal tool with <20 concurrent users, this is well within limits.

**Confidence:** HIGH -- Supabase Realtime `postgres_changes` is a core feature, well-documented, and widely used.

---

### 6. Rules/Taxonomy Versioning and Hot-Reload

**Recommendation: Version immutability with active-version pointer.**

**Pattern:**
- Rules and taxonomy documents are immutable once published. You never edit a version -- you publish a new one.
- Only one version can be `is_active = true` at a time (enforced by partial unique index).
- When a job starts, the agent reads the current `is_active` version. That version is recorded in `jobs.rules_version` and `content_metadata.rules_version`.
- If someone activates a new version while jobs are running, running jobs continue with their original version (they already fetched it). New jobs get the new version.

**This is hot-reload without code changes:**
1. Upload new rules JSON to Supabase Storage
2. Insert new row in `rules_versions`
3. Set `is_active = true` (deactivates old version via unique index)
4. Next classification job automatically uses the new rules

**Schema supports this natively** -- the partial unique index `WHERE is_active = true` ensures exactly one active version.

**Edge case: What if the active version changes between Source Connector and agent execution?**

The Source Connector should snapshot the active `rules_version` when creating job rows. Store it in `jobs.rules_version`. The agent should use the version recorded in the job, not re-query for the active version. This ensures consistency within a single ingestion run.

```python
# Source Connector: snapshot active rules version
rules = await conn.fetchrow(
    "SELECT version, storage_path FROM rules_versions WHERE is_active = true"
)
# Insert job with pinned version
await conn.execute(
    "INSERT INTO jobs (source_url, source_type, agent_type, rules_version, status) VALUES ($1, $2, $3, $4, 'pending')",
    source_url, source_type, agent_type, rules['version']
)
```

```python
# Agent: use the version from the job, not the current active version
job = await conn.fetchrow("SELECT * FROM jobs WHERE id = $1", job_id)
rules_row = await conn.fetchrow(
    "SELECT storage_path FROM rules_versions WHERE version = $1",
    job['rules_version']
)
# Fetch rules from storage using storage_path
```

**Confidence:** HIGH -- this is a standard versioned-config pattern.

---

### 7. Source Connector Pattern for Multi-Source Ingestion

**Recommendation: Strategy pattern with a common interface, one implementation per source type.**

```python
from abc import ABC, abstractmethod
from typing import List

class SourceConnector(ABC):
    @abstractmethod
    async def list_files(self, config: dict) -> List[SourceFile]:
        """Return list of files available at source."""
        ...

    @abstractmethod
    async def download_file(self, file: SourceFile, dest: str) -> str:
        """Download file to local path, return local path."""
        ...

class S3Connector(SourceConnector):
    async def list_files(self, config: dict) -> List[SourceFile]:
        # boto3: list_objects_v2 on bucket/prefix
        ...

class SFTPConnector(SourceConnector):
    async def list_files(self, config: dict) -> List[SourceFile]:
        # paramiko: listdir on remote path
        ...

class URLConnector(SourceConnector):
    async def list_files(self, config: dict) -> List[SourceFile]:
        # httpx: HEAD request, return single file
        ...

CONNECTORS = {
    "s3": S3Connector,
    "sftp": SFTPConnector,
    "url": URLConnector,
}
```

**The Source Connector does NOT download files.** It only lists what's available, detects MIME types (via HEAD requests or partial reads), and creates job rows. The actual download happens in the agent at classification time. This keeps the Source Connector fast and lightweight.

**Exception:** For MIME detection, the connector may need to read the first 512 bytes. For S3 and HTTP, this can be done via range requests. For SFTP, a partial read is needed.

**Confidence:** HIGH -- strategy pattern is standard for multi-source integration.

---

### 8. Multi-Stage Docker Builds for Python Agents

**Recommendation: Two-stage build with a shared base pattern.**

```dockerfile
# Stage 1: Build
FROM python:3.12-slim AS builder
WORKDIR /build
COPY agents/pdf-agent/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
COPY shared/ /build/shared/
COPY agents/pdf-agent/ /build/app/

# Stage 2: Runtime
FROM python:3.12-slim AS runtime
WORKDIR /app
COPY --from=builder /install /usr/local
COPY --from=builder /build/shared /app/shared
COPY --from=builder /build/app /app
ENV PYTHONPATH=/app
CMD ["python", "main.py"]
```

**Key points:**
- `shared/` is copied into every agent image (it contains Pydantic models and Supabase client)
- Build dependencies (gcc, etc.) stay in the builder stage
- Runtime image is minimal -- just Python + installed packages + application code
- Pin Python version to `3.12-slim` for consistency

**Confidence:** HIGH -- standard Docker pattern.

---

## Patterns to Follow

### Pattern 1: Fire-and-Forget Dispatch

**What:** The triggering component (Edge Function triggering Source Connector, Orchestrator triggering agents) never waits for the downstream component to finish. The downstream component is responsible for updating its own status.

**When:** All inter-component communication in this system.

**Why:** Prevents cascading timeouts. The Edge Function has a short execution limit. The Orchestrator should not be blocked waiting for a 5-minute PDF classification. Each component manages its own lifecycle.

**Example:**
```python
# Orchestrator dispatches and moves on
async def dispatch_agent(job: dict):
    await update_job_status(job['id'], 'running')
    await trigger_cloud_run_job(job)  # fire-and-forget
    # DO NOT await the job completion here
```

### Pattern 2: Self-Reporting Agents

**What:** Each agent is responsible for reporting its own outcome (success or failure) to the `jobs` table.

**When:** Every agent execution.

**Why:** The orchestrator does not track running jobs. This keeps the orchestrator stateless and simple. If an agent crashes without reporting (e.g., OOM kill), the orchestrator's stale job detection picks it up.

**Example:**
```python
# Agent main.py pattern
async def main():
    job_id = os.environ["JOB_ID"]
    try:
        result = await process_file()
        await write_content_metadata(result)
        await update_job(job_id, status="completed", completed_at=datetime.utcnow())
    except Exception as e:
        await update_job(job_id, status="failed", error_msg=str(e))
        raise  # Re-raise so Cloud Run marks the execution as failed
```

### Pattern 3: Stale Job Detection

**What:** The orchestrator periodically checks for jobs stuck in `running` status beyond their expected timeout.

**When:** Every poll cycle (or every N cycles to reduce load).

**Why:** If an agent container is killed (OOM, timeout, infrastructure failure) without updating the job status, the job would be stuck in `running` forever.

**Example:**
```python
# Run every 60 seconds (every 12th poll cycle)
async def detect_stale_jobs(conn):
    stale = await conn.fetch("""
        UPDATE jobs
        SET status = CASE WHEN retry_count < 3 THEN 'retry' ELSE 'failed' END,
            error_msg = 'Agent timed out or crashed',
            retry_count = retry_count + 1
        WHERE status = 'running'
          AND started_at < now() - interval '10 minutes'
        RETURNING *
    """)
    for job in stale:
        log.warning(f"Stale job detected: {job['id']}")
```

### Pattern 4: Idempotent Job Processing

**What:** Agents must handle being invoked twice for the same job gracefully.

**When:** Retry scenarios, stale job recovery.

**Why:** If a job is marked for retry, a new agent execution starts. If the previous agent was slow (not actually dead), two agents might process the same file. The agent should check job status before processing and use upsert for `content_metadata`.

**Example:**
```python
# At start of agent
job = await get_job(job_id)
if job['status'] != 'running':
    log.info(f"Job {job_id} is {job['status']}, skipping")
    return

# For content_metadata, use upsert on (job_id)
await conn.execute("""
    INSERT INTO content_metadata (job_id, source_url, ...)
    VALUES ($1, $2, ...)
    ON CONFLICT (job_id) DO UPDATE SET ...
""", job_id, source_url, ...)
```

**Note:** This requires adding a unique constraint on `content_metadata.job_id`:
```sql
ALTER TABLE content_metadata ADD CONSTRAINT content_metadata_job_id_unique UNIQUE (job_id);
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Orchestrator as State Machine

**What:** Making the orchestrator track the state of every running job, poll for completion, and manage complex state transitions.

**Why bad:** The orchestrator becomes a single point of failure with in-memory state. If it restarts, all tracking is lost. It becomes increasingly complex as you add retry logic, timeouts, and multiple agent types.

**Instead:** Keep the orchestrator stateless. It reads pending/retry jobs from the database, dispatches them, and moves on. Agents self-report. The database is the single source of truth for job state.

### Anti-Pattern 2: Chaining Cloud Run Jobs

**What:** Having the Source Connector directly trigger agent Cloud Run Jobs.

**Why bad:** Removes central control. You lose the ability to rate-limit, prioritise, or pause processing. The Source Connector would need GCP IAM permissions it shouldn't have. Debugging becomes harder with no central dispatch log.

**Instead:** Source Connector writes to the `jobs` table. The Orchestrator reads from the table and dispatches. Clean separation of concerns.

### Anti-Pattern 3: Using LISTEN/NOTIFY as Primary Job Queue

**What:** Using Postgres LISTEN/NOTIFY instead of polling for the job queue.

**Why bad:** NOTIFY messages are ephemeral -- if the listener is not connected when the message is sent, it's lost. During orchestrator restarts, deployments, or network hiccups, jobs would be silently dropped.

**Instead:** Use polling with `FOR UPDATE SKIP LOCKED`. It's reliable, simple, and the 5-second latency is irrelevant for document processing workloads.

### Anti-Pattern 4: Storing Files in the Database

**What:** Storing source PDFs or extracted text as BYTEA/TEXT columns in Postgres.

**Why bad:** Bloats database, slows backups, hits row size limits. A single PDF can be 50MB+.

**Instead:** Store files in Supabase Storage. Store only the `storage_path` or `source_url` in the database. Agents download files at runtime via signed URLs.

### Anti-Pattern 5: Shared Agent Container

**What:** Running all agent types in one container that switches behaviour based on input.

**Why bad:** Different agents have different resource requirements (PDF agent needs 2GB RAM, CSV agent needs 256MB). A single container must be sized for the worst case. Updates to one agent force redeployment of all agents.

**Instead:** One Cloud Run Job definition per agent type, each with its own Dockerfile, resource limits, and deployment cycle.

---

## Scalability Considerations

| Concern | v1 (internal, <100 files/day) | v2 (client, <10K files/day) | Future (enterprise, >100K files/day) |
|---------|-------------------------------|-----------------------------|------------------------------------|
| **Job throughput** | Single orchestrator, sequential dispatch | Single orchestrator, batch dispatch (claim 10+ jobs per cycle) | Multiple orchestrator instances, `SKIP LOCKED` handles contention |
| **Agent concurrency** | Cloud Run auto-scales agent jobs (default 100 concurrent) | Increase Cloud Run concurrency limits, add agent-level rate limiting for Claude API | Dedicated Cloud Run service with queue-based autoscaler |
| **Database connections** | Direct connections via Supabase client | Connection pooling via Supabase's built-in pgBouncer (port 6543) | Read replicas for dashboard queries, write primary for agents |
| **Realtime subscribers** | <20 concurrent WebSocket connections | <200 connections, well within Supabase Pro limits | Supabase Enterprise or custom WebSocket server |
| **Storage** | Supabase Storage (5GB free, 100GB Pro) | Supabase Storage with CDN | Move source files to GCS, keep metadata in Supabase Storage |
| **Claude API rate limits** | Tier 1 limits sufficient | Request rate limit increases from Anthropic | Implement token bucket rate limiter in orchestrator |

---

## Suggested Build Order

Based on component dependencies, the system must be built in this order:

```
Phase 1: Foundation (no inter-component communication yet)
  1. Supabase schema (tables, RLS, storage buckets)
  2. Shared Python library (models, Supabase client)

Phase 2: Pipeline core (components can talk to each other)
  3. Source Connector (writes to jobs table)
  4. Orchestrator (reads jobs, dispatches Cloud Run Jobs)
  5. PDF Agent (reads job, processes file, writes results)

Phase 3: Trigger layer (human-initiated flow works end-to-end)
  6. Edge Function (authenticated trigger)
  7. CI/CD pipeline (GitHub Actions)

Phase 4: Frontend (visibility into the pipeline)
  8. Auth + Login
  9. Dashboard (with Realtime subscriptions)
  10. Rules Manager
  11. Ingestion Trigger UI
```

**Dependency chain:**
- Shared library must exist before any agent (all agents import it)
- Schema must exist before Source Connector (it writes to `jobs`)
- Source Connector must work before Orchestrator can be tested (Orchestrator needs pending jobs)
- Orchestrator must work before agents are useful (agents are triggered by orchestrator)
- Edge Function depends on Source Connector being deployable to Cloud Run
- Frontend depends on everything else being functional

**What can be built in parallel:**
- Once the schema and shared library exist, the Source Connector and PDF Agent can be developed in parallel (they don't depend on each other, only on the shared library)
- Frontend screens can be developed in parallel with each other (they all read from the same database)
- CI/CD can be developed alongside the agents (it's a deployment concern, not a runtime dependency)

---

## Communication Protocol Summary

| From | To | Mechanism | Sync/Async | Notes |
|------|-----|-----------|------------|-------|
| Frontend | Edge Function | HTTPS POST | Sync (returns run_id) | Supabase JWT auth |
| Edge Function | Source Connector | GCP Cloud Run API | Async (fire-and-forget) | Service account auth |
| Source Connector | jobs table | Supabase client (INSERT) | Sync | Batch inserts recommended |
| Orchestrator | jobs table | asyncpg (SELECT FOR UPDATE) | Sync | 5-second polling interval |
| Orchestrator | Agent Jobs | GCP Cloud Run API | Async (fire-and-forget) | Per-job env var overrides |
| Agent | Supabase Storage | Supabase client (download) | Sync | Signed URLs for private buckets |
| Agent | Claude API | Anthropic SDK | Sync | 10-30 second response time |
| Agent | jobs table | Supabase client (UPDATE) | Sync | Self-reporting status |
| Agent | content_metadata | Supabase client (INSERT) | Sync | Validated by Pydantic |
| Supabase Realtime | Frontend | WebSocket | Push | postgres_changes on jobs + content_metadata |

---

## Database Connection Strategy

**Agents and Source Connector (Cloud Run Jobs):** Use `supabase-py` client with the service role key. These are short-lived -- one connection per execution, closed on exit. No pooling needed.

**Orchestrator (Cloud Run Service, always-on):** Use `asyncpg` with a connection pool for the polling loop. The Supabase connection string is available via the project settings. Use the pooled connection endpoint (port 6543) to avoid exhausting direct connections.

```python
# Orchestrator connection pool
pool = await asyncpg.create_pool(
    dsn=os.environ["DATABASE_URL"],  # Use pooler endpoint
    min_size=1,
    max_size=5,
)
```

**Frontend:** Uses `@supabase/supabase-js` client-side with the anon key. All queries go through Supabase's PostgREST API with RLS enforcement.

**Confidence:** MEDIUM -- the split between `asyncpg` for the orchestrator and `supabase-py` for agents is a pragmatic recommendation. Verify that Supabase's connection pooler (pgBouncer) supports `FOR UPDATE SKIP LOCKED` in transaction mode (it does, as long as transactions are used within a single statement or explicit transaction block).

---

## Security Boundaries

| Boundary | Enforcement |
|----------|-------------|
| Frontend to Supabase | Supabase anon key + RLS policies (row-level security) |
| Frontend to Edge Function | Supabase JWT (validated in Edge Function) |
| Edge Function to GCP | Service account key (stored in Supabase secrets) |
| Orchestrator to GCP | Cloud Run service identity (IAM, no key needed) |
| Agents to Supabase | Service role key (from GCP Secret Manager) |
| Agents to Claude API | API key (from GCP Secret Manager) |
| All secrets | GCP Secret Manager -- never in source code or env files |

**Key principle:** The frontend never touches service role keys or API keys. All privileged operations go through Edge Functions or server-side components.

---

## Sources

- PostgreSQL `FOR UPDATE SKIP LOCKED` documentation (postgresql.org) -- training data, HIGH confidence
- GCP Cloud Run Jobs documentation (cloud.google.com) -- training data, HIGH confidence
- Supabase Realtime `postgres_changes` documentation (supabase.com) -- training data, HIGH confidence
- Supabase Edge Functions documentation (supabase.com) -- training data, MEDIUM confidence
- pg-boss GitHub repository (github.com/timgit/pg-boss) -- training data, confirmed Node.js only, HIGH confidence
- Build brief: `NinjaWork/ForgeDC/_internal/DataBridgeAI/Briefs/architecture-build-brief.md` -- project source, HIGH confidence

**Note:** All findings are based on training data (cutoff ~May 2025). No live web verification was possible during this research session. Core patterns (Postgres job queues, Cloud Run Jobs, Supabase Realtime) are well-established and unlikely to have changed. Edge Function specifics and Cloud Run API details should be verified against current documentation during implementation.
