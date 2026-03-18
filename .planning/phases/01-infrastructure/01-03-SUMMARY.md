---
phase: 01-infrastructure
plan: 03
subsystem: ui
tags: [nextjs, shadcn-ui, sidebar, health-polling, supabase-storage, dashboard]

# Dependency graph
requires:
  - phase: 01-infrastructure plan 01
    provides: Next.js scaffold, Supabase auth, NAV_ITEMS constants, shadcn/ui components, proxy.ts route protection
  - phase: 01-infrastructure plan 02
    provides: Cognee backend on Cloud Run with /health endpoint
provides:
  - Dashboard shell with collapsible sidebar (5 nav items, 4 disabled with tooltips)
  - Welcome card with user greeting from Supabase auth metadata
  - System status card with Cognee and Storage health indicators polling every 30s
  - Server-side health API proxy routes (/api/health/cognee, /api/health/storage)
  - HealthIndicator reusable component with green/amber/red status dots
  - Supabase Storage 'documents' bucket with RLS policies for authenticated users
  - Placeholder pages for Ontology, Dictionary, Rules, and Content routes
affects:
  - Phase 2 (Ontology page replaces placeholder, sidebar nav item enabled)
  - Phase 3 (Dictionary page replaces placeholder, sidebar nav item enabled)
  - Phase 4 (Rules page replaces placeholder, sidebar nav item enabled)
  - Phase 5 (Content page replaces placeholder, sidebar nav item enabled; uses Storage bucket)

# Tech tracking
tech-stack:
  added:
    - "shadcn/ui sidebar, badge, separator, tooltip components"
  patterns:
    - "Server-side health proxy: API routes proxy external service calls to avoid CORS and keep secrets server-only"
    - "Client-side polling: useEffect + setInterval with cleanup for periodic data refresh"
    - "Dashboard route group: (dashboard) folder with shared layout, SidebarProvider, and server-side auth guard"
    - "Disabled nav items: opacity-50, pointer-events-none, aria-disabled with tooltip explanation"

key-files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/app/(dashboard)/dashboard-content.tsx
    - src/app/(dashboard)/ontology/page.tsx
    - src/app/(dashboard)/dictionary/page.tsx
    - src/app/(dashboard)/rules/page.tsx
    - src/app/(dashboard)/content/page.tsx
    - src/app/api/health/cognee/route.ts
    - src/app/api/health/storage/route.ts
    - src/components/app-sidebar.tsx
    - src/components/health-indicator.tsx
    - src/components/ui/sidebar.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/separator.tsx
    - src/components/ui/tooltip.tsx
    - tests/unit/health-indicator.test.ts
  modified:
    - middleware.ts (renamed from proxy.ts for Next.js compatibility)
    - src/app/page.tsx (removed duplicate — dashboard root page now at (dashboard)/page.tsx)

key-decisions:
  - "Server-side health proxy pattern: /api/health/* routes proxy to Cognee and Supabase Storage server-side, keeping COGNEE_API_URL out of client bundles and avoiding CORS"
  - "Disabled nav items use opacity-50 + pointer-events-none + aria-disabled with tooltip hint rather than hidden — users see the full product scope"
  - "DashboardContent split into separate client component to keep page.tsx as server component for user data fetching"
  - "proxy.ts renamed to middleware.ts for Next.js file convention compatibility"

patterns-established:
  - "Health monitoring: HealthIndicator component with 4 states (healthy/degraded/unreachable/loading) and colour-coded dots"
  - "Dashboard layout: SidebarProvider wrapping AppSidebar + main content area with SidebarTrigger"
  - "Feature placeholder pages: simple centred 'coming soon' message, ready to be replaced by feature implementations"
  - "Sign-out: sidebar footer with signOut server action import"

requirements-completed: [INFRA-01, INFRA-05, INFRA-06]

# Metrics
duration: ~45min (across two agent sessions with human-verify checkpoint)
completed: 2026-03-18
---

# Phase 01 Plan 03: Dashboard Shell and Health Status Summary

**Dashboard shell with collapsible shadcn/ui sidebar (5 nav items, 4 disabled with tooltips), welcome card with user greeting, Cognee and Storage health status polling via server-side proxy routes, and Supabase Storage 'documents' bucket with RLS policies.**

## Performance

- **Duration:** ~45 min (across two agent sessions with human-verify checkpoint)
- **Started:** 2026-03-18T21:00:00Z (estimated)
- **Completed:** 2026-03-18T21:40:32Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 18

## Accomplishments

- Dashboard shell with collapsible sidebar containing 5 navigation items (Dashboard active, Ontology/Dictionary/Rules/Content greyed out with tooltips)
- Welcome card with personalised user greeting from Supabase auth metadata and "DataBridge AI -- Content Intelligence Platform" branding
- System Status card with real-time health indicators for Cognee (green/amber/red) and Storage (green/red), polling every 30 seconds
- Server-side health API routes proxying Cognee /health and Supabase Storage availability checks, keeping secrets server-only
- Supabase Storage 'documents' bucket configured with RLS policies for authenticated user INSERT/SELECT/DELETE
- Full Phase 1 end-to-end experience verified: login, route protection, dashboard access, sidebar navigation, health monitoring, sign-out

## Task Commits

Each task was committed atomically:

1. **Task 1: Dashboard layout with collapsible sidebar and placeholder pages** - `35d8eb7` (feat), `dbefa7e` (fix: TooltipTrigger base-ui compatibility)
2. **Task 2: Dashboard home page with welcome card, health status polling, and health API routes** - `c995e8f` (feat), `2c5466d` (fix: rename proxy.ts to middleware.ts, remove duplicate root page)
3. **Task 3: Verify complete auth flow and dashboard experience** - Human-verify checkpoint (no code commit -- user approved full end-to-end verification)

