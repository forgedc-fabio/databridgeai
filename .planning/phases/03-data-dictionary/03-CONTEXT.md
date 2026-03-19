# Phase 3: Data Dictionary - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage a versioned data dictionary of taxonomy fields grouped by domains, with conditional editing forms, picklist/concatenated value management, match table CSV upload, and visual exploration via force graph and tree views. All data is tenant-scoped with RLS.

**Supersedes original requirements:** The user-provided field spec replaces the original DD-01 through DD-09 attribute list. DD-06 (seed from TaxonomyDataDic.json) is dropped — users create the dictionary from scratch after deployment.

</domain>

<decisions>
## Implementation Decisions

### Data model (user-specified)

**Domain** (replaces "category" from original requirements):
- Name, Description, Domain Area (free text), Owner (free text — not linked to auth users)
- Domains have a user-defined display order (manual drag-to-reorder, persisted)
- Deleting a domain unlinks its fields (fields become "unassigned") — no cascade delete

**Fields** (unique per client, can belong to multiple domains):
- Field Name — Title Case enforced (capitalise every word)
- Field Definition — sent to AI for scraping/classification context
- Value Type — business-meaningful dropdown:
  - Text → VARCHAR(255)
  - Long Text → NVARCHAR(600)
  - Descriptive Text → NVARCHAR(MAX)
  - Picklist → requires defining values on Values screen
  - Concatenated → select existing fields in order, separated by " | "
  - Number → standard number
- Controlled? — boolean, only available when Match Table exists AND Value Type = Picklist
- Tagging Method — picklist: Sourced, AI Inferred, System
- AI Instruction — optional free text for additional AI rules
- Id — UID auto-generated on save
- NOTE: Evaluate database needs and add additional fields as required (e.g., created_at, updated_at, created_by)

**Values** (sub-entity of fields):
- Picklist values: Value + Field Definition (sent to AI)
- Concatenated: ordered selection of existing fields via dropdown with "+" to add more (limit: 5-10 fields)

**Match Table**:
- Multi-column CSV hierarchy (e.g., Engagement Type | Media Type | Channel | Sub-Channel)
- When Controlled? = TRUE on a Picklist field, a match table must exist — prompt user to upload CSV if missing
- Match tables define parent-child cascading control between fields

### Field editing UX
- Side-panel pattern (consistent with Phase 2 ontology editor) — click row to edit, table stays visible
- Domain assignment via tags/chips below field name — click to add/remove from dropdown
- When Value Type = Picklist or Concatenated: nested dialog opens over the side panel for defining values
- Nested dialog returns to field form after save

### Domain management
- Dedicated Domains tab alongside Fields tab — DataTable of domains with 4 attributes (name, description, domain area, owner)
- Add/edit/delete domains from this tab
- Manual drag-to-reorder for domain display order (persisted in database)
- Owner is free text (not linked to Supabase Auth users)
- Domain Area is free text (not a picklist)

### Field grouping in DataTable
- Fields DataTable shows expandable domain groups — collapsible sections with domain header rows
- Fields belonging to multiple domains appear under each domain group
- Click domain header to expand/collapse

### Versioning
- Full dictionary snapshots — user clicks "Publish version" to create an immutable snapshot of entire dictionary state
- Auto-incrementing version number (v1, v2, v3) plus optional user-provided label (e.g., "v3 — Added compliance fields")
- Previous versions are read-only but can be cloned to create a new draft
- Side-by-side diff view showing added/removed/changed fields between any two versions
- Version UI placement at Claude's discretion (dropdown in header or dedicated tab)

### Visualisation
- react-force-graph (per PROJECT.md constraint) for graph view
- Nodes colour-coded by domain
- Graph structure and node types at Claude's discretion (domains → fields → values, or domains → fields only)
- Alternative tree view alongside graph — format at Claude's discretion (expandable tree or flat table with hierarchy)
- Graph/Tree view switching mechanism at Claude's discretion (toggle within tab or separate tabs)
- Presentation view at Claude's discretion (consistent with Phase 2 pattern if appropriate)

