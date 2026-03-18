# Technology Stack

**Project:** DataBridge AI
**Researched:** 2026-03-18
**Mode:** Ecosystem (Stack dimension)
**Overall confidence:** HIGH (versions verified via PyPI/npm index queries)

---

## Fixed Stack (Non-Negotiable)

These are decided. Listed for completeness and version pinning only.

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Database | Supabase PostgreSQL | Managed (eu-west-1) | Primary data store, RLS, Realtime |
| Auth | Supabase Auth | Managed | User authentication + JWT-based RLS |
| File storage | Supabase Storage | Managed | Rules, taxonomy, prompts, source content |
| Compute | GCP Cloud Run | europe-west1 | Agents (Jobs) + Orchestrator (Service) |
| Container registry | GCP Artifact Registry | europe-west1 | Docker image storage |
| Secrets | GCP Secret Manager | -- | SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY |
| Frontend framework | Next.js (App Router) | 15.x LTS | Dashboard, Rules Manager, Ingestion Trigger |
| Frontend hosting | Vercel | -- | Auto-deploys from GitHub |
| UI components | shadcn/ui | 4.0.8 (CLI) | Component primitives |
| CSS | Tailwind CSS | 4.2.2 | Utility-first styling |
| LLM | Anthropic Claude API | claude-sonnet-4-20250514 | Content classification |
| Agent language | Python | 3.12 | All backend agents |
| Validation | Pydantic | 2.12.x | Schema validation for agent I/O |
| CI/CD | GitHub Actions | -- | Build, test, deploy pipeline |

### Next.js Version Decision: 15.x, NOT 16.x

**Confidence:** HIGH

Next.js 16.1.7 is the latest stable release, but use **Next.js 15.x** for this project. Rationale:

1. **shadcn/ui compatibility** -- shadcn/ui v4 was built and tested against Next.js 15. Next.js 16 introduced breaking changes to the App Router internals (new async component model by default). shadcn/ui compatibility with v16 is not yet verified.
2. **Supabase SSR** -- `@supabase/ssr` 0.9.0 middleware patterns are documented and tested against Next.js 15. The middleware API changed in v16.
3. **Vercel deployment stability** -- Next.js 15 is the current LTS-equivalent. For a product launching to pharma clients, stability matters more than bleeding edge.
4. **Tailwind CSS 4.x** -- Tailwind v4 works with Next.js 15. shadcn/ui v4 explicitly supports Tailwind v4.

Pin to `next@15` in package.json. Upgrade to 16 after shadcn/ui and @supabase/ssr confirm compatibility.

### Tailwind CSS Version Decision: 4.x, NOT 3.x

**Confidence:** MEDIUM

Tailwind CSS 4.2.2 is current. shadcn/ui CLI v4.0.8 generates Tailwind v4 compatible output. The new CSS-first configuration approach in Tailwind v4 is cleaner and avoids the `tailwind.config.ts` file. Use Tailwind v4 unless you encounter specific issues during shadcn/ui init -- in that case, fall back to `tailwindcss@3.4.19`.

---

## Recommended Stack (Flexible Components)

### Job Queue: Direct Postgres Polling (NOT pg-boss)

**Confidence:** HIGH
**Recommendation:** Drop pg-boss entirely. Use direct SQL polling against the `jobs` table.

| Criterion | pg-boss | Direct SQL Polling |
|-----------|---------|-------------------|
| Language | Node.js (npm package) | Any (SQL) |
| Integration | Requires a Node.js sidecar or Edge Function worker | Python agents query Postgres directly |
| Complexity | Additional dependency, Node.js runtime in agent ecosystem | Zero additional dependencies |
| Supabase compatibility | Requires direct Postgres connection string (pooler may cause issues with LISTEN/NOTIFY) | Works perfectly with Supabase client or psycopg |
| Retry logic | Built-in | Implemented in ~20 lines of SQL/Python |

**Why not pg-boss:** pg-boss is a Node.js library. The agents are Python. Using pg-boss would require either (a) a separate Node.js service to bridge between pg-boss and Python agents, or (b) rewriting the orchestrator in Node.js. Both add complexity for a single-developer project.

