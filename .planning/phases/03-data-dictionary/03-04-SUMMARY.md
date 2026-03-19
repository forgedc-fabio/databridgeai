---
phase: 03-data-dictionary
plan: 04
subsystem: ui
tags: [react-force-graph-2d, force-graph, tree-view, collapsible, visualisation, canvas, next-dynamic]

# Dependency graph
requires:
  - phase: 03-02
    provides: Field DataTable, domain grouping, field-domain assignments
  - phase: 03-03
    provides: Value actions (getAllConcatenatedRefs, getAllPicklistValues), field form panel
provides:
  - Force-directed graph view of dictionary domains and fields
  - Tree view with expandable domain/field/picklist hierarchy
  - Graph/Tree segmented control toggle in Visualisation tab
  - Presentation view at /dictionary/visualisation with export PNG
  - Graph data transformation hook (useGraphData)
  - Domain filtering, field search, zoom-to-fit controls
affects: [04-rules, 05-content]

# Tech tracking
tech-stack:
  added: [react-force-graph-2d (already installed)]
  patterns: [SSR-safe dynamic import for canvas libraries, any-typed callbacks for react-force-graph-2d generics, forwardRef with useImperativeHandle for graph control]

key-files:
  created:
    - src/features/dictionary/hooks/use-graph-data.ts
    - src/features/dictionary/components/visualisation/dictionary-graph.tsx
    - src/features/dictionary/components/visualisation/graph-controls.tsx
    - src/features/dictionary/components/visualisation/tree-view.tsx
    - src/features/dictionary/components/visualisation/presentation-view.tsx
    - src/app/(dashboard)/dictionary/visualisation/page.tsx
  modified:
    - src/features/dictionary/components/dictionary-page-content.tsx

key-decisions:
  - "Used any-typed callbacks for react-force-graph-2d dynamic import to work around stripped generics"
  - "ForwardRef with useImperativeHandle to expose zoomToFit and getCanvasElement from graph component"
  - "ResizeObserver for responsive graph container width rather than fixed width"
  - "Cross-tab navigation on graph/tree node click opens field edit panel in Fields tab"

patterns-established:
  - "SSR-safe force-graph: dynamic(() => import('react-force-graph-2d'), { ssr: false }) with any-typed callbacks"
  - "Graph imperative handle: forwardRef + useImperativeHandle for parent control of graph methods"
  - "Domain filtering: filter nodes by domainId, then filter links to include only edges between visible nodes"

requirements-completed: [DD-07, DD-08, DD-09]

# Metrics
duration: 7min
completed: 2026-03-19
---

# Phase 03 Plan 04: Dictionary Visualisation Summary

**Force-directed graph and expandable tree view for dictionary domains/fields with colour-coded nodes, concatenated-ref dashed edges, and full-page presentation view**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T19:03:52Z
- **Completed:** 2026-03-19T19:11:13Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Force-directed graph rendering domains as large colour-coded nodes and fields as smaller nodes with belongs-to and concatenated edges
- Tree view with expandable Collapsible hierarchy: domains -> fields -> picklist values
- Graph/Tree segmented control toggle within the Visualisation tab
- Full-page presentation view at /dictionary/visualisation with export PNG capability
- Domain filtering, field search autocomplete, and zoom-to-fit controls in both in-tab and presentation views
- Cross-tab navigation from graph/tree node clicks to field edit panel

## Task Commits

Each task was committed atomically:

1. **Task 1: Create graph data hook, SSR-safe graph component, and controls** - `3dd1eda` (feat)
2. **Task 2: Build tree view, presentation view, and wire Visualisation tab** - `00e3ce6` (feat)

## Files Created/Modified

- `src/features/dictionary/hooks/use-graph-data.ts` - Transforms domains/fields/refs to force-graph node/link format with DOMAIN_COLOUR_PALETTE colouring
- `src/features/dictionary/components/visualisation/dictionary-graph.tsx` - SSR-safe react-force-graph-2d wrapper with custom canvas node rendering and ResizeObserver
- `src/features/dictionary/components/visualisation/graph-controls.tsx` - Domain filter Select, field search with autocomplete dropdown, zoom-to-fit button
- `src/features/dictionary/components/visualisation/tree-view.tsx` - Expandable tree using Collapsible components with domain/field/picklist hierarchy
- `src/features/dictionary/components/visualisation/presentation-view.tsx` - Full-page read-only graph with domain filter, search, zoom, and export PNG
- `src/app/(dashboard)/dictionary/visualisation/page.tsx` - Server component route fetching domains, fields, and concatenated refs
- `src/features/dictionary/components/dictionary-page-content.tsx` - Wired visualisation tab with graph/tree toggle, data fetching, and cross-tab navigation

## Decisions Made

- Used `any`-typed callback parameters for react-force-graph-2d because `next/dynamic` import strips generic type parameters. Internal casting ensures type safety within callbacks.
- Used `forwardRef` + `useImperativeHandle` pattern to expose `zoomToFit()` and `getCanvasElement()` from the graph component, enabling parent-controlled zoom and PNG export.
- Applied `ResizeObserver` for dynamic container width measurement rather than a fixed width, ensuring the graph fills its container responsively.
- Cross-tab navigation from graph/tree node click to field edit panel follows the Phase 2 ontology pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type incompatibilities with react-force-graph-2d dynamic import**
- **Found during:** Task 2 (build verification)
- **Issue:** `next/dynamic` strips generic type parameters from react-force-graph-2d, causing all callback parameters to be incompatible with `GraphNode`/`GraphLink` types
- **Fix:** Used `any` type aliases (`AnyNode`, `AnyLink`) for callback parameters with internal casting to `GraphNode`
- **Files modified:** src/features/dictionary/components/visualisation/dictionary-graph.tsx
- **Verification:** `pnpm build` passes
- **Committed in:** 00e3ce6 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Select onValueChange type signature**
- **Found during:** Task 2 (build verification)
- **Issue:** shadcn Select `onValueChange` now accepts `string | null` but handlers were typed as `(value: string) => void`
- **Fix:** Changed handler parameter types to `(value: string | null)` in graph-controls.tsx and presentation-view.tsx
- **Files modified:** src/features/dictionary/components/visualisation/graph-controls.tsx, src/features/dictionary/components/visualisation/presentation-view.tsx
- **Verification:** `pnpm build` passes
- **Committed in:** 00e3ce6 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered

None beyond the auto-fixed type issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 03 Data Dictionary is now complete (all 5 plans executed)
- Visualisation tab provides graph and tree views for dictionary exploration
- Ready to proceed to Phase 04 (Rules) or Phase 05 (Content)

## Self-Check: PASSED

- All 7 created/modified files verified on disk
- Commit 3dd1eda verified in git log
- Commit 00e3ce6 verified in git log
- `pnpm build` passes with all routes registered

---
*Phase: 03-data-dictionary*
*Completed: 2026-03-19*
