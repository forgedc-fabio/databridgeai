---
phase: 03-data-dictionary
plan: 03
subsystem: ui, database, api
tags: [supabase, next.js, shadcn, dialog, versioning, csv, picklist, server-actions]

# Dependency graph
requires:
  - phase: 03-data-dictionary/plan-01
    provides: "Database tables (picklist_values, concatenated_refs, match_tables, versions)"
  - phase: 03-data-dictionary/plan-02
    provides: "Field form panel, field actions, csv-parser, dictionary types"
provides:
  - "Picklist and concatenated value CRUD server actions"
  - "Match table upload and retrieval server actions"
  - "Version publish, list, snapshot, and diff functionality"
  - "Three nested dialogs: picklist values, concatenated fields, match table CSV upload"
  - "Full versioning UI: dropdown, publish dialog, version banner, diff view"
  - "getAllConcatenatedRefs and getAllPicklistValues exports for Plan 04 visualisation"
affects: [03-data-dictionary/plan-04]

# Tech tracking
tech-stack:
  added: [papaparse]
  patterns: ["Nested Dialog over Sheet pattern", "JSONB snapshot versioning", "Pure diff function separated from server actions"]

key-files:
  created:
    - "src/features/dictionary/actions/value-actions.ts"
    - "src/features/dictionary/actions/match-table-actions.ts"
    - "src/features/dictionary/actions/version-actions.ts"
    - "src/features/dictionary/lib/version-diff.ts"
    - "src/features/dictionary/components/fields/picklist-values-dialog.tsx"
    - "src/features/dictionary/components/fields/concatenated-fields-dialog.tsx"
    - "src/features/dictionary/components/fields/match-table-upload-dialog.tsx"
    - "src/features/dictionary/components/versioning/version-dropdown.tsx"
    - "src/features/dictionary/components/versioning/publish-version-dialog.tsx"
    - "src/features/dictionary/components/versioning/version-banner.tsx"
    - "src/features/dictionary/components/versioning/diff-view-dialog.tsx"
    - "src/features/dictionary/hooks/use-dictionary-version.ts"
  modified:
    - "src/features/dictionary/components/fields/field-form-panel.tsx"
    - "src/features/dictionary/components/dictionary-page-content.tsx"
    - "src/app/(dashboard)/dictionary/page.tsx"

key-decisions:
  - "computeVersionDiff moved to lib/version-diff.ts because Next.js server action modules only export async functions"
  - "handleFieldSave returns fieldId for sub-entity persistence after field creation"
  - "allFields prop added to FieldFormPanel for concatenated field reference selection"

patterns-established:
  - "Nested Dialog over Sheet: Dialog components render as siblings within Sheet, overlay on top of the open sheet"
  - "Pure utility functions separated from 'use server' files for client-side import compatibility"
  - "Version snapshot assembly: parallel queries to all dictionary tables, grouped into DictionarySnapshot JSONB"

requirements-completed: [DD-02, DD-03, DD-05]

# Metrics
duration: 18min
completed: 2026-03-19
---

# Phase 03 Plan 03: Values, Match Tables & Versioning Summary