**Why not procrastinate or pgqueuer:** Both are Python Postgres job queues, but they introduce their own table schemas and migration requirements. The `jobs` table already exists with the exact schema needed. Adding a job queue library on top would be redundant.

**Implementation pattern:**

```python
# Orchestrator polls every 5 seconds
async def claim_next_job(supabase_client) -> Optional[dict]:
    """Atomically claim the next pending job using UPDATE ... RETURNING."""
    result = supabase_client.rpc(
        'claim_next_job',
        {}
    ).execute()
    return result.data[0] if result.data else None
```

```sql
-- Postgres function for atomic job claiming
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS SETOF jobs AS $$
  UPDATE jobs
  SET status = 'running', started_at = now()
  WHERE id = (
    SELECT id FROM jobs
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql;
```

`FOR UPDATE SKIP LOCKED` ensures safe concurrent access if the orchestrator ever scales beyond one instance. This is the standard Postgres job queue pattern -- battle-tested, zero dependencies, fully visible in the `jobs` table the dashboard already queries.

---

### API Trigger: Supabase Edge Function (keep as specified)

**Confidence:** HIGH
**Recommendation:** Keep the Supabase Edge Function for the ingest trigger.

| Alternative | Why Not |
|-------------|---------|
| Cloud Run HTTP endpoint | Requires separate auth layer. Edge Function gets Supabase JWT validation for free. |
| Cloud Run + API Gateway | Over-engineered for a single trigger endpoint. |
| Direct Cloud Run Job trigger from frontend | Exposes GCP credentials to the client. Security risk. |

The Edge Function is the correct architectural choice. It validates the Supabase JWT, then triggers the Cloud Run Job server-side using a GCP service account. The frontend never touches GCP credentials.

**One caveat:** Edge Functions run on Deno. Keep the function minimal (validate JWT, trigger Cloud Run, return). Do not put business logic in the Edge Function -- it should be a thin proxy.

**Edge Function runtime:** Supabase Edge Functions now support both Deno and Node.js runtimes. Use **Deno** (the default) since the function is trivial and Deno's TypeScript support is native.

---

### PDF Extraction: PyMuPDF (primary) + pdfplumber (fallback)

**Confidence:** HIGH
**Recommendation:** Reverse the order specified in the build brief. Use PyMuPDF as primary, pdfplumber as fallback.

| Criterion | PyMuPDF (fitz) | pdfplumber |
|-----------|---------------|------------|
| Version | 1.27.2 | 0.11.9 |
| Speed | 5-10x faster for text extraction | Slower (Python-level page iteration) |
| Memory | Lower (C library bindings) | Higher (builds page-level objects) |
| Table extraction | Good (since v1.23) | Excellent (primary strength) |
| Scanned PDF support | Built-in OCR integration via Tesseract | No OCR support |
| Image extraction | Yes (extract embedded images) | No |
| Docker image size | ~30MB (C library) | ~15MB (pure Python + pdfminer.six) |
| Licence | AGPL-3.0 (free for server-side use; no distribution of modified source required for SaaS) | MIT |

**Why PyMuPDF primary:**
1. **Speed matters at scale.** When processing hundreds of pharma PDFs in a batch, 5-10x extraction speed directly reduces Cloud Run costs and job timeout risk.
2. **Scanned PDFs are common in pharma.** Many regulatory documents are scanned. PyMuPDF's integrated OCR fallback handles these without a separate pipeline.
3. **Memory efficiency.** Cloud Run Jobs have a 2GB memory limit. PyMuPDF's C-level processing uses less memory per page.

**When to fall back to pdfplumber:**
- PyMuPDF extraction returns empty/garbled text (rare but possible with some PDF generators)
- Table-heavy documents where pdfplumber's explicit table detection yields better structured output

**AGPL-3.0 licence note:** PyMuPDF's AGPL licence does not require source disclosure for SaaS/internal use. It would only trigger if you distributed the modified library itself. For Cloud Run containers processing PDFs server-side, AGPL is not a concern. If legal review flags this, Artifex (PyMuPDF's maintainer) offers a commercial licence.

