# Phase 1: Infrastructure - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy Vercel (Next.js frontend) + Supabase (Auth, Postgres, Storage) + Cloud Run (Cognee FastAPI) so that users can log in via email/password and reach a protected dashboard shell with all backend services running. No feature UIs — just the authenticated shell and healthy services.

</domain>

<decisions>
## Implementation Decisions

### Auth experience
- Email/password login via Supabase Auth — no magic links, no social login
- Invite-only access — no public sign-up form. Admin creates users in Supabase dashboard
- Long-lived sessions (Supabase defaults) — minimise re-login friction for daily-use internal tool
- Login page design at Claude's discretion (centred card or split layout — whichever fits shadcn/ui defaults best)

### Dashboard shell
- Collapsible left sidebar navigation with icons + labels
- All 5 planned sections visible in sidebar: Dashboard, Ontology, Dictionary, Rules, Content
- Unbuilt sections (Ontology, Dictionary, Rules, Content) shown as greyed-out/disabled — not clickable until phases ship
- Dashboard home page shows: welcome card with user greeting + system health status (Cognee connection, Storage availability)
- Light theme only for v1 — no dark mode toggle. shadcn/ui dark mode can be added later

### Cognee configuration
- Anthropic Claude as the LLM provider for Cognee entity extraction (ANTHROPIC_API_KEY)
- Cloud Run scale-to-zero (default) — accept cold start latency for internal v1 with 2 users
- Visible health indicator on dashboard — small status dot (green/amber/red) showing Cognee connection status
- All secrets (API keys, Supabase credentials) managed via GCP Secret Manager, referenced by Cloud Run at runtime

### Project scaffolding
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
- Next.js middleware implementation for route protection
- Supabase client setup patterns (server vs client components)
- ESLint/Prettier/TypeScript configuration defaults

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs or ADRs exist for this project — requirements are fully captured in the decisions above and in the following planning documents:

### Project definition
- `.planning/PROJECT.md` — Product vision, tech stack constraints, key decisions, Cognee context
- `.planning/REQUIREMENTS.md` — INFRA-01 through INFRA-06 requirement definitions
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and requirement mapping

### Infrastructure context
- `CLAUDE.md` (project root) — Supabase project details (org: `uwyhxwvvzcqywaakvgke`, project: `vkdcliaocklnlbthwdpx`), GitHub repo, credential verification commands

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. `src/` and `docs/` directories exist but are empty.

### Established Patterns
- None — Phase 1 establishes all patterns. Decisions above define the conventions future phases inherit.

### Integration Points
- Supabase project already provisioned (`vkdcliaocklnlbthwdpx`) — Auth, Postgres, and Storage ready to configure
- GitHub repo exists at `ForgeDC/databridgeai` — deployment target for Vercel
- GCP project `forge-dc-mcp-server` — Cloud Run deployment target for Cognee

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User consistently chose recommended defaults, indicating preference for proven patterns over novel approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-infrastructure*
*Context gathered: 2026-03-18*
