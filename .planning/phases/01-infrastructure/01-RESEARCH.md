# Phase 1: Infrastructure - Research

**Researched:** 2026-03-18
**Domain:** Full-stack deployment (Next.js + Supabase + Cloud Run/Cognee)
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire deployment stack for DataBridgeAI: a Next.js frontend on Vercel with Supabase Auth (email/password, invite-only), a Cognee FastAPI backend on Cloud Run (europe-west1), and Supabase Storage for OWL files and content. The project is greenfield — both `src/` and `tests/` directories are empty, and no `package.json` exists yet.

Next.js 16 is the current stable release (October 2025, latest patch 16.1.7 as of March 2026). It renames `middleware.ts` to `proxy.ts`, uses Turbopack by default, and requires React 19.2+. The `@supabase/ssr` package provides cookie-based session management with `createBrowserClient` and `createServerClient`, using `getClaims()` (not `getSession()`) for server-side token validation. Cognee v0.5.5 ships a FastAPI server with a `/health` endpoint, supports Anthropic Claude via `LLM_PROVIDER="anthropic"`, and provides NetworkX as a zero-config graph store via `GRAPH_DATABASE_PROVIDER="networkx"`.

The shadcn/ui Sidebar component (official, not third-party) provides a production-ready collapsible sidebar with SidebarProvider, SidebarMenu, SidebarMenuItem, SidebarMenuButton, and SidebarRail for icon-only mode. This maps directly to the dashboard shell requirements (5 sidebar sections, collapsible, icons + labels).

**Primary recommendation:** Use Next.js 16 (latest stable) with pnpm, `@supabase/ssr` for auth, the official shadcn/ui Sidebar component for the dashboard shell, and deploy Cognee via a custom Dockerfile derived from the official one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Email/password login via Supabase Auth — no magic links, no social login
- Invite-only access — no public sign-up form. Admin creates users in Supabase dashboard
- Long-lived sessions (Supabase defaults) — minimise re-login friction for daily-use internal tool
- Collapsible left sidebar navigation with icons + labels
- All 5 planned sections visible in sidebar: Dashboard, Ontology, Dictionary, Rules, Content
- Unbuilt sections (Ontology, Dictionary, Rules, Content) shown as greyed-out/disabled — not clickable until phases ship
- Dashboard home page shows: welcome card with user greeting + system health status (Cognee connection, Storage availability)
- Light theme only for v1 — no dark mode toggle
- Anthropic Claude as the LLM provider for Cognee entity extraction (ANTHROPIC_API_KEY)
- Cloud Run scale-to-zero (default) — accept cold start latency for internal v1 with 2 users
- Visible health indicator on dashboard — small status dot (green/amber/red) showing Cognee connection status
- All secrets (API keys, Supabase credentials) managed via GCP Secret Manager, referenced by Cloud Run at runtime
- Next.js App Router (not Pages Router)
- pnpm as package manager
- Feature-based source organisation: `src/features/ontology/`, `src/features/dictionary/`, `src/features/rules/`, `src/features/content/`, plus `src/components/` for shared UI
- Single repo — frontend + Cognee backend (Dockerfile + deploy scripts) all in this repository
- shadcn/ui + Tailwind CSS for component library and styling