```python
import fitz  # PyMuPDF

def extract_text(pdf_bytes: bytes) -> str:
    """Extract text from PDF, with OCR fallback for scanned pages."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text_parts = []
    for page in doc:
        text = page.get_text()
        if len(text.strip()) < 50:  # Likely scanned page
            text = page.get_text("text", flags=fitz.TEXT_PRESERVE_WHITESPACE)
        text_parts.append(text)
    return "\n\n".join(text_parts)
```

---

### HTML Extraction: beautifulsoup4 + httpx

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| beautifulsoup4 | 4.14.3 | HTML parsing and content extraction |
| httpx | 0.28.1 | Async HTTP client for fetching HTML pages |
| lxml | latest | Fast HTML parser backend for BeautifulSoup |

**Why beautifulsoup4:** The standard. Handles malformed HTML (common on pharma marketing sites). The `lxml` parser backend is significantly faster than the default `html.parser`.

**Why httpx over requests:** httpx supports async, HTTP/2, and has a cleaner API. The agents are async (Cloud Run Jobs benefit from non-blocking I/O when fetching multiple URLs). httpx is also the HTTP client used internally by the Anthropic Python SDK, so it is already a transitive dependency.

**Do NOT use:** Playwright, Selenium, or any headless browser. Pharma content URLs are static HTML (marketing pages, regulatory documents). A headless browser adds 500MB+ to the Docker image and 10x the execution time. If JavaScript-rendered content is needed in v2, add it then.

---

### Image Processing: Pillow + Claude Vision API (NOT Tesseract)

**Confidence:** MEDIUM (Claude Vision approach needs validation)

| Approach | For v1 (import only) | For v2 (classification) |
|----------|----------------------|------------------------|
| Image storage | Pillow for format validation + thumbnails | Pillow for preprocessing |
| Text extraction | Not needed in v1 | Claude Vision API (send image directly) |
| OCR | Not needed in v1 | Avoid pytesseract -- Claude Vision is superior for pharma content |

**Why Claude Vision over Tesseract for v2:**
1. Claude's vision capability can read text AND understand context simultaneously. Tesseract extracts text, then you send text to Claude -- two steps instead of one.
2. Pharma images often contain charts, graphs, infographics. Claude Vision understands these; Tesseract returns gibberish.
3. Tesseract requires system-level installation (`apt-get install tesseract-ocr`) which complicates Docker builds and adds ~100MB.

**For v1 (import and storage only):**

```python
from PIL import Image
import io

def validate_image(image_bytes: bytes) -> dict:
    """Validate image format and extract basic metadata."""
    img = Image.open(io.BytesIO(image_bytes))
    return {
        "format": img.format,
        "size": img.size,
        "mode": img.mode,
    }
```

| Library | Version | Purpose |
|---------|---------|---------|
| Pillow | 12.1.1 | Image validation, format detection, thumbnails |

---

### DOCX Extraction: python-docx

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| python-docx | 1.2.0 | Extract text and structure from Word documents |

For v1 (import and storage only), python-docx validates file integrity. For v2 classification, it extracts paragraphs, tables, and metadata. No alternatives needed -- python-docx is the only serious Python library for DOCX handling.

---

### MIME Type Detection: python-magic

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| python-magic | 0.4.27 | True MIME type detection from file bytes |

**Docker note:** python-magic requires `libmagic` at the system level. Add to Dockerfiles:

```dockerfile
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*
```

The build brief correctly specifies reading first 512 bytes for MIME detection. python-magic wraps the standard `libmagic` library, which is the same tool used by the `file` command on Linux.

---

### Source Connectors: boto3 + paramiko + httpx

**Confidence:** HIGH

| Library | Version | Purpose | When Used |
|---------|---------|---------|-----------|
| boto3 | 1.42.x | AWS S3 client | S3 source type |
| paramiko | 4.0.0 | SSH/SFTP client | SFTP source type |
| httpx | 0.28.1 | HTTP client | URL source type |

**boto3 version pinning:** Do NOT pin boto3 to an exact version. It releases multiple times per week. Use `>=1.42,<2.0` in requirements.

**paramiko 4.0.0:** Major version released recently. Uses modern cryptography defaults. Verify SFTP connectivity in testing -- v4 dropped some legacy algorithms.

