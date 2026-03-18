---
phase: 02
slug: ontology-management
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + Playwright 1.58.2 |
| **Config file** | `vitest.config.ts` (exists), `playwright.config.ts` (none — Wave 0 installs) |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test && pnpm test:e2e` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test && pnpm test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-00-01 | 00 | 0 | ALL | scaffold | `pnpm vitest run --reporter=verbose` | Plan 00 creates | ⬜ pending |
| 02-00-02 | 00 | 0 | ONT-13 | scaffold | `python -m pytest backend/tests/ --co -q` | Plan 00 creates | ⬜ pending |
| 02-01-01 | 01 | 1 | ONT-05 | type-check + grep | `pnpm tsc --noEmit 2>&1 \| tail -5` | N/A | ⬜ pending |
| 02-01-02 | 01 | 1 | ONT-05 | type-check | `pnpm tsc --noEmit 2>&1 \| tail -5` | N/A | ⬜ pending |
| 02-02-01 | 02 | 2 | ONT-01, ONT-06 | type-check + unit | `pnpm tsc --noEmit && pnpm vitest run src/features/ontology/actions/class-actions.test.ts src/features/ontology/components/ontology-tabs.test.tsx -x` | ✅ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | ONT-02 | type-check + unit | `pnpm tsc --noEmit && pnpm vitest run src/features/ontology/components/class-list/class-data-table.test.tsx -x` | ✅ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | ONT-03, ONT-04 | type-check + unit | `pnpm tsc --noEmit && pnpm vitest run src/features/ontology/lib/validators.test.ts src/features/ontology/actions/relationship-actions.test.ts -x` | ✅ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | ONT-03 | type-check | `pnpm tsc --noEmit 2>&1 \| tail -5` | N/A | ⬜ pending |
| 02-04-01 | 04 | 4 | ONT-07, ONT-09 | type-check + unit | `pnpm tsc --noEmit && pnpm vitest run src/features/ontology/components/graph/ontology-graph.test.tsx src/features/ontology/components/graph/graph-controls.test.tsx -x` | ✅ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | ONT-08 | type-check | `pnpm tsc --noEmit 2>&1 \| tail -5` | N/A | ⬜ pending |
| 02-05-01 | 05 | 5 | ONT-13 | syntax + pytest | `python3 -c "import ast; ..." && cd backend && python3 -m pytest tests/test_owl_generator.py -x --tb=short` | ✅ W0 | ⬜ pending |
| 02-05-02 | 05 | 5 | ONT-11, ONT-12 | type-check + unit | `pnpm tsc --noEmit && pnpm vitest run src/features/ontology/actions/sync-actions.test.ts src/features/ontology/hooks/use-ontology-sync.test.ts -x` | ✅ W0 | ⬜ pending |
| 02-05-03 | 05 | 5 | ONT-11 | manual-only | Requires Cloud Run deployment | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All created by Plan 02-00-PLAN.md (wave: 0, depends_on: []):

- [ ] `src/features/ontology/components/class-list/class-data-table.test.tsx` — covers ONT-01
- [ ] `src/features/ontology/actions/class-actions.test.ts` — covers ONT-02
- [ ] `src/features/ontology/actions/relationship-actions.test.ts` — covers ONT-03
- [ ] `src/features/ontology/lib/validators.test.ts` — covers ONT-04
- [ ] `src/features/ontology/components/ontology-tabs.test.tsx` — covers ONT-06
- [ ] `src/features/ontology/components/graph/ontology-graph.test.tsx` — covers ONT-07
- [ ] `src/features/ontology/components/graph/graph-controls.test.tsx` — covers ONT-09
- [ ] `src/features/ontology/actions/sync-actions.test.ts` — covers ONT-11
- [ ] `src/features/ontology/hooks/use-ontology-sync.test.ts` — covers ONT-12
- [ ] `backend/tests/test_owl_generator.py` — covers ONT-13
- [ ] `backend/tests/conftest.py` — shared Python test fixtures

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS tenant scoping | ONT-05 | Requires Supabase auth context | 1. Sign in as user A, create ontology class. 2. Sign in as user B (different tenant). 3. Verify user B cannot see user A's classes via DataTable or API. |
| PNG/SVG export | ONT-10 | Requires browser canvas API | 1. Navigate to visualisation view. 2. Click export PNG button, verify file downloads. 3. Click export SVG button, verify file downloads with valid SVG markup. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (Plan 02-00 creates all 11 test stubs)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (pnpm tsc --noEmit ~5-10s, vitest run ~5s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
