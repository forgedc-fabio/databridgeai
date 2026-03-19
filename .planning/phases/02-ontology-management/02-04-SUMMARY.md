---
phase: 02-ontology-management
plan: 04
subsystem: ui, graph-visualisation
tags: [cytoscape, react-cytoscapejs, dagre, svg-export, png-export, dynamic-import, graph]

# Dependency graph
requires:
  - phase: 02-ontology-management
    plan: 03
    provides: "Relationship CRUD server actions, OntologyRelationshipWithNames type, OntologyPageContent with tab management"
provides:
  - "Cytoscape graph stylesheet with domain colours, dimmed/highlighted states"
  - "useGraphData hook transforming OntologyClass[] + OntologyRelationshipWithNames[] to Cytoscape ElementDefinition[]"
  - "SSR-safe Cytoscape wrapper via next/dynamic with ssr: false"
  - "Graph controls: domain filter, class search with autocomplete, zoom-to-fit, expand/collapse subtrees"
  - "PNG and SVG export from Cytoscape graph"
  - "Presentation view at /ontology/visualisation with full-viewport canvas and back link"
  - "Graph tab wired into OntologyPageContent with domain filtering, search, and node click navigation"
affects: [02-05]

# Tech tracking
tech-stack:
  added: []
  patterns: ["SSR-safe Cytoscape via dynamic import with ssr: false", "forwardRef pattern to expose cy Core instance to parent components", "Domain-based element filtering on Cytoscape ElementDefinition arrays", "Module-scope extension registration with double-registration guard"]

key-files:
  created:
    - src/features/ontology/lib/graph-styles.ts
    - src/features/ontology/hooks/use-graph-data.ts
    - src/features/ontology/components/graph/cytoscape-graph-inner.tsx
    - src/features/ontology/components/graph/ontology-graph.tsx
    - src/features/ontology/components/graph/graph-controls.tsx
    - src/features/ontology/components/graph/graph-export.tsx
    - src/features/ontology/components/graph/presentation-view.tsx
    - src/app/(dashboard)/ontology/visualisation/page.tsx
  modified:
    - src/features/ontology/components/ontology-page-content.tsx

key-decisions:
  - "forwardRef pattern for CytoscapeGraphInner so parent components can access cy Core instance for search, zoom, and export"
  - "Domain filtering operates on the ElementDefinition array before passing to Cytoscape, not via Cytoscape API"
  - "Graph node click navigates to Classes tab and opens the edit panel for that class (cross-tab navigation)"
  - "Expand/collapse uses cy.hide()/show() on descendant nodes found via BFS on is-a edges"

patterns-established:
  - "SSR-safe graph: dynamic import with ssr: false, loading skeleton, client-only CytoscapeComponent"
  - "Cytoscape extension registration: module-scope with boolean guard to prevent double-registration"
  - "Graph element filtering: filter nodes by domain, then filter edges to only include those between visible nodes"
  - "forwardRef chain: OntologyGraph -> CytoscapeGraphInner -> cy Core instance"

requirements-completed: [ONT-07, ONT-08, ONT-09, ONT-10]

# Metrics
duration: ~8min
completed: 2026-03-19
---

# Phase 02 Plan 04: Visual Graph Summary

**Cytoscape.js graph with dagre layout, domain filtering, search, expand/collapse, PNG/SVG export, and presentation view at /ontology/visualisation**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-19T00:23:07Z
- **Completed:** 2026-03-19T00:30:59Z
- **Tasks:** 2/2
- **Files modified:** 9

## Accomplishments

- Cytoscape graph rendering with dagre hierarchical layout (top-down), domain-coloured nodes, and bezier edge styling
- SSR-safe architecture using next/dynamic with ssr: false and forwardRef chain for cy instance access
- Interactive controls: domain filter dropdown, class search with autocomplete, zoom-to-fit, expand/collapse subtrees
- PNG (2x scale) and SVG export via cy.png() and cytoscape-svg extension
- Graph tab wired into OntologyPageContent replacing placeholder, with node click navigation to Classes tab
- Presentation view at /ontology/visualisation with full-viewport canvas, minimal toolbar, and "Back to Editor" link

## Task Commits

Each task was committed atomically:

1. **Task 1: Create graph styles, data transform hook, Cytoscape components, and controls** - `7fd1078` (feat)
2. **Task 2: Wire Graph tab and create presentation view page** - `d226f2c` (feat)

**Plan metadata:** (pending -- final docs commit)

## Files Created/Modified

- `src/features/ontology/lib/graph-styles.ts` - Cytoscape stylesheet with node, edge, is-a edge, dimmed, highlighted selectors
- `src/features/ontology/hooks/use-graph-data.ts` - Hook transforming DB types to Cytoscape ElementDefinition[]
- `src/features/ontology/components/graph/cytoscape-graph-inner.tsx` - Cytoscape renderer with dagre layout, tap/hover events, forwardRef
- `src/features/ontology/components/graph/ontology-graph.tsx` - SSR-safe dynamic import wrapper with Skeleton loading
- `src/features/ontology/components/graph/graph-controls.tsx` - Domain filter, search, zoom-to-fit, expand/collapse controls
- `src/features/ontology/components/graph/graph-export.tsx` - PNG and SVG download buttons
- `src/features/ontology/components/graph/presentation-view.tsx` - Read-only full-viewport presentation graph with back link
- `src/app/(dashboard)/ontology/visualisation/page.tsx` - Server component page for presentation view route
- `src/features/ontology/components/ontology-page-content.tsx` - Wired Graph tab with controls, export, domain filtering, and node click navigation

## Decisions Made

- **forwardRef chain:** CytoscapeGraphInner exposes the cy Core instance via forwardRef so parent components (OntologyPageContent, PresentationView) can call cy.fit(), cy.animate(), cy.png(), and cy.svg() for controls, search, and export.
- **Client-side domain filtering:** Domain filter operates on the ElementDefinition array before passing to Cytoscape (filter nodes by domainGroup, then filter edges to only include those between visible nodes). This avoids complex Cytoscape API manipulation.
- **Cross-tab node click:** Clicking a graph node switches to the Classes tab and opens the edit panel for that class, providing quick navigation from visual to CRUD view.
- **Expand/collapse via BFS:** Uses BFS on is-a edges from root nodes to find descendants, then hides/shows them via cy.hide()/show() rather than using the heavier cytoscape-expand-collapse extension.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **TypeScript verification blocked:** The `pnpm tsc --noEmit` command was denied by tool permissions during execution. Types were verified via code review against established patterns and type imports from @types/cytoscape and @types/react-cytoscapejs. The user should run `pnpm tsc --noEmit` to confirm zero type errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Visual graph fully wired into Graph tab with interactive controls and export
- Presentation view accessible at /ontology/visualisation
- Plan 05 (Cognee Sync) can wire the disabled "Sync to Cognee" button
- **User should run `pnpm tsc --noEmit` to verify type check passes** before proceeding to Plan 05

## Self-Check: PASSED

- All 8 created files verified present on disk
- 1 modified file verified present on disk
- All 2 task commits verified in git log (7fd1078, d226f2c)

---
*Phase: 02-ontology-management*
*Completed: 2026-03-19*