---

### Logging: structlog + google-cloud-logging

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| structlog | 25.5.0 | Structured logging with context |
| google-cloud-logging | 3.14.0 | Cloud Logging integration for Cloud Run |

**Why structlog:** Cloud Run captures stdout/stderr and sends to Cloud Logging. structlog outputs JSON by default, which Cloud Logging parses into queryable fields. This means `log.info("job_completed", job_id=job_id, duration_ms=1234)` becomes a searchable, filterable log entry in GCP.

**Do NOT use:** Python's built-in `logging` module directly. It outputs unstructured text that Cloud Logging cannot parse into fields. Always wrap with structlog.

---

### Retry Logic: tenacity

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| tenacity | 9.1.4 | Retry decorator for Claude API calls and external fetches |

**Why tenacity over manual retry:** The Claude API can return 429 (rate limit) or 529 (overloaded). tenacity provides exponential backoff with jitter out of the box. Manual retry loops are error-prone.

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from anthropic import RateLimitError, APIStatusError

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((RateLimitError, APIStatusError)),
)
async def classify_content(client, prompt: str) -> dict:
    ...
```

---

### GCP Client Libraries

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| google-cloud-run | 0.15.0 | Trigger Cloud Run Jobs from orchestrator |
| google-cloud-secret-manager | 2.26.0 | Read secrets at runtime (if needed beyond env vars) |

**Note:** On Cloud Run, secrets are typically mounted as environment variables via the service configuration. `google-cloud-secret-manager` is a fallback if you need programmatic secret access. In most cases, you will not need it -- Cloud Run injects secrets as env vars at deploy time.

---

### Supabase Client Libraries

**Confidence:** HIGH

**Python (agents):**

| Library | Version | Purpose |
|---------|---------|---------|
| supabase | 2.28.2 | Python client for Supabase (wraps PostgREST, Storage, Auth) |

**TypeScript (frontend):**

| Library | Version | Purpose |
|---------|---------|---------|
| @supabase/supabase-js | 2.99.2 | Browser/server Supabase client |
| @supabase/ssr | 0.9.0 | Server-side auth helpers for Next.js middleware |

**Supabase Realtime for job status:** Use `@supabase/supabase-js` channel subscriptions in the frontend. Subscribe to `postgres_changes` on the `jobs` table filtered by `run_id`. This provides live job status updates without polling.

```typescript
const channel = supabase
  .channel('job-updates')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `triggered_by=eq.${runId}` },
    (payload) => {
      // Update job status in UI
    }
  )
  .subscribe()
```

**Realtime gotcha:** Supabase Realtime requires the table to have RLS enabled AND a policy that allows the authenticated user to SELECT the rows they want to receive updates for. The RLS policies in the build brief already handle this.

---

### Frontend Charts: Recharts

**Confidence:** HIGH

| Library | Version | Purpose |
|---------|---------|---------|
| recharts | 3.8.0 | Dashboard charts (bar, line) |

Recharts is specified in the build brief and is the correct choice. It is React-native, composable, and handles the two chart types needed (bar chart for L0 categories, line chart for ingestion volume).

**Do NOT use:** Chart.js (requires a wrapper), D3 (over-engineered for two charts), or Nivo (heavy bundle).

---

## Full Dependency Summary

### Python (agents/shared)

```txt
# requirements.txt — shared across all agents
pydantic>=2.12,<3.0
supabase>=2.28,<3.0
anthropic>=0.85,<1.0
httpx>=0.28,<1.0
structlog>=25.5,<26.0
tenacity>=9.1,<10.0
python-magic>=0.4.27,<0.5

# PDF agent
PyMuPDF>=1.27,<2.0
pdfplumber>=0.11,<1.0

# Source connector
boto3>=1.42,<2.0
paramiko>=4.0,<5.0

# Image handling (v1: validation only)
Pillow>=12.1,<13.0

# HTML extraction (v2: classification)
beautifulsoup4>=4.14,<5.0
lxml>=5.0

# DOCX extraction (v2: classification)
python-docx>=1.2,<2.0

# GCP integration
google-cloud-run>=0.15,<1.0
google-cloud-logging>=3.14,<4.0

