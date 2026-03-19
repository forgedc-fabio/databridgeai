---
phase: 3
slug: data-dictionary
status: compliant
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
audited: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom |
| **Config file** | `vitest.config.ts` (jsdom, `@vitejs/plugin-react`, globals: true) |
| **Component testing** | `@testing-library/react` + `@testing-library/user-event` |
| **Quick run command** | `npx vitest run src/features/dictionary/ --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** `npx vitest run src/features/dictionary/`
- **After every plan wave:** Full suite must be green
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 03-00-01 | 00 | 0 | ALL | scaffold | `npx vitest run src/features/dictionary/actions/ src/features/dictionary/lib/` | ✅ green |
| 03-00-02 | 00 | 0 | ALL | scaffold | `npx vitest run src/features/dictionary/components/ src/features/dictionary/hooks/` | ✅ green |
| 03-01-01 | 01 | 1 | DD-01, DD-02 | type-check | `pnpm tsc --noEmit 2>&1 \| tail -5` | ✅ green |
| 03-01-02 | 01 | 1 | DD-05 | unit | `npx vitest run src/features/dictionary/lib/validators.test.ts src/features/dictionary/lib/csv-parser.test.ts` | ✅ green |
| 03-02-01 | 02 | 2 | DD-01 | unit + integration | `npx vitest run src/features/dictionary/actions/domain-actions.test.ts src/features/dictionary/components/domains/domain-data-table.test.tsx` | ✅ green |
| 03-02-02 | 02 | 2 | DD-02, DD-03 | unit + integration | `npx vitest run src/features/dictionary/actions/field-actions.test.ts src/features/dictionary/components/fields/field-data-table.test.tsx src/features/dictionary/components/fields/field-form-panel.test.tsx` | ✅ green |
| 03-03-01 | 03 | 3 | DD-05 | unit + integration | `npx vitest run src/features/dictionary/actions/value-actions.test.ts src/features/dictionary/actions/version-actions.test.ts src/features/dictionary/lib/version-diff.test.ts` | ✅ green |
| 03-04-01 | 04 | 4 | DD-07, DD-08, DD-09 | unit + integration | `npx vitest run src/features/dictionary/hooks/use-graph-data.test.ts src/features/dictionary/components/visualisation/` | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All created by Plan 03-00 (wave: 0, depends_on: []):

- [x] `src/features/dictionary/actions/domain-actions.test.ts` — covers DD-01
- [x] `src/features/dictionary/actions/field-actions.test.ts` — covers DD-02, DD-04
- [x] `src/features/dictionary/actions/value-actions.test.ts` — covers DD-05
- [x] `src/features/dictionary/actions/version-actions.test.ts` — covers DD-05
- [x] `src/features/dictionary/lib/validators.test.ts` — covers DD-01, DD-02
- [x] `src/features/dictionary/lib/csv-parser.test.ts` — covers DD-05
- [x] `src/features/dictionary/lib/version-diff.test.ts` — covers DD-05 (created during audit)
- [x] `src/features/dictionary/components/fields/field-data-table.test.tsx` — covers DD-02
- [x] `src/features/dictionary/components/fields/field-form-panel.test.tsx` — covers DD-02, DD-03
- [x] `src/features/dictionary/components/domains/domain-data-table.test.tsx` — covers DD-01
- [x] `src/features/dictionary/components/visualisation/dictionary-graph.test.tsx` — covers DD-07
- [x] `src/features/dictionary/components/visualisation/tree-view.test.tsx` — covers DD-08
- [x] `src/features/dictionary/hooks/use-graph-data.test.ts` — covers DD-07, DD-09

---

## Requirement Coverage

| Requirement | Description | Test Files | Status |
|-------------|-------------|------------|--------|
| DD-01 | Domain management — CRUD, drag-reorder | `domain-actions.test.ts`, `domain-data-table.test.tsx`, `validators.test.ts` | ✅ automated |
| DD-02 | Field management — grouped DataTable | `field-actions.test.ts`, `field-data-table.test.tsx`, `field-form-panel.test.tsx` | ✅ automated |
| DD-03 | Conditional field form — Picklist/Concatenated | `field-form-panel.test.tsx` | ✅ automated |
| DD-04 | Domain assignment via tags | `field-actions.test.ts`, `validators.test.ts` | ✅ automated |
| DD-05 | Picklist/concat values, match table CSV, versioning | `value-actions.test.ts`, `version-actions.test.ts`, `csv-parser.test.ts`, `version-diff.test.ts` | ✅ automated |
| DD-07 | Force graph visualisation | `use-graph-data.test.ts`, `dictionary-graph.test.tsx` | ✅ automated |
| DD-08 | Tree view | `tree-view.test.tsx` | ✅ automated |
| DD-09 | Presentation view | `use-graph-data.test.ts` | ✅ automated |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-to-reorder domains persists after page refresh | DD-01 | dnd-kit pointer events + live DB round-trip | Drag domain row in browser, refresh page, confirm order preserved |
| Force graph renders correctly in browser | DD-07 | react-force-graph-2d canvas rendering requires browser | Navigate to /dictionary, open Visualisation tab, confirm graph renders |
| Export PNG from presentation view | DD-09 | Canvas-to-PNG export requires browser | Navigate to /dictionary/visualisation, click Export PNG, confirm download |
| Picklist values persist and reload on field reopen | DD-05 | DB round-trip requires live Supabase | Create Picklist field, manage values, reopen — confirm values present |
| CSV drag-and-drop drop zone | DD-05 | File drag interaction requires browser | Drag CSV file onto match table upload zone, confirm highlight and parse |
| Version banner and read-only mode | DD-05 | Session state + UI interaction requires browser | Browse to historical version, confirm amber banner and disabled CRUD |
| Version diff view with real snapshots | DD-05 | Requires published versions in live DB | Publish 2 versions, open compare dialog, confirm diff rows |

---

## Validation Audit — 2026-03-19

| Metric | Count |
|--------|-------|
| Gaps found | 13 |
| Resolved (automated) | 13 |
| Escalated (manual-only) | 0 |
| Total tests written | 86 |
| New test files created | 1 (`version-diff.test.ts`) |
| Test files upgraded from scaffold | 12 |

**Techniques applied:**
- `@testing-library/react` installed for component tests
- `vi.mock('@/lib/supabase/server')` chained per implementation call sequence for server actions
- `vi.mock('next/dynamic')` returning synchronous loading skeleton for `DictionaryGraph`
- `vi.mock('@dnd-kit/core')` with passthrough wrappers (pointer events not supported in jsdom)
- `ResizeObserver` polyfill in `dictionary-graph.test.tsx` (jsdom gap)

**Approval:** ✅ compliant