### Claude's Discretion
- Login page visual design (centred card vs split layout)
- Exact sidebar styling, collapse behaviour, icon choices
- Dashboard welcome card copy and health status presentation
- Cognee Dockerfile specifics and Cloud Run service configuration
- Next.js proxy (middleware) implementation for route protection
- Supabase client setup patterns (server vs client components)
- ESLint/Prettier/TypeScript configuration defaults

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Supabase project configured with Auth, Postgres, Storage, and RLS enabled | Supabase project already provisioned (`vkdcliaocklnlbthwdpx`). `@supabase/ssr` package handles cookie-based auth. Storage bucket creation via JS SDK. RLS policies on `storage.objects` table. |
| INFRA-02 | Next.js frontend deployed on Vercel with Supabase credential sync | Next.js 16 + pnpm scaffolding. Vercel-Supabase Marketplace integration auto-syncs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| INFRA-03 | Cognee FastAPI service deployed on Cloud Run (europe-west1) | Cognee v0.5.5 Dockerfile (Python 3.12, uv package manager). FastAPI on port 8000. Cloud Run with `--set-secrets` for Secret Manager references. Health endpoint at `GET /health`. |
| INFRA-04 | NetworkX graph store running inside Cognee container | Set `GRAPH_DATABASE_PROVIDER="networkx"` — zero additional config. Data persists at `.cognee_system/databases/cognee_graph.pkl`. Suitable for v1 (2 users, small graph). |
| INFRA-05 | Supabase Storage bucket for OWL files and uploaded content | Create private bucket(s) via SDK or dashboard. RLS policies on `storage.objects` for authenticated access. `createSignedUrl` for time-limited downloads. |
| INFRA-06 | User can log in via Supabase Auth and access protected routes | `@supabase/ssr` with `createBrowserClient`/`createServerClient`. `proxy.ts` (Next.js 16) refreshes tokens via `getClaims()`. Route protection via proxy matcher + server component checks. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.x (latest) | React framework with App Router | Current stable, Turbopack default, proxy.ts for auth |
| react / react-dom | 19.2.x | UI library | Required by Next.js 16 |
| @supabase/supabase-js | latest | Supabase client SDK | Official client for Auth, Postgres, Storage |
| @supabase/ssr | latest | SSR cookie-based auth | Official SSR package, replaces deprecated auth-helpers |
| tailwindcss | 4.x | Utility-first CSS | Default with create-next-app, required by shadcn/ui |
| typescript | 5.x | Type safety | Required by Next.js 16 (minimum 5.1.0) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest (CLI) | Component library (Sidebar, Button, Card, etc.) | All UI components — installed via CLI, not npm |
| lucide-react | latest | Icon library | Sidebar icons, status indicators — shadcn/ui default |
| class-variance-authority | latest | Component variant utility | Installed with shadcn/ui init |
| clsx + tailwind-merge | latest | Conditional class merging | Installed with shadcn/ui init (cn utility) |

### Backend (Cognee Container)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cognee | 0.5.5 | Knowledge graph engine | Core product requirement — FastAPI + graph pipeline |
| Python | 3.12 | Runtime | Cognee's official Dockerfile base |
| uv | latest | Python package manager | Used in Cognee's official build (faster than pip) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Next.js 16 | Next.js 15 | 15 is more battle-tested but 16 is stable since Oct 2025 and is the default for new projects. 16 has Turbopack default, proxy.ts, Cache Components. Recommend 16. |
| proxy.ts (Next.js 16) | middleware.ts | middleware.ts is deprecated in 16, will be removed. Use proxy.ts. |
| NetworkX | Neo4j / Kuzu | NetworkX is in-memory, fine for v1 (2 users). Neo4j/Kuzu needed only at scale. |
| Cognee built-in auth | No auth (REQUIRE_AUTHENTICATION=False) | For v1 internal tool, disable Cognee auth; frontend handles auth via Supabase. |

**Installation:**

```bash
# Frontend scaffolding
pnpm create next-app@latest . --yes

# Supabase packages
pnpm add @supabase/supabase-js @supabase/ssr

# shadcn/ui initialisation
pnpm dlx shadcn@latest init

# shadcn/ui components needed for Phase 1
pnpm dlx shadcn@latest add sidebar button card badge separator
```

## Architecture Patterns

