---
phase: 01-infrastructure
plan: 01
subsystem: infra
tags: [nextjs, supabase, shadcn-ui, vercel, typescript, pnpm, vitest]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with pnpm and TypeScript
  - Browser and server Supabase client factories via @supabase/ssr
  - proxy.ts route protection using getClaims() (not deprecated getSession)
  - Login page with email/password form and shadcn/ui components
  - signIn/signOut server actions using signInWithPassword
  - NAV_ITEMS constants defining 5 sidebar navigation entries
  - Vercel deployment with Supabase Marketplace credential sync
  - Unit test infrastructure (Vitest) with passing tests
affects:
  - 01-02 (Cognee backend connects to same Supabase project)
  - 01-03 (Dashboard shell builds on this scaffold, auth flow, and NAV_ITEMS)
  - All subsequent phases (depend on this auth foundation)

# Tech tracking
tech-stack:
  added:
    - Next.js 16.2.0 with App Router and Turbopack
    - pnpm package manager
    - TypeScript 5
    - Tailwind CSS 4
    - "@supabase/supabase-js and @supabase/ssr"
    - shadcn/ui (button, card, input, label components)
    - Vitest + @vitejs/plugin-react for unit tests
    - Playwright for e2e tests (installed, not yet used)
    - Vercel (hosting with Supabase Marketplace integration)
  patterns:
    - Browser client: createBrowserClient from @supabase/ssr
    - Server client: createServerClient from @supabase/ssr with cookie adapter
    - Route protection: proxy.ts (not middleware.ts) using getClaims()
    - Auth actions: "use server" with formData, returning error object or redirect
    - Login form: useActionState (React 19) for pending state and error handling
    - shadcn/ui import path: "@/components/ui/*"

key-files:
  created:
    - proxy.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/constants.ts
    - src/features/auth/actions/login.ts
    - src/app/(auth)/login/page.tsx
    - src/app/auth/callback/route.ts
    - vitest.config.ts
    - .env.example
    - tests/unit/constants.test.ts
    - src/components/ui/button.tsx
    - src/components/ui/card.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
  modified:
    - package.json
    - src/app/layout.tsx
    - src/app/page.tsx
    - .gitignore

key-decisions:
  - "Vercel deployment connected to ForgeDC/databridgeai GitHub repo via Supabase Marketplace integration — credentials auto-synced (no manual env var management)"
  - "proxy.ts filename used instead of middleware.ts — follows current Supabase @supabase/ssr conventions"
  - "getClaims() used instead of deprecated getSession() — server-side auth validation without network round-trip"
  - "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY used instead of NEXT_PUBLIC_SUPABASE_ANON_KEY — new Supabase publishable key convention"
  - "No sign-up form — invite-only application, user accounts managed via Supabase dashboard"

patterns-established:
  - "Supabase server client: always async, always creates new instance per request using cookies()"
  - "Route protection: proxy.ts intercepts all non-static routes, redirects unauthenticated to /login and authenticated away from /login"
  - "Auth actions: use 'use server', accept FormData, return {error: string} on failure or redirect() on success"
  - "Login page: client component using useActionState, shadcn/ui Card/Button/Input/Label, full-viewport centred layout"

requirements-completed: [INFRA-01, INFRA-02, INFRA-06]

# Metrics
duration: ~90min (including human checkpoint for Vercel deployment)
completed: 2026-03-18
---

# Phase 01 Plan 01: Frontend Scaffold and Auth Summary

**Next.js 16 app with Supabase Auth via @supabase/ssr, proxy.ts route protection using getClaims(), shadcn/ui login page, and live Vercel deployment at forgedcdatabridgeai.vercel.app with Supabase Marketplace credential sync.**

## Performance

- **Duration:** ~90 min (includes human checkpoint for Vercel deployment setup)
- **Started:** 2026-03-18T18:00:00Z (estimated)
- **Completed:** 2026-03-18T19:34:05Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 18

## Accomplishments

