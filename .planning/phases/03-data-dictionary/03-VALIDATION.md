---
phase: 3
slug: data-dictionary
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom |
| **Config file** | `vitest.config.ts` (exists, configured) |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DD-01 | unit | `pnpm vitest run src/features/dictionary/components/fields/field-data-table.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DD-02 | unit | `pnpm vitest run src/features/dictionary/actions/field-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | DD-03 | unit | `pnpm vitest run src/features/dictionary/components/fields/field-form-panel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | DD-04 | unit | `pnpm vitest run src/features/dictionary/actions/domain-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | DD-05 | unit | `pnpm vitest run src/features/dictionary/actions/version-actions.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | DD-07 | unit | `pnpm vitest run src/features/dictionary/components/visualisation/dictionary-graph.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | DD-08 | unit | `pnpm vitest run src/features/dictionary/hooks/use-graph-data.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-08 | 01 | 1 | DD-09 | unit | `pnpm vitest run src/features/dictionary/components/visualisation/tree-view.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/dictionary/actions/field-actions.test.ts` — stubs for DD-02
- [ ] `src/features/dictionary/actions/domain-actions.test.ts` — stubs for DD-04
- [ ] `src/features/dictionary/actions/version-actions.test.ts` — stubs for DD-05
- [ ] `src/features/dictionary/components/fields/field-data-table.test.tsx` — stubs for DD-01
- [ ] `src/features/dictionary/components/fields/field-form-panel.test.tsx` — stubs for DD-03
- [ ] `src/features/dictionary/components/visualisation/dictionary-graph.test.tsx` — stubs for DD-07
- [ ] `src/features/dictionary/components/visualisation/tree-view.test.tsx` — stubs for DD-09
- [ ] `src/features/dictionary/hooks/use-graph-data.test.ts` — stubs for DD-08
- [ ] `src/features/dictionary/lib/validators.test.ts` — title case enforcement, field name validation
- [ ] `src/features/dictionary/lib/csv-parser.test.ts` — CSV parsing edge cases

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-to-reorder domains | DD-04 | Requires real mouse drag events with @dnd-kit | Open Domains tab, drag domain rows to reorder, verify order persists after refresh |
| Force graph interaction (zoom, pan, node click) | DD-07 | Canvas-based rendering, no DOM assertions | Open Graph view, verify nodes appear colour-coded, zoom/pan work, click node highlights |
| Nested dialog over side panel | DD-03 | Focus trap + overlay stacking requires visual check | Click field row → side panel opens → set Value Type to Picklist → nested dialog opens → save → returns to panel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