### Recommended Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (providers, fonts)
│   │   ├── page.tsx                # Root redirect to /login or /dashboard
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login form (email/password)
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts    # Auth callback handler
│   │   └── (dashboard)/
│   │       ├── layout.tsx          # Dashboard layout (sidebar + main)
│   │       ├── page.tsx            # Dashboard home (welcome + health)
│   │       ├── ontology/
│   │       │   └── page.tsx        # Placeholder (greyed out in nav)
│   │       ├── dictionary/
│   │       │   └── page.tsx        # Placeholder
│   │       ├── rules/
│   │       │   └── page.tsx        # Placeholder
│   │       └── content/
│   │       │   └── page.tsx        # Placeholder
│   ├── components/
│   │   ├── ui/                     # shadcn/ui generated components
│   │   ├── app-sidebar.tsx         # Main sidebar component
│   │   └── health-indicator.tsx    # Cognee/Storage health status
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/         # Login form component
│   │   │   └── actions/            # Server actions for sign-in/sign-out
│   │   ├── ontology/               # Empty until Phase 2
│   │   ├── dictionary/             # Empty until Phase 3
│   │   ├── rules/                  # Empty until Phase 4
│   │   └── content/                # Empty until Phase 5
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts           # Browser client (createBrowserClient)
│       │   └── server.ts           # Server client (createServerClient)
│       └── constants.ts            # Navigation items, route definitions
├── proxy.ts                        # Next.js 16 proxy (was middleware.ts)
├── backend/
│   ├── Dockerfile                  # Cognee container definition
│   ├── .env.template               # Environment variable template
│   └── deploy.sh                   # Cloud Run deployment script
├── .env.local                      # Local frontend env vars (gitignored)
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
├── components.json                 # shadcn/ui configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # pnpm managed
```

### Pattern 1: Supabase Client Utilities

**What:** Separate browser and server Supabase client factories.
**When to use:** Every component that needs Supabase access.

```typescript
// src/lib/supabase/client.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
};
```

```typescript
// src/lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies — handled by proxy
          }
        },
      },
    }
  );
};
```

### Pattern 2: Proxy-Based Route Protection (Next.js 16)

**What:** Use `proxy.ts` (renamed from `middleware.ts` in Next.js 16) to refresh auth tokens and protect routes.
**When to use:** Every authenticated page load.

```typescript
// proxy.ts (project root or src/)
// Source: https://nextjs.org/blog/next-16 + https://supabase.com/docs/guides/auth/server-side/nextjs
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getClaims() not getSession() for server-side validation
  const { data: { claims } } = await supabase.auth.getClaims();

  // Redirect unauthenticated users away from protected routes
  if (!claims && !request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (claims && request.nextUrl.pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Pattern 3: Dashboard Layout with Sidebar

**What:** shadcn/ui SidebarProvider wrapping the dashboard route group.
**When to use:** All dashboard pages share this layout.

```typescript
// src/app/(dashboard)/layout.tsx
// Source: https://ui.shadcn.com/docs/components/radix/sidebar
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
```

### Pattern 4: Health Check Polling

**What:** Client-side polling to Cognee `/health` endpoint via a Next.js API route (avoids CORS).
**When to use:** Dashboard home page health indicator.

```typescript
// src/app/api/health/cognee/route.ts
import { NextResponse } from "next/server";

const COGNEE_URL = process.env.COGNEE_API_URL; // Server-only env var

export async function GET() {
  try {
    const res = await fetch(`${COGNEE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      return NextResponse.json({ status: "healthy" });
    }
    return NextResponse.json({ status: "degraded" }, { status: 502 });
  } catch {
    return NextResponse.json({ status: "unreachable" }, { status: 503 });
  }
}
```

### Anti-Patterns to Avoid

- **Using `getSession()` server-side:** Always use `getClaims()` or `getUser()`. `getSession()` reads from the cookie without revalidation and can be spoofed.
- **Using `middleware.ts` in Next.js 16:** Deprecated. Rename to `proxy.ts` and export default function `proxy`.
- **Exposing `COGNEE_API_URL` as `NEXT_PUBLIC_`:** The Cognee URL should be server-only. Proxy health checks through a Next.js API route.
- **Public sign-up form:** Decision is invite-only. Do not create a registration page. Users are created in Supabase dashboard.
- **Using `@supabase/auth-helpers-nextjs`:** Deprecated. Use `@supabase/ssr` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT handling | `@supabase/ssr` with cookie management | Token refresh, PKCE flow, cookie splitting handled automatically |
| Route protection | Custom auth HOC per page | `proxy.ts` with matcher config | Centralised, runs before render, handles token refresh |
| Collapsible sidebar | Custom sidebar component | shadcn/ui Sidebar | Responsive, keyboard shortcut (Cmd+B), mobile sheet, cookie-persisted state |
| CSS utility classes | Custom CSS framework | Tailwind CSS + shadcn/ui `cn()` | Consistent design tokens, tree-shaken output |
| Secrets in env vars | `.env` files on Cloud Run | GCP Secret Manager `--set-secrets` | Encrypted at rest, auditable, version-pinned |
| Container orchestration | docker-compose on Cloud Run | Single Dockerfile + Cloud Run service | Cloud Run manages scaling, health, TLS |
| Component variants | Conditional class strings | class-variance-authority (cva) | Type-safe variants, composable with shadcn/ui |

**Key insight:** For a 2-user internal tool, every minute spent building infrastructure that already exists is a minute not spent on product features. Use managed services and official libraries.

## Common Pitfalls

### Pitfall 1: getSession() Instead of getClaims() on the Server

**What goes wrong:** `getSession()` reads the JWT from the cookie without revalidation. A user who has been deactivated or whose session was revoked can still access protected resources.
**Why it happens:** Older Supabase tutorials and examples still reference `getSession()`.
**How to avoid:** Use `supabase.auth.getClaims()` in `proxy.ts` and server components. Use `supabase.auth.getUser()` only when you need the full user record (it makes a network call to Auth server every time).
**Warning signs:** Code using `session?.user` from `getSession()` for access control.

### Pitfall 2: middleware.ts vs proxy.ts in Next.js 16

**What goes wrong:** Code still using `middleware.ts` filename works but generates deprecation warnings and will break in future versions. The exported function name must also change from `middleware` to `proxy`.
**Why it happens:** Vast majority of existing tutorials, including Supabase's own docs, still reference `middleware.ts`.
**How to avoid:** Use `proxy.ts` at project root (or `src/proxy.ts`). Export `default function proxy(request)`. Same API otherwise.
**Warning signs:** Deprecation warnings in dev console about middleware.

### Pitfall 3: Cognee Embedding Provider Defaulting to OpenAI

**What goes wrong:** Setting `LLM_PROVIDER="anthropic"` only configures the reasoning LLM. Embeddings default to OpenAI (`text-embedding-3-large`), which requires a separate `OPENAI_API_KEY` or explicitly configured alternative.
**Why it happens:** Cognee's configuration has separate LLM and embedding provider settings.
**How to avoid:** Either provide `EMBEDDING_PROVIDER` and `EMBEDDING_API_KEY` explicitly, or ensure a valid OpenAI key is available for embeddings. For v1, using OpenAI embeddings with Anthropic for reasoning is a valid and common pattern.
**Warning signs:** Cognee container failing to start with "Invalid API key" errors when only Anthropic key is provided.

### Pitfall 4: Cloud Run Port Mismatch

**What goes wrong:** Cloud Run expects the container to listen on the port specified by the `PORT` environment variable (defaults to 8080). Cognee's FastAPI defaults to port 8000.
**Why it happens:** Cloud Run injects `PORT=8080` by default; if the app ignores this, health checks fail and the service never becomes ready.
**How to avoid:** In the Cognee entrypoint or Dockerfile CMD, read the `PORT` environment variable: `uvicorn cognee.api.client:app --host 0.0.0.0 --port ${PORT:-8000}`.
**Warning signs:** Cloud Run deployment succeeds but service never passes readiness check.

### Pitfall 5: Supabase Storage RLS Blocking All Uploads

**What goes wrong:** Private buckets with RLS enabled (default) block all operations until explicit policies are created on `storage.objects`.
**Why it happens:** Supabase Storage has RLS enabled by default with no permissive policies.
**How to avoid:** Create RLS policies granting `INSERT` (upload), `SELECT` (download), and `DELETE` for authenticated users on the target bucket path.
**Warning signs:** 403 errors when uploading files despite being authenticated.

### Pitfall 6: Parallel Routes Require default.js in Next.js 16

**What goes wrong:** Next.js 16 enforces that all parallel route slots have explicit `default.js` files. Builds fail without them.
**Why it happens:** New breaking change in Next.js 16 — previously optional.
**How to avoid:** Phase 1 does not use parallel routes, but be aware for future phases. If needed, create `default.js` files that call `notFound()` or return `null`.
**Warning signs:** Build failures mentioning missing `default.js` in parallel route slots.

## Code Examples

### Email/Password Sign-In (Server Action)

```typescript
// src/features/auth/actions/login.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

