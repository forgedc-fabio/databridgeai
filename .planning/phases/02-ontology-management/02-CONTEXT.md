# Phase 2: Ontology Management - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can define, visualise, and sync a domain ontology that constrains Cognee's entity extraction. This includes CRUD for ontology classes (with properties, relationships, hierarchies), three editor views (Class List, Relationship Editor, Visual Graph), a read-only presentation graph with export, and one-click sync to Cognee via OWL/RDF generation on Cloud Run. All data is tenant-scoped with RLS.

</domain>

<decisions>
## Implementation Decisions

### Editor layout & views
- Horizontal tab bar at top of the ontology page, switching full-page content between three views: Class List, Relationship Editor, Visual Graph
- Class List view uses a DataTable with a slide-out side panel for editing — click a row to open the edit form, table stays visible
- "Create new class" is a primary action button top-right above the DataTable, opens the same side panel form
- Visual Graph tab shows ontology visually but is not directly editable — click a node to navigate to its class in the Class List tab

### Class data model
- Each ontology class has: name (unique within tenant), description (free text), custom attributes (key-value pairs with type), colour/icon tag (for graph display), and domain grouping (e.g., Clinical, Commercial, Regulatory)
- Custom attributes stored as JSONB — each attribute has a key (name), value, and type (text, number, boolean, enum)
- Relationships defined via dropdown form: source class → relationship type → target class
- Hierarchies expressed as "is-a" / "subclass-of" relationship type — no separate hierarchy concept
- Relationship types: fixed starter set (is-a, has-part, related-to, depends-on) plus user-defined custom types

### Relationship Editor view
- DataTable of all relationships: source class → type → target class
- Filter by class or relationship type
- Add/edit/delete relationships from this view
- No mini graph preview — table only; Graph tab is one click away

### Graph visualisation
- Cytoscape.js with hierarchical/dagre layout (top-down or left-right tree)
- Nodes colour-coded by domain group (Clinical, Commercial, etc. — matches the colour assigned during class creation)
- Read-only presentation graph is a separate full-page view at /ontology/visualisation — larger canvas, no edit controls, cleaner chrome, shareable URL
- Graph interactions: click node to see details (tooltip or side panel), zoom to fit button, drag to reposition nodes, highlight neighbours on hover (dim unconnected nodes)
- Filter by domain, expand/collapse subtrees, search by class name (ONT-09)
- Export as PNG/SVG (ONT-10)

### Sync experience
- Manual "Sync to Cognee" button — user controls when the ontology is pushed
- Stale indicator appears as a badge/dot on the sync button itself — visible when ontology has changed since last sync
- During sync: button shows spinner, then success/error toast notification. Non-blocking — user can keep working
- OWL/RDF generated on Cloud Run (backend) using rdflib — frontend sends ontology data, Cloud Run generates OWL and stores in Supabase Storage

### Empty & onboarding states
- Zero-class state: illustration with "Create your first ontology class" CTA button and brief explanation of what an ontology is
- No seed/example data — users start blank and build from scratch

### Data validation & constraints
- Deleting a class with relationships: confirmation dialog listing relationships that will also be removed
- Class names must be unique within a tenant
- Circular hierarchy prevention and relationship type management at Claude's discretion

### Claude's Discretion
- Circular hierarchy prevention approach (validate on create vs allow with warning — OWL constraints should guide this)
- Relationship type management UX (inline creation in dropdown vs separate settings)
- Exact tab styling and icons
- DataTable column configuration and sorting
- Side panel form layout for class editing
- Graph node sizes, edge styling, animation
- Toast notification styling
- Presentation view URL structure and layout details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs or ADRs exist for this project — requirements are fully captured in the decisions above and in the following planning documents:

### Project definition
- `.planning/PROJECT.md` — Product vision, tech stack constraints (react-cytoscapejs, rdflib), Cognee context, key decisions
- `.planning/REQUIREMENTS.md` — ONT-01 through ONT-13 requirement definitions
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and requirement mapping

### Prior phase context
- `.planning/phases/01-infrastructure/01-CONTEXT.md` — Phase 1 decisions: feature-based organisation (`src/features/ontology/`), shadcn/ui + Tailwind, sidebar nav, auth patterns

### Infrastructure context
- `CLAUDE.md` (project root) — Supabase project details, GitHub repo, credential verification

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — shadcn/ui components: badge, button, card, input, label, separator, sidebar, tooltip
- `src/components/app-sidebar.tsx` — Collapsible sidebar with nav items; Ontology item at `/ontology` (currently `enabled: false` in constants)
- `src/lib/constants.ts` — `NAV_ITEMS` array; Ontology needs `enabled: true`
- `src/lib/supabase/` — Server and client Supabase clients ready for use

### Established Patterns
- **Route protection:** Server-side auth check in `src/app/(dashboard)/layout.tsx` via `supabase.auth.getUser()`
- **Feature-based organisation:** `src/features/auth/` established — ontology code goes in `src/features/ontology/`
- **Component library:** shadcn/ui v4 with Tailwind CSS v4 — need to add DataTable, tabs, sheet (side panel), dialog, toast components
- **Testing:** Vitest + Playwright configured in package.json

### Integration Points
- `src/app/(dashboard)/ontology/page.tsx` — Placeholder page exists, needs replacement
- Dashboard layout wraps all feature pages with sidebar + auth
- Cloud Run Cognee service already deployed — needs new `/ontology/sync` or similar endpoint for OWL generation
- Supabase Storage bucket exists — for OWL file storage
- No react-cytoscapejs installed yet — needs adding to dependencies

</code_context>

<specifics>
## Specific Ideas

No specific requirements — user consistently chose recommended defaults across all areas, indicating preference for proven patterns and standard approaches. The overall feel should be clean and functional for an internal tool used by 2 people.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-ontology-management*
*Context gathered: 2026-03-18*
