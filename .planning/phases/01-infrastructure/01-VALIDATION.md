---
phase: 1
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
wave_0_deferred: true
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + Playwright (E2E) |
| **Config file** | vitest.config.ts (created in Plan 01-01 Task 1); playwright.config.ts (deferred — see Wave 0 section) |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run && pnpm playwright test` |
| **Estimated runtime** | ~30 seconds (Vitest) + ~60 seconds (Playwright) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run && pnpm playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | config | `pnpm build && pnpm vitest run` | Yes (vitest.config.ts in Plan 01-01) | pending |
| 01-01-02 | 01 | 1 | INFRA-06 | unit | `pnpm vitest run --reporter=verbose` | Yes (constants.test.ts in Plan 01-01) | pending |
| 01-01-03 | 01 | 1 | INFRA-02 | manual | Verify Vercel deployment URL serves login page | N/A — checkpoint:human-verify | pending |
| 01-02-01 | 02 | 1 | INFRA-03 | config | `test -f backend/Dockerfile && test -f backend/pyproject.toml` | Yes (files created in Plan 01-02) | pending |
| 01-02-02 | 02 | 1 | INFRA-03 | config | `test -x backend/deploy.sh && grep -q europe-west1 backend/deploy.sh` | Yes (deploy.sh in Plan 01-02) | pending |
| 01-02-03 | 02 | 1 | INFRA-03 | manual | Verify Cloud Run /health endpoint | N/A — checkpoint:human-verify | pending |
| 01-03-01 | 03 | 2 | INFRA-01, INFRA-05 | unit | `pnpm vitest run --reporter=verbose` | Yes (health-indicator.test.ts in Plan 01-03) | pending |
| 01-03-02 | 03 | 2 | INFRA-05, INFRA-06 | manual | Verify full auth flow and dashboard | N/A — checkpoint:human-verify | pending |

*Status: pending -- green -- red -- flaky*

---

## Wave 0 Requirements — Deferred

**Decision:** Wave 0 test stubs (E2E and integration) are **explicitly deferred** to post-Phase 1. The rationale:

1. **Plans create tests alongside implementation.** Plan 01-01 creates `vitest.config.ts` and `tests/unit/constants.test.ts`. Plan 01-03 creates `tests/unit/health-indicator.test.ts`. These provide automated feedback during execution.

2. **E2E and integration tests require deployed services.** Tests for INFRA-02 (Vercel deployment), INFRA-03 (Cloud Run health), and INFRA-05 (Storage bucket) depend on infrastructure that only exists after Phase 1 execution. Writing stubs before deployment creates dead code.

3. **Checkpoints cover deployment verification.** Plan 01-01 Task 3 (Vercel deployment), Plan 01-02 Task 3 (Cloud Run deployment), and Plan 01-03 Task 3 (full integration) provide human-verified coverage for requirements that cannot be automated until services are live.

**Deferred files (to be created in a gap closure plan or Phase 2 setup):**

- [ ] `playwright.config.ts` — Playwright configuration for E2E
- [ ] `tests/e2e/auth.spec.ts` — Auth flow E2E test (covers INFRA-06)
- [ ] `tests/e2e/deployment.spec.ts` — Deployment smoke test (covers INFRA-02)
- [ ] `tests/integration/cognee-health.test.ts` — Cognee health check (covers INFRA-03)
- [ ] `tests/integration/storage.test.ts` — Storage bucket access (covers INFRA-05)
- [ ] `tests/unit/cognee-config.test.ts` — Cognee config unit test (covers INFRA-04)

**Framework install:** Playwright is installed in Plan 01-01 Task 1 (`pnpm add -D playwright @playwright/test`). Only `playwright.config.ts` and test files are deferred.

---

## Tests Created by Plans

| Plan | Test File | Covers |
|------|-----------|--------|
| 01-01 | `tests/unit/constants.test.ts` | NAV_ITEMS structure (INFRA-01 — app configuration) |
| 01-03 | `tests/unit/health-indicator.test.ts` | Health status label mapping (INFRA-05 — storage health) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Checkpoint |
|----------|-------------|------------|------------|
| Supabase project configured | INFRA-01 | External SaaS setup | Plan 01-03 Task 3 |
| Vercel deployment live | INFRA-02 | External deployment platform | Plan 01-01 Task 3 |
| Cloud Run service healthy | INFRA-03 | External infrastructure | Plan 01-02 Task 3 |
| Storage bucket RLS policies | INFRA-05 | Supabase SQL execution | Plan 01-03 Task 3 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or checkpoint coverage
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 explicitly deferred with documented gap (wave_0_deferred: true)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter (blocked by Wave 0 deferral)

**Approval:** pending (Wave 0 deferred — automated E2E/integration coverage to be added post-Phase 1)