### Sidebar Navigation Configuration

```typescript
// src/lib/constants.ts
import {
  LayoutDashboard,
  Network,
  BookOpen,
  Scale,
  FileUp,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    title: "Ontology",
    url: "/ontology",
    icon: Network,
    enabled: false, // Phase 2
  },
  {
    title: "Dictionary",
    url: "/dictionary",
    icon: BookOpen,
    enabled: false, // Phase 3
  },
  {
    title: "Rules",
    url: "/rules",
    icon: Scale,
    enabled: false, // Phase 4
  },
  {
    title: "Content",
    url: "/content",
    icon: FileUp,
    enabled: false, // Phase 5
  },
] as const;
```

### Cognee Dockerfile for Cloud Run

```dockerfile
# backend/Dockerfile
# Derived from: https://github.com/topoteretes/cognee/blob/main/Dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev git curl && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

COPY . .

FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

# Cloud Run injects PORT; default to 8000 for local dev
CMD ["sh", "-c", "uvicorn cognee.api.client:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Cloud Run Deployment Script

```bash
#!/usr/bin/env bash
# backend/deploy.sh
set -euo pipefail

PROJECT_ID="forge-dc-mcp-server"
REGION="europe-west1"
SERVICE_NAME="databridgeai-cognee"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Build and push
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}" ./backend