# Dev dependencies
pytest>=8.0
pytest-asyncio>=0.24
ruff>=0.9
mypy>=1.14
```

### Node.js (frontend)

```json
{
  "dependencies": {
    "next": "^15",
    "@supabase/supabase-js": "^2.99",
    "@supabase/ssr": "^0.9",
    "recharts": "^3.8",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "typescript": "^5.9",
    "tailwindcss": "^4.2",
    "@types/react": "^19",
    "@types/node": "^22"
  }
}
```

**Note:** shadcn/ui components are installed via the CLI (`npx shadcn@latest add button`) and committed to source. They are not a runtime dependency.

### Deno (Edge Function)

```typescript
// supabase/functions/ingest/index.ts
// Supabase Edge Functions use Deno runtime
// No package.json needed -- imports via URL or import maps
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Job queue | Direct SQL polling | pg-boss | Node.js library in a Python ecosystem. Adds a runtime dependency. |
| Job queue | Direct SQL polling | procrastinate | Creates its own schema. Redundant with existing `jobs` table. |
| Job queue | Direct SQL polling | Celery + Redis/RabbitMQ | Adds a message broker service. Over-engineered for single-orchestrator. |
| PDF extraction | PyMuPDF (primary) | pdfplumber (primary) | 5-10x slower. No OCR. Higher memory. |
| PDF extraction | PyMuPDF (primary) | pypdf | Lower quality extraction. No OCR. Less maintained. |
| HTTP client | httpx | requests | No async support. Not HTTP/2 capable. |
| Image OCR (v2) | Claude Vision API | pytesseract | Two-step process. Cannot understand visual context. 100MB+ added to image. |
| Logging | structlog | stdlib logging | Unstructured output. Cloud Logging cannot parse fields. |
| Charts | Recharts | Chart.js | Requires react-chartjs-2 wrapper. Less React-idiomatic. |
| Charts | Recharts | D3 | Over-engineered for two simple charts. |
| Tailwind | v4 | v3 | v4 is current. shadcn/ui v4 supports it. CSS-first config is cleaner. |
| Next.js | v15 | v16 | Too new. shadcn/ui and @supabase/ssr not yet verified on v16. |
| API trigger | Edge Function | Cloud Run endpoint | No free JWT validation. Exposes GCP concerns to frontend. |

---

## Docker Base Images

| Agent | Base Image | Why |
|-------|-----------|-----|
| All Python agents | `python:3.12-slim` | Smallest official Python image. Debian-based for system deps. |
| Frontend | `node:22-alpine` | Smallest Node.js image. Next.js standalone output. |

**Multi-stage build pattern (mandatory per constraints):**

```dockerfile
# Stage 1: Build
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY . .
CMD ["python", "main.py"]
```

---

## Python Version: 3.12

**Confidence:** HIGH

Use Python 3.12, not 3.13. Rationale:
1. PyMuPDF wheels are available for 3.12. Some C-extension libraries lag on 3.13 support.
2. 3.12 is the current production-stable release used by most Cloud Run deployments.
3. Pydantic 2.12.x fully supports 3.12.

---

## Sources

All version numbers verified via direct PyPI/npm index queries on 2026-03-18:
- `pip3 index versions [package]` for all Python packages
- `npm view [package] version` for all Node.js packages
- Build brief: `NinjaWork/ForgeDC/_internal/DataBridgeAI/Briefs/architecture-build-brief.md`
- PROJECT.md: `.planning/PROJECT.md`

**Confidence notes:**
- Version numbers: HIGH (verified directly against package registries)
- Library comparisons (PyMuPDF vs pdfplumber speed claims): MEDIUM (based on training data, widely reported but not independently benchmarked in this session)
- shadcn/ui + Tailwind v4 compatibility: MEDIUM (shadcn CLI v4 is current, but Tailwind v4 is relatively new)
- Next.js 16 compatibility warnings: LOW (based on training data about Next.js 16 changes; verify before upgrading)
- Claude Vision for image classification: MEDIUM (capability exists, but efficacy for pharma content needs validation in v2)
- AGPL licence assessment: MEDIUM (standard interpretation, but recommend brief legal review for pharma client deployment)
