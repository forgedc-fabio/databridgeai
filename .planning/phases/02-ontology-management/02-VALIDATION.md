---
phase: 02
slug: ontology-management
status: draft
nyquist_compliant: false
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
| 02-01-01 | 01 | 1 | ONT-01 | unit | `pnpm vitest run src/features/ontology/components/class-list/class-data-table.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ONT-02 | unit + integration | `pnpm vitest run src/features/ontology/actions/class-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | ONT-03 | unit | `pnpm vitest run src/features/ontology/actions/relationship-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | ONT-04 | unit | `pnpm vitest run src/features/ontology/lib/validators.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | ONT-05 | manual-only | Verify via Supabase SQL editor | N/A | ⬜ pending |
| 02-02-01 | 02 | 2 | ONT-06 | unit | `pnpm vitest run src/features/ontology/components/ontology-tabs.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | ONT-07 | unit | `pnpm vitest run src/features/ontology/components/graph/ontology-graph.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | ONT-08 | smoke | `pnpm vitest run src/app/(dashboard)/ontology/visualisation/page.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-04 | 02 | 2 | ONT-09 | unit | `pnpm vitest run src/features/ontology/components/graph/graph-controls.test.tsx -x` | ❌ W0 | ⬜ pending |
| 02-02-05 | 02 | 2 | ONT-10 | manual-only | Requires browser canvas API | N/A | ⬜ pending |
| 02-03-01 | 03 | 3 | ONT-11 | unit | `pnpm vitest run src/features/ontology/actions/sync-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | ONT-12 | unit | `pnpm vitest run src/features/ontology/hooks/use-ontology-sync.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 3 | ONT-13 | unit (Python) | `python -m pytest backend/tests/test_owl_generator.py -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` — Playwright configuration file
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
- [ ] Python test framework install: `pip install pytest pytest-asyncio`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS tenant scoping | ONT-05 | Requires Supabase auth context | 1. Sign in as user A, create ontology class. 2. Sign in as user B (different tenant). 3. Verify user B cannot see user A's classes via DataTable or API. |
| PNG/SVG export | ONT-10 | Requires browser canvas API | 1. Navigate to visualisation view. 2. Click export PNG button, verify file downloads. 3. Click export SVG button, verify file downloads with valid SVG markup. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