**Nested picklist/concatenated dialogs, CSV match table upload, and full versioning system with publish, browse, and side-by-side diff**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-03-19T19:00:00Z
- **Completed:** 2026-03-19T19:18:00Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Six server actions for picklist values, concatenated refs, match tables, and versioning with auth/tenant scoping
- Three nested dialogs wired into field form panel: picklist values (add/remove/edit), concatenated fields (ordered select with 10-field limit), match table CSV upload (drag-and-drop with preview)
- Full versioning UI: dropdown selector in header, publish dialog with optional label, amber read-only banner, side-by-side diff with colour-coded changes (green/red/amber)
- Version publish creates immutable JSONB snapshot of all dictionary data (domains, fields, picklist values, concatenated refs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create value, match table, and version server actions** - `2048cff` (feat)
2. **Task 2: Build nested dialogs and wire into field form** - `7839737` (feat)
3. **Task 3: Build versioning UI and wire into page** - `9a74f6e` (feat)

## Files Created/Modified
- `src/features/dictionary/actions/value-actions.ts` - Picklist and concatenated value CRUD (6 exports)
- `src/features/dictionary/actions/match-table-actions.ts` - Match table get/upload with upsert
- `src/features/dictionary/actions/version-actions.ts` - Version list, publish (snapshot), fetch
- `src/features/dictionary/lib/version-diff.ts` - Pure diff computation function
- `src/features/dictionary/components/fields/picklist-values-dialog.tsx` - Nested dialog for managing picklist values
- `src/features/dictionary/components/fields/concatenated-fields-dialog.tsx` - Nested dialog for ordered field selection
- `src/features/dictionary/components/fields/match-table-upload-dialog.tsx` - CSV drag-and-drop with preview table
- `src/features/dictionary/components/fields/field-form-panel.tsx` - Wired to all three dialogs with real data
- `src/features/dictionary/components/versioning/version-dropdown.tsx` - Version selector with publish/compare actions
- `src/features/dictionary/components/versioning/publish-version-dialog.tsx` - Publish with optional label
- `src/features/dictionary/components/versioning/version-banner.tsx` - Amber banner for read-only mode
- `src/features/dictionary/components/versioning/diff-view-dialog.tsx` - Side-by-side version comparison
- `src/features/dictionary/hooks/use-dictionary-version.ts` - Version state management hook
- `src/features/dictionary/components/dictionary-page-content.tsx` - Integrated versioning components
- `src/app/(dashboard)/dictionary/page.tsx` - Server-side version fetching

## Decisions Made
- **computeVersionDiff location:** Moved from version-actions.ts (server action file) to lib/version-diff.ts because Next.js "use server" files can only export async server action functions. Pure utility functions must live in separate modules for client-side import.
- **handleFieldSave return value:** Extended to return `fieldId` so sub-entity data (picklist values, concatenated refs) can be persisted after a new field is created.
- **allFields prop:** Added to FieldFormPanel so the concatenated fields dialog can populate its Select dropdowns from available fields.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] computeVersionDiff cannot live in "use server" file**
- **Found during:** Task 3 (build verification)
- **Issue:** Next.js server action modules only export async functions. `computeVersionDiff` is a synchronous pure function that clients need to import, causing build failure.
- **Fix:** Extracted to `src/features/dictionary/lib/version-diff.ts`, updated import in diff-view-dialog.
- **Files modified:** version-actions.ts, version-diff.ts (new), diff-view-dialog.tsx
- **Verification:** `pnpm build` passes clean
- **Committed in:** 9a74f6e (Task 3 commit)

**2. [Rule 1 - Bug] Base UI Select onValueChange passes `string | null`**
- **Found during:** Task 3 (build verification)
- **Issue:** TypeScript error — Base UI's Select `onValueChange` callback receives `string | null`, but state setters expected `string`.
- **Fix:** Wrapped onValueChange with null guard: `(val) => { if (val) setX(val); }`
- **Files modified:** concatenated-fields-dialog.tsx, diff-view-dialog.tsx
- **Verification:** `pnpm build` passes clean
- **Committed in:** 9a74f6e (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes essential for build correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All sub-entity management (picklist values, concatenated refs, match tables) complete
- Versioning system ready for snapshotting and comparing dictionary states
- Plan 04 (visualisation) can consume `getAllConcatenatedRefs` and `getAllPicklistValues` exports
- `pnpm build` passes clean

## Self-Check: PASSED

- All 12 created files verified on disk
- All 3 task commits verified: 2048cff, 7839737, 9a74f6e
- `pnpm build` passes clean

---
*Phase: 03-data-dictionary*
*Completed: 2026-03-19*