# Deploy with secrets from Secret Manager
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --set-secrets "LLM_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-secrets "EMBEDDING_API_KEY=OPENAI_API_KEY:latest" \
  --set-env-vars "LLM_PROVIDER=anthropic,LLM_MODEL=claude-sonnet-4-20250514,GRAPH_DATABASE_PROVIDER=networkx,EMBEDDING_PROVIDER=openai,EMBEDDING_MODEL=openai/text-embedding-3-large,REQUIRE_AUTHENTICATION=false,LOG_LEVEL=INFO" \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 2 \
  --allow-unauthenticated
```

### Supabase Storage Bucket Setup

```sql
-- Run in Supabase SQL Editor
-- Create bucket for OWL files and content
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- RLS policy: authenticated users can upload
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'documents');

-- RLS policy: authenticated users can read
create policy "Authenticated users can read"
on storage.objects for select
to authenticated
using (bucket_id = 'documents');

-- RLS policy: authenticated users can delete their uploads
create policy "Authenticated users can delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'documents');
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | Rename file and export. `middleware.ts` deprecated, will be removed. |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | Unified SSR package for all frameworks. auth-helpers no longer maintained. |
| `getSession()` server-side | `getClaims()` server-side | @supabase/ssr recent | `getClaims()` validates JWT locally via JWKS. Faster and more secure than `getSession()`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase recent | Renamed env var. Vercel integration now syncs as `PUBLISHABLE_KEY`. |
| Webpack | Turbopack | Next.js 16 (default) | 2-5x faster builds, 10x faster Fast Refresh. No config needed. |
| `experimental.ppr` | `cacheComponents: true` | Next.js 16 | PPR flag removed, replaced by Cache Components model. Not needed for Phase 1. |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not use. Replaced by `@supabase/ssr`.
- `middleware.ts` in Next.js 16: Deprecated. Use `proxy.ts`.
- `getSession()` for auth checks: Use `getClaims()` or `getUser()`.
- `next lint` CLI: Removed in Next.js 16. Use ESLint directly.

## Open Questions