## Files Created/Modified

- `src/app/(dashboard)/layout.tsx` -- Dashboard layout with SidebarProvider, AppSidebar, SidebarTrigger, and server-side auth guard via getUser()
- `src/app/(dashboard)/page.tsx` -- Dashboard home server component fetching user data, rendering DashboardContent client component
- `src/app/(dashboard)/dashboard-content.tsx` -- Client component with welcome card, health status card, and 30-second polling logic
- `src/app/(dashboard)/ontology/page.tsx` -- Placeholder: "Ontology management -- coming soon"
- `src/app/(dashboard)/dictionary/page.tsx` -- Placeholder: "Dictionary management -- coming soon"
- `src/app/(dashboard)/rules/page.tsx` -- Placeholder: "Rules management -- coming soon"
- `src/app/(dashboard)/content/page.tsx` -- Placeholder: "Content management -- coming soon"
- `src/app/api/health/cognee/route.ts` -- Server-side proxy to Cognee /health with 5s timeout, returns healthy/degraded/unreachable
- `src/app/api/health/storage/route.ts` -- Supabase Storage availability check against 'documents' bucket
- `src/components/app-sidebar.tsx` -- Collapsible sidebar with NAV_ITEMS, disabled item tooltips, SidebarRail, sign-out footer
- `src/components/health-indicator.tsx` -- Reusable status dot component (green/amber/red/grey) with aria-label accessibility
- `src/components/ui/sidebar.tsx` -- shadcn/ui sidebar component suite (SidebarProvider, SidebarMenu, SidebarRail, etc.)
- `src/components/ui/badge.tsx` -- shadcn/ui badge component
- `src/components/ui/separator.tsx` -- shadcn/ui separator component
- `src/components/ui/tooltip.tsx` -- shadcn/ui tooltip component
- `tests/unit/health-indicator.test.ts` -- Unit tests for health status label mapping (all states covered)
- `middleware.ts` -- Renamed from proxy.ts for Next.js file convention compatibility

## Decisions Made

- **Server-side health proxy pattern:** API routes at /api/health/* proxy external service calls. This avoids CORS issues and keeps COGNEE_API_URL server-only (not exposed via NEXT_PUBLIC_ prefix).
- **Disabled nav items visible but inert:** Items show at 50% opacity with pointer-events-none and aria-disabled, plus a tooltip explaining "available in a future update". Users see the full product scope rather than a sparse sidebar.
- **DashboardContent as separate client component:** The dashboard page remains a server component for user data fetching, delegating interactive polling logic to a client component.
- **proxy.ts renamed to middleware.ts:** The Supabase auth proxy file was renamed to follow Next.js file conventions, which expect middleware.ts at the project root.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed asChild from TooltipTrigger for base-ui compatibility**
- **Found during:** Task 1 (sidebar implementation)
- **Issue:** shadcn/ui v2 TooltipTrigger with base-ui does not support the `asChild` prop, causing build errors
- **Fix:** Removed `asChild` prop from TooltipTrigger components in app-sidebar.tsx
- **Files modified:** src/components/app-sidebar.tsx
- **Verification:** pnpm build passed
- **Committed in:** `dbefa7e`

**2. [Rule 1 - Bug] Renamed proxy.ts to middleware.ts and removed duplicate root page**
- **Found during:** Task 2 (dashboard home page)
- **Issue:** Next.js requires the auth middleware file to be named middleware.ts (not proxy.ts). Additionally, both src/app/page.tsx and src/app/(dashboard)/page.tsx competed for the root route.
- **Fix:** Renamed proxy.ts to middleware.ts; removed the duplicate src/app/page.tsx since the (dashboard) route group now handles the root.
- **Files modified:** middleware.ts (renamed), src/app/page.tsx (removed)
- **Verification:** pnpm build passed, routing works correctly
- **Committed in:** `2c5466d`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary for correct operation. No scope creep.

## Issues Encountered

None beyond the auto-fixed items documented above.

## User Setup Required

**Supabase Storage bucket** (presented at checkpoint, user confirmed):

The following SQL was presented to the user for execution in the Supabase SQL Editor to create the 'documents' storage bucket with RLS policies:

```sql
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
create policy "Authenticated users can upload" on storage.objects for insert to authenticated with check (bucket_id = 'documents');
create policy "Authenticated users can read" on storage.objects for select to authenticated using (bucket_id = 'documents');
create policy "Authenticated users can delete" on storage.objects for delete to authenticated using (bucket_id = 'documents');
```

## Next Phase Readiness

- **Phase 1 complete:** All 3 plans executed -- frontend scaffold, Cognee backend deployment, and dashboard shell with health monitoring
- **Phase 2 (Ontology):** Ready to build -- ontology/page.tsx placeholder exists, sidebar nav item ready to be enabled, Supabase + Cognee infrastructure in place
- **Phase 3 (Dictionary):** Ready to build -- dictionary/page.tsx placeholder exists
- **Phase 4 (Rules):** Ready to build -- rules/page.tsx placeholder exists
- **Phase 5 (Content):** Ready to build -- content/page.tsx placeholder exists, Storage bucket configured

---
*Phase: 01-infrastructure*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: All 18 key files verified on disk
- FOUND: 35d8eb7 (Task 1 commit -- sidebar and layout)
- FOUND: dbefa7e (Task 1 fix -- TooltipTrigger compatibility)
- FOUND: c995e8f (Task 2 commit -- health polling and API routes)
- FOUND: 2c5466d (Task 2 fix -- middleware rename, duplicate page removal)
- Task 3: Human-verify checkpoint -- no code commit, user approved full end-to-end verification
