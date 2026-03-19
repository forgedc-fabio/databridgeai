---
phase: 03-data-dictionary
plan: 02
subsystem: ui
tags: [react, tanstack-table, dnd-kit, shadcn, supabase, server-actions, crud]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Database tables (dictionary_domains, dictionary_fields, dictionary_field_domains, dictionary_match_tables) and types/constants/validators"
  - phase: 02-02
    provides: "UI patterns (DataTable, Sheet form panel, empty state, delete dialog, page content wrapper, tabs)"
provides:
  - "Domain CRUD server actions with reorder and field count"
  - "Field CRUD server actions with domain assignment sync"
  - "Domain DataTable with drag-to-reorder via dnd-kit"
  - "Field grouped DataTable with collapsible domain sections"
  - "Field form panel with Title Case enforcement and conditional Picklist/Concatenated sections"
  - "Dictionary page with three tabs (Fields, Domains, Visualisation)"
affects: [03-03, 03-04]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/modifiers"]
  patterns: ["grouped DataTable with collapsible domain sections", "drag-to-reorder with dnd-kit SortableContext", "conditional form sections based on value_type"]

key-files:
  created:
    - "src/features/dictionary/actions/domain-actions.ts"
    - "src/features/dictionary/actions/field-actions.ts"
    - "src/features/dictionary/components/domains/domain-columns.tsx"
    - "src/features/dictionary/components/domains/domain-data-table.tsx"
    - "src/features/dictionary/components/domains/domain-form-panel.tsx"
    - "src/features/dictionary/components/domains/domain-empty-state.tsx"
    - "src/features/dictionary/components/domains/delete-domain-dialog.tsx"
    - "src/features/dictionary/components/fields/field-columns.tsx"
    - "src/features/dictionary/components/fields/field-data-table.tsx"
    - "src/features/dictionary/components/fields/field-form-panel.tsx"
    - "src/features/dictionary/components/fields/field-empty-state.tsx"
    - "src/features/dictionary/components/fields/delete-field-dialog.tsx"
    - "src/features/dictionary/components/dictionary-tabs.tsx"
    - "src/features/dictionary/components/dictionary-page-content.tsx"
  modified:
    - "src/app/(dashboard)/dictionary/page.tsx"
    - "package.json"
    - "pnpm-lock.yaml"

key-decisions:
  - "Used manual DOM grouping for field DataTable rather than TanStack grouping — simpler for domain-based collapsible sections"
  - "Picklist 'Manage Values' and Concatenated 'Configure Fields' buttons rendered disabled with tooltip — wired in Plan 03"
  - "Domain colour assigned by display_order % palette length, not stored in database"

patterns-established:
  - "Grouped DataTable: manual grouping with Collapsible components wrapping table rows by domain"
  - "Drag-to-reorder: DndContext + SortableContext + useSortable with restrictToVerticalAxis modifier"
  - "Conditional form: sections appear/disappear based on value_type state"
  - "Domain assignment: Badge chip row with + dropdown for adding, X for removing"

requirements-completed: [DD-01, DD-02, DD-03, DD-04]

# Metrics
duration: 8min
completed: 2026-03-19
---

# Phase 03 Plan 02: Core CRUD Surface Summary

**Domain and field CRUD with drag-to-reorder DataTable, grouped field DataTable with collapsible domain sections, conditional field form, and three-tab page shell**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T18:38:25Z
- **Completed:** 2026-03-19T18:46:27Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- Full domain CRUD with server actions, drag-to-reorder DataTable (dnd-kit), Sheet form panel, empty state, and delete confirmation
- Full field CRUD with grouped DataTable (collapsible domain sections), conditional form (Title Case, Picklist/Concatenated sections), domain assignment via badge chips
- Dictionary page shell with three tabs (Fields, Domains, Visualisation) and context-aware CTA buttons
- Build passes cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create domain and field server actions** - `9cae0e5` (feat)
2. **Task 2: Build Domains tab components with drag-to-reorder** - `c1a1280` (feat)
3. **Task 3: Build Fields tab with grouped DataTable, conditional form, tab shell, and page wiring** - `be624ed` (feat)

## Files Created/Modified

- `src/features/dictionary/actions/domain-actions.ts` - Domain CRUD + reorder + field count server actions
- `src/features/dictionary/actions/field-actions.ts` - Field CRUD + domain assignment sync + match table check
- `src/features/dictionary/components/domains/domain-columns.tsx` - TanStack column defs with drag handle, colour dot, field count
- `src/features/dictionary/components/domains/domain-data-table.tsx` - Drag-to-reorder DataTable with dnd-kit
- `src/features/dictionary/components/domains/domain-form-panel.tsx` - Sheet form with validateDomainName
- `src/features/dictionary/components/domains/domain-empty-state.tsx` - Empty state with FolderOpen icon
- `src/features/dictionary/components/domains/delete-domain-dialog.tsx` - AlertDialog with field unlink count
- `src/features/dictionary/components/fields/field-columns.tsx` - Column defs with value type badges, domain chips
- `src/features/dictionary/components/fields/field-data-table.tsx` - Grouped DataTable with collapsible domain sections
- `src/features/dictionary/components/fields/field-form-panel.tsx` - Conditional form with Title Case, domain chips, disabled Picklist/Concatenated buttons
- `src/features/dictionary/components/fields/field-empty-state.tsx` - Two-variant empty state (no domains vs no fields)
- `src/features/dictionary/components/fields/delete-field-dialog.tsx` - AlertDialog for field deletion
- `src/features/dictionary/components/dictionary-tabs.tsx` - Three-tab container (Fields, Domains, Visualisation)
- `src/features/dictionary/components/dictionary-page-content.tsx` - Main client wrapper with all CRUD state management
- `src/app/(dashboard)/dictionary/page.tsx` - Server component with parallel data fetching
- `package.json` - Added @dnd-kit/modifiers dependency
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made

- **Manual grouping for field DataTable:** Used manual DOM grouping with React.Fragment and collapsible sections rather than TanStack's built-in grouping API, as the domain-based collapsible sections with header rows are simpler to implement this way.
- **Disabled Picklist/Concatenated buttons:** "Manage Values" and "Configure Fields" rendered as disabled with tooltip placeholder -- will be wired to nested dialogs in Plan 03.
- **Domain colour from display_order:** Colour is derived from `display_order % DOMAIN_COLOUR_PALETTE.length` rather than being stored in the database, keeping the colour palette consistent and automatic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @dnd-kit/modifiers dependency**
- **Found during:** Task 3 (build verification after all files written)
- **Issue:** `@dnd-kit/modifiers` package not in package.json; `restrictToVerticalAxis` import failed at build
- **Fix:** Ran `pnpm add @dnd-kit/modifiers`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Build passes cleanly
- **Committed in:** be624ed (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dependency installation. No scope creep.

## Issues Encountered

None beyond the missing dependency documented above.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness

- Core CRUD surface complete -- Plan 03 can wire picklist values dialog, concatenated fields dialog, and match table upload
- Plan 04 can build visualisation tab (graph + tree view) using the data structures and tab shell established here
- All server actions follow established patterns and are ready for extension

## Self-Check: PASSED

- All 17 created/modified files verified present on disk
- All 3 task commits verified in git log (9cae0e5, c1a1280, be624ed)
- Build passes cleanly with zero errors

---
*Phase: 03-data-dictionary*
*Completed: 2026-03-19*