1. **Cognee entrypoint.sh vs custom CMD**
   - What we know: The official Cognee Dockerfile uses `entrypoint.sh` which has had reported issues (GitHub issue #2274 — "no such file or directory"). The custom Dockerfile should use a direct CMD instead.
   - What's unclear: Whether the entrypoint.sh performs essential initialisation (migrations, etc.) that must be replicated.
   - Recommendation: Use direct `uvicorn` CMD for v1. If database migrations are needed, add a migration step to the deployment script or use Cognee's `--no-migration` flag.

2. **Embedding provider for Cognee**
   - What we know: Cognee defaults to OpenAI for embeddings even when LLM is set to Anthropic. Anthropic does not provide embedding models.
   - What's unclear: Whether the GCP project already has an OpenAI API key, or whether an alternative embedding provider (e.g., Fastembed for local embeddings) would be preferable.
   - Recommendation: Use OpenAI `text-embedding-3-large` for embeddings (industry standard, high quality). Store `OPENAI_API_KEY` in GCP Secret Manager alongside `ANTHROPIC_API_KEY`.

3. **Supabase environment variable naming**
   - What we know: Supabase recently renamed `SUPABASE_ANON_KEY` to `SUPABASE_PUBLISHABLE_KEY`. The Vercel integration may sync under either name depending on when it was set up.
   - What's unclear: Which name the existing Supabase project uses.
   - Recommendation: Check the Vercel integration dashboard after connecting. Use whichever name Supabase provides, and ensure the code references the correct env var.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (E2E) + Vitest (unit) |
| Config file | None — Wave 0 creates configs |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run && pnpm playwright test` |

### Phase Requirements to Test Map

| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Supabase Auth + Storage configured | smoke (manual) | Verify via Supabase dashboard + `supabase projects list` | N/A — manual verification |
| INFRA-02 | Next.js deployed on Vercel | smoke (E2E) | `pnpm playwright test tests/e2e/deployment.spec.ts` | Wave 0 |
| INFRA-03 | Cognee health endpoint responds | smoke (integration) | `pnpm vitest run tests/integration/cognee-health.test.ts` | Wave 0 |
| INFRA-04 | NetworkX graph store configured | unit | `pnpm vitest run tests/unit/cognee-config.test.ts` | Wave 0 |
| INFRA-05 | Storage bucket accessible | integration | `pnpm vitest run tests/integration/storage.test.ts` | Wave 0 |
| INFRA-06 | Auth flow (login, redirect, protect) | E2E | `pnpm playwright test tests/e2e/auth.spec.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run && pnpm playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `playwright.config.ts` — Playwright configuration
- [ ] `tests/e2e/auth.spec.ts` — Auth flow E2E test
- [ ] `tests/e2e/deployment.spec.ts` — Deployment smoke test
- [ ] `tests/integration/cognee-health.test.ts` — Cognee health check test
- [ ] `tests/integration/storage.test.ts` — Storage bucket access test
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react playwright @playwright/test`

## Sources

### Primary (HIGH confidence)
- [Next.js 16 blog post](https://nextjs.org/blog/next-16) — proxy.ts rename, Turbopack default, React 19.2, breaking changes
- [Supabase SSR Creating a Client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — createBrowserClient, createServerClient, cookie patterns
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — proxy.ts auth pattern, getClaims() usage
- [Cognee .env.template](https://github.com/topoteretes/cognee/blob/main/.env.template) — All environment variables
- [Cognee LLM Providers docs](https://docs.cognee.ai/setup-configuration/llm-providers) — Anthropic config (LLM_PROVIDER="anthropic")
- [Cognee Graph Stores docs](https://docs.cognee.ai/setup-configuration/graph-stores) — NetworkX config (GRAPH_DATABASE_PROVIDER="networkx")
- [Cognee Health Check API](https://docs.cognee.ai/api-reference/health/health-check) — GET /health endpoint
- [shadcn/ui Sidebar docs](https://ui.shadcn.com/docs/components/radix/sidebar) — SidebarProvider, SidebarMenu, collapsible, install command
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) — RLS on storage.objects
- [Cloud Run Secret Manager](https://docs.cloud.google.com/run/docs/configuring/services/secrets) — --set-secrets deployment pattern

### Secondary (MEDIUM confidence)
- [Cognee Dockerfile](https://github.com/topoteretes/cognee/blob/main/Dockerfile) — Python 3.12, uv, multi-stage build
- [Cognee docker-compose.yml](https://github.com/topoteretes/cognee/blob/main/docker-compose.yml) — Port 8000, environment variables
- [Vercel Supabase Integration](https://supabase.com/docs/guides/integrations/vercel-marketplace) — Auto env var sync
- [Cognee Deploy REST API Server](https://docs.cognee.ai/guides/deploy-rest-api-server) — Docker compose setup

### Tertiary (LOW confidence)
- [Cognee entrypoint.sh issues](https://github.com/topoteretes/cognee/issues/2274) — Known Docker startup issue, may need workaround
- Cognee v0.5.5 stability on Cloud Run — Not verified in production; scale-to-zero + cold start behaviour untested

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries are current stable versions from official sources
- Architecture: HIGH — Patterns directly from official Supabase and Next.js documentation
- Pitfalls: HIGH — Verified against official docs and GitHub issues
- Cognee deployment: MEDIUM — Dockerfile pattern verified but Cloud Run-specific behaviour (port mapping, cold start, entrypoint) needs implementation-time validation
- Validation architecture: MEDIUM — Test framework recommendation is standard but no existing test infrastructure to verify against

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days — stable ecosystem, no expected breaking changes)