### Empty state
- No seed data — users start with an empty dictionary
- Zero-field state: illustration with "Create your first domain" CTA and brief explanation

### Claude's Discretion
- Match table management approach for v1 (CSV upload only vs CSV + inline editing)
- Graph node/edge structure (2-tier vs 3-tier)
- Tree view format (expandable tree vs flat table with hierarchy column)
- Graph/Tree toggle vs separate tabs
- Presentation view (/dictionary/visualisation) — follow Phase 2 pattern or skip
- Version UI location (header dropdown vs dedicated tab)
- Database schema design for versioning (snapshot storage approach)
- DataTable column configuration and sorting defaults
- Side panel form layout
- Graph node sizes, edge styling, force parameters

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project definition
- `.planning/PROJECT.md` — Product vision, tech stack constraints (react-force-graph for dictionary graphs), Cognee context, key decisions
- `.planning/REQUIREMENTS.md` — DD-01 through DD-09 requirement definitions (NOTE: field attributes superseded by user-provided spec in this CONTEXT.md)
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and requirement mapping

### Prior phase context
- `.planning/phases/01-infrastructure/01-CONTEXT.md` — Feature-based organisation (`src/features/dictionary/`), shadcn/ui + Tailwind, sidebar nav, auth patterns
- `.planning/phases/02-ontology-management/02-CONTEXT.md` — DataTable + side panel CRUD pattern, tab-based views, server actions, graph visualisation approach

### Infrastructure context
- `CLAUDE.md` (project root) — Supabase project details, GitHub repo, credential verification

No external specs or ADRs exist — requirements are fully captured in the decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/` — Full shadcn/ui suite: DataTable (table.tsx), tabs, sheet (side panel), dialog, dropdown-menu, select, badge, button, card, input, label, skeleton, sonner (toast), tooltip
- `src/features/ontology/` — Complete reference implementation: actions/, components/, hooks/, lib/, types/ structure
- `src/features/ontology/components/ontology-tabs.tsx` — Tab container pattern to reuse
- `src/features/ontology/components/class-list/` — DataTable + side panel CRUD pattern to follow
- `src/features/ontology/actions/class-actions.ts` — Server action pattern for CRUD operations
- `src/features/ontology/actions/sync-actions.ts` — Stale detection pattern (max updated_at comparison)
- `src/lib/supabase/` — Server and client Supabase clients

### Established Patterns
- **Feature-based organisation:** `src/features/dictionary/` with actions/, components/, hooks/, lib/, types/ subdirectories
- **Server-side data fetching:** page.tsx as server component fetching data, client wrapper for interactive state
- **Server actions:** `"use server"` functions for all mutations, revalidatePath after changes
- **Tab switching:** Horizontal tab bar at top of page switching full-page content
- **CRUD side panel:** Sheet component slides in from right, table visible behind
- **Delete confirmation:** AlertDialog before destructive actions listing affected entities
- **RLS:** Tenant-scoped with `get_user_tenant_id()` function, fixed tenant ID for v1

### Integration Points
- `src/app/(dashboard)/dictionary/page.tsx` — Placeholder page exists, needs replacement
- `src/lib/constants.ts` — NAV_ITEMS: Dictionary at `/dictionary` with `enabled: false` — needs `enabled: true`
- Dashboard layout wraps all feature pages with sidebar + auth
- No `src/features/dictionary/` directory yet — needs creation

</code_context>

<specifics>
## Specific Ideas

- Field Name should enforce Title Case (capitalise every word, e.g., "Brand Name")
- Match Table uses Channel domain as canonical example: Engagement Type → Media Type → Channel → Sub-Channel (cascading picklist control)
- Value Type descriptions are human-readable business labels mapping to database types (Text → VARCHAR, Long Text → NVARCHAR(600), etc.)
- AI Instruction field enhances the AI classification context beyond the base Field Definition
- Concatenated fields use " | " as separator between selected field values

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-data-dictionary*
*Context gathered: 2026-03-19*
