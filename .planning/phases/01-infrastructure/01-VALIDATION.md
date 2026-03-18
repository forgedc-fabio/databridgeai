---
phase: 1
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit/integration) + Playwright (E2E) |
| **Config file** | None — Wave 0 installs and creates configs |
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
| 01-01-01 | 01 | 0 | INFRA-01 | config | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INFRA-02 | E2E | `pnpm playwright test tests/e2e/deployment.spec.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | INFRA-03 | integration | `pnpm vitest run tests/integration/cognee-health.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | INFRA-04 | unit | `pnpm vitest run tests/unit/cognee-config.test.ts` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 1 | INFRA-05 | integration | `pnpm vitest run tests/integration/storage.test.ts` | ❌ W0 | ⬜ pending |
| 01-06-01 | 06 | 1 | INFRA-06 | E2E | `pnpm playwright test tests/e2e/auth.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with React plugin
- [ ] `playwright.config.ts` — Playwright configuration for E2E
- [ ] `tests/e2e/auth.spec.ts` — Auth flow E2E test stubs
- [ ] `tests/e2e/deployment.spec.ts` — Deployment smoke test stubs
- [ ] `tests/integration/cognee-health.test.ts` — Cognee health check stubs
- [ ] `tests/integration/storage.test.ts` — Storage bucket access stubs
- [ ] `tests/unit/cognee-config.test.ts` — Cognee config unit test stubs
- [ ] Framework install: `pnpm add -D vitest @vitejs/plugin-react playwright @playwright/test`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase project configured | INFRA-01 | External SaaS setup | Run `supabase projects list`, verify `databridgeai` project appears |
| Vercel deployment live | INFRA-02 | External deployment platform | Open application URL, verify login page renders |
| Cloud Run service healthy | INFRA-03 | External infrastructure | Run `gcloud run services describe databridgeai-cognee --region=europe-west1`, verify status |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