- Next.js 16 project scaffolded with pnpm, TypeScript 5, Tailwind CSS 4, and shadcn/ui components (button, card, input, label)
- Supabase auth implemented with browser client, server client (cookie-based), proxy.ts route protection using getClaims(), and signIn/signOut server actions
- Login page built with centred card layout per UI-SPEC, useActionState for React 19 form handling, and inline error messaging
- Vercel deployment live at `forgedcdatabridgeai.vercel.app` with Supabase Marketplace integration auto-syncing credentials
- Unit tests for NAV_ITEMS constants passing; Playwright e2e infrastructure installed

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project, install dependencies, initialise shadcn/ui, and configure test infrastructure** - `bd79770` (feat)
2. **Task 2: Implement Supabase client utilities, proxy-based route protection, auth server actions, and login page** - `8a86b87` (feat)
3. **Task 3: Deploy to Vercel with Supabase Marketplace integration and verify live URL** - Human-verify checkpoint (no code commit — deployment performed via Vercel dashboard)

## Files Created/Modified

- `proxy.ts` — Route protection: getClaims() auth check, redirects unauthenticated to /login and authenticated away from /login
- `src/lib/supabase/client.ts` — Browser Supabase client factory using createBrowserClient
- `src/lib/supabase/server.ts` — Server Supabase client factory using createServerClient with cookie adapter
- `src/lib/constants.ts` — NAV_ITEMS: 5 navigation entries (Dashboard enabled, Ontology/Dictionary/Rules/Content disabled)
- `src/features/auth/actions/login.ts` — signIn and signOut server actions using signInWithPassword
- `src/app/(auth)/login/page.tsx` — Login form with shadcn/ui components, useActionState, error handling
- `src/app/auth/callback/route.ts` — Auth callback handler for code-exchange flows
- `tests/unit/constants.test.ts` — Unit tests for NAV_ITEMS (length, enabled count, property shape)
- `vitest.config.ts` — Vitest configuration with jsdom environment and @ path alias
- `.env.example` — Committed env template (Supabase URL, publishable key, Cognee API URL)
- `src/app/layout.tsx` — Root layout with Geist Sans, light theme, DataBridge AI metadata
- `src/components/ui/button.tsx, card.tsx, input.tsx, label.tsx` — shadcn/ui components

## Decisions Made

- **Vercel + Supabase Marketplace integration:** Credentials auto-synced rather than manually managed in Vercel dashboard. Reduces ops burden and keeps secrets out of git.
- **proxy.ts over middleware.ts:** Follows current Supabase @supabase/ssr documentation conventions. The `proxy.ts` filename with explicit export is preferred.
- **getClaims() over getSession():** Server-side auth check without a network round-trip to Supabase — reads JWT claims directly from the cookie. Faster and recommended by Supabase.
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:** Uses the new publishable key convention rather than the legacy anon key name.
- **Invite-only (no sign-up form):** User accounts managed via Supabase dashboard. No public registration flow.

## Deviations from Plan

None — plan executed exactly as written. The checkpoint for Vercel deployment was handled correctly: automation completed Tasks 1-2 autonomously, then paused for human verification per checkpoint protocol, and the user confirmed deployment success.

## Issues Encountered

None beyond expected checkpoint pause for Vercel dashboard setup.

## User Setup Required

Vercel deployment was the checkpoint action in this plan — now complete. Production URL: `https://forgedcdatabridgeai.vercel.app`

Environment variables auto-synced via Supabase Marketplace integration:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://vkdcliaocklnlbthwdpx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = synced from Supabase dashboard

## Next Phase Readiness

- Auth foundation is complete — login page live, route protection active, Supabase credentials synced
- Plan 01-02 (Cognee backend) is independent of this — can proceed in parallel or sequentially
- Plan 01-03 (dashboard shell + sidebar) builds directly on this scaffold — NAV_ITEMS constants are ready, shadcn/ui components are installed

---
*Phase: 01-infrastructure*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: .planning/phases/01-infrastructure/01-01-SUMMARY.md
- FOUND: proxy.ts
- FOUND: src/lib/supabase/client.ts
- FOUND: src/app/(auth)/login/page.tsx
- FOUND: bd79770 (Task 1 commit — scaffold)
- FOUND: 8a86b87 (Task 2 commit — auth implementation)
- Task 3: Human-verify checkpoint — no code commit, deployment confirmed by user
