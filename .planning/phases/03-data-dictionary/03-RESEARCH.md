# Phase 3: Data Dictionary - Research

**Researched:** 2026-03-19
**Domain:** Supabase + Next.js CRUD with versioned data, force-graph visualisation, drag-to-reorder, CSV parsing
**Confidence:** HIGH

## Summary

Phase 3 builds a versioned data dictionary management feature on the established Next.js 16 + Supabase + shadcn/ui stack. The core challenge is a moderately complex relational data model (domains, fields, values, match tables, versions) with a rich UI surface: grouped DataTable with collapsible domain rows, side-panel CRUD, nested dialogs for picklist/concatenated values, drag-to-reorder domain ordering, CSV upload/parsing for match tables, a force-directed graph visualisation, and snapshot-based dictionary versioning with diff view.

The Phase 2 ontology module provides a near-complete reference implementation for the DataTable + Sheet CRUD + tabs + graph pattern. The dictionary feature follows the same `src/features/dictionary/` structure with `actions/`, `components/`, `hooks/`, `lib/`, `types/` subdirectories, and reuses the established server action pattern (all mutations via `"use server"` functions, `revalidatePath` after changes, `router.refresh()` for client-side data sync).

**Primary recommendation:** Follow Phase 2 patterns exactly for CRUD/table/panel structure. Use `react-force-graph-2d` (v1.29.1) for graph visualisation, `@dnd-kit/core` + `@dnd-kit/sortable` (stable v6.3.1/v10.0.0) for domain drag-to-reorder, and `papaparse` (v5.5.3) for client-side CSV parsing. Implement versioning as JSONB snapshot rows in a `dictionary_versions` table with a separate `dictionary_version_fields` junction approach for efficient diff computation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Data model:** Domains (name, description, domain_area, owner, display_order) replacing "categories". Fields unique per client, can belong to multiple domains. Value Types: Text, Long Text, Descriptive Text, Picklist, Concatenated, Number. Values sub-entity for Picklist/Concatenated. Match Table as CSV hierarchy for Controlled picklists.
- **Field editing UX:** Side-panel pattern consistent with Phase 2. Domain assignment via tags/chips. Nested dialog for Picklist values and Concatenated field selection.
- **Domain management:** Dedicated Domains tab with DataTable + manual drag-to-reorder (persisted). Owner and Domain Area are free text (not linked to auth/picklists).
- **Field grouping:** Expandable domain groups in Fields DataTable with collapsible sections.
- **Versioning:** Full dictionary snapshots. "Publish version" creates immutable snapshot. Auto-incrementing version number + optional label. Read-only view for published versions. Clone to new draft. Side-by-side diff view.
- **Visualisation:** react-force-graph (per PROJECT.md constraint). Nodes colour-coded by domain.
- **Empty state:** No seed data. Users start with empty dictionary. Zero-field state with CTA.
- **DD-06 dropped:** No TaxonomyDataDic.json seed data.

### Claude's Discretion
- Match table management approach for v1 (CSV upload only vs CSV + inline editing) -- **Recommendation:** CSV upload only for v1 (simpler, aligns with CONTEXT.md v1 scope note)
- Graph node/edge structure (2-tier vs 3-tier) -- **Recommendation:** 2-tier (domains + fields) as specified in UI-SPEC
- Tree view format (expandable tree vs flat table with hierarchy column) -- **Recommendation:** Expandable tree using Collapsible components as specified in UI-SPEC
- Graph/Tree toggle vs separate tabs -- **Recommendation:** Segmented control toggle within Visualisation tab as specified in UI-SPEC
- Presentation view -- **Recommendation:** Follow Phase 2 pattern at `/dictionary/visualisation`
- Version UI location -- **Recommendation:** Version dropdown in page header as specified in UI-SPEC
- Database schema design for versioning -- see Architecture Patterns section below
- DataTable column configuration and sorting defaults
- Side panel form layout
- Graph node sizes, edge styling, force parameters

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DD-01 | User can view 45+ taxonomy fields grouped by 7 categories in expandable DataTable | Grouped DataTable with `@tanstack/react-table` grouping, shadcn Collapsible for domain sections. Phase 2 ClassDataTable as reference. |
| DD-02 | User can add, edit, and delete dictionary fields with conditional form | Sheet side panel pattern (Phase 2), nested Dialog for picklist values and concatenated field selection. Server actions for mutations. |
| DD-03 | Edit form is conditional on value_type | Conditional rendering in field form panel based on Value Type selection. Picklist shows "Manage Values" button, Concatenated shows "Configure Fields" button. |
| DD-04 | User can manage categories (add, rename, reorder) | Dedicated Domains tab with DataTable, Sheet edit panel, `@dnd-kit/core` + `@dnd-kit/sortable` for drag-to-reorder with database persistence. |
| DD-05 | Data dictionary supports versioning | Snapshot versioning via `dictionary_versions` + `dictionary_version_snapshots` tables. Publish creates immutable JSONB snapshot. Diff computed by comparing snapshot arrays. |
| DD-06 | Seed data loaded from TaxonomyDataDic.json | **DROPPED per CONTEXT.md** -- users start with empty dictionary. Empty state with CTA instead. |
| DD-07 | User can view visual graph of categories, fields, and hierarchies | `react-force-graph-2d` v1.29.1 with 2-tier node structure (domains + fields). Presentation view at `/dictionary/visualisation`. |
| DD-08 | Graph uses react-force-graph with colour-coded nodes by value_type | Colour-coded by domain (not value_type -- superseded by CONTEXT.md). `DOMAIN_COLOUR_PALETTE` constant with 8 colours. |
| DD-09 | Alternative table/tree view alongside graph | Expandable tree view using shadcn Collapsible + ScrollArea within Visualisation tab, toggled via segmented control. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.0 | App Router, server components, server actions | Project stack (locked) |
| @supabase/supabase-js | 2.99.2 | Database client with RLS | Project stack (locked) |
| @supabase/ssr | 0.9.0 | Server-side Supabase client | Project stack (locked) |
| @tanstack/react-table | 8.21.3 | DataTable headless table library | Already used in Phase 2 ontology DataTables |
| shadcn/ui | 4.0.8 | UI component library (Radix-based) | Project stack (locked) |
| lucide-react | 0.577.0 | Icon library | Project stack (locked) |
| sonner | 2.0.7 | Toast notifications | Already used in Phase 2 |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-force-graph-2d | 1.29.1 | 2D force-directed graph visualisation | DD-07, DD-08 graph view. Peer dep: `react: '*'` (React 19 compatible). |
| @dnd-kit/core | 6.3.1 | Drag-and-drop foundation | DD-04 domain drag-to-reorder |
| @dnd-kit/sortable | 10.0.0 | Sortable preset for dnd-kit | DD-04 domain row reordering |
| @dnd-kit/utilities | 3.2.2 | CSS transform utilities for dnd-kit | Drag visual feedback |
| papaparse | 5.5.3 | Client-side CSV parsing | Match table CSV upload |
| @types/papaparse | 5.5.2 | TypeScript types for papaparse | Dev dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core + sortable (v6/v10) | @dnd-kit/react (v0.3.2) | New unified package but still 0.x pre-release. The stable v6 core + v10 sortable is battle-tested with 4.9M weekly downloads. Use stable. |
| papaparse | react-papaparse (v4.4.0) | React wrapper adds drag-drop UI we don't need (we build our own with shadcn). Plain papaparse is lighter, zero dependencies, and does everything we need. |
| papaparse | Native FileReader + manual parsing | Papaparse handles edge cases (quoted fields, newlines in values, BOM, encoding). Never hand-roll CSV parsing. |

**Installation:**
```bash
pnpm add react-force-graph-2d @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities papaparse
pnpm add -D @types/papaparse
```

**shadcn components to add:**
```bash
npx shadcn@latest add scroll-area collapsible
```

## Architecture Patterns

### Recommended Project Structure
```
src/features/dictionary/
├── actions/
│   ├── domain-actions.ts       # CRUD for domains + reorder
│   ├── field-actions.ts        # CRUD for fields + domain assignments
│   ├── value-actions.ts        # CRUD for picklist values + concatenated refs
│   ├── match-table-actions.ts  # Match table upload + retrieval
│   └── version-actions.ts      # Publish, list, get snapshot, diff
├── components/
│   ├── dictionary-page-content.tsx  # Main client wrapper (like ontology-page-content.tsx)
│   ├── dictionary-tabs.tsx          # Tab container: Fields, Domains, Visualisation
│   ├── version-dropdown.tsx         # Version selector + publish action
│   ├── fields/
│   │   ├── field-columns.tsx        # Column definitions for fields DataTable
│   │   ├── field-data-table.tsx     # Grouped DataTable with domain sections
│   │   ├── field-form-panel.tsx     # Sheet side panel for field create/edit
│   │   ├── field-empty-state.tsx    # Empty state when no fields
│   │   ├── picklist-values-dialog.tsx   # Nested dialog for picklist values
│   │   ├── concatenated-fields-dialog.tsx  # Nested dialog for concatenated selection
│   │   ├── match-table-upload-dialog.tsx   # CSV upload dialog
│   │   └── delete-field-dialog.tsx  # Delete confirmation
│   ├── domains/
│   │   ├── domain-columns.tsx       # Column definitions for domains DataTable
│   │   ├── domain-data-table.tsx    # DataTable with drag-to-reorder
│   │   ├── domain-form-panel.tsx    # Sheet side panel for domain create/edit
│   │   ├── domain-empty-state.tsx   # Empty state when no domains
│   │   └── delete-domain-dialog.tsx # Delete confirmation
│   ├── visualisation/
│   │   ├── dictionary-graph.tsx     # react-force-graph-2d wrapper
│   │   ├── graph-controls.tsx       # Domain filter, search, zoom controls
│   │   ├── tree-view.tsx            # Expandable tree using Collapsible
│   │   └── presentation-view.tsx    # Full-page read-only graph
│   └── versioning/
│       ├── publish-version-dialog.tsx  # Publish confirmation with label input
│       ├── version-banner.tsx       # Read-only version banner
│       └── diff-view-dialog.tsx     # Side-by-side version diff
├── hooks/
│   ├── use-graph-data.ts           # Transform dictionary data to force-graph format
│   └── use-dictionary-version.ts   # Version state management
├── lib/
│   ├── constants.ts                # DOMAIN_COLOUR_PALETTE, VALUE_TYPES, TAGGING_METHODS
│   ├── validators.ts               # Title case enforcement, field name validation
│   └── csv-parser.ts               # Papaparse wrapper for match table CSV
└── types/
    └── dictionary.ts               # All TypeScript interfaces
```

### Pattern 1: Database Schema Design

**What:** Relational schema for domains, fields, values, match tables, and versions
**When to use:** SQL migration file (002_dictionary_schema.sql)

```sql
-- Domains (replaces "categories")
create table public.dictionary_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  domain_area text,
  owner text,
  display_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_domain_name_per_tenant unique (tenant_id, name)
);

-- Fields (unique per tenant, can belong to multiple domains)
create table public.dictionary_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  field_name text not null,
  field_definition text,
  value_type text not null default 'Text'
    check (value_type in ('Text', 'Long Text', 'Descriptive Text', 'Picklist', 'Concatenated', 'Number')),
  tagging_method text not null default 'AI Inferred'
    check (tagging_method in ('Sourced', 'AI Inferred', 'System')),
  ai_instruction text,
  controlled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  constraint uq_field_name_per_tenant unique (tenant_id, field_name)
);

-- Field-Domain junction (many-to-many)
create table public.dictionary_field_domains (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  domain_id uuid not null references public.dictionary_domains(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  constraint uq_field_domain unique (field_id, domain_id)
);

-- Picklist values (sub-entity of fields with value_type = 'Picklist')
create table public.dictionary_picklist_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  value text not null,
  definition text,
  display_order integer not null default 0,
  constraint uq_picklist_value unique (field_id, value)
);

-- Concatenated field references (sub-entity of fields with value_type = 'Concatenated')
create table public.dictionary_concatenated_refs (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  referenced_field_id uuid not null references public.dictionary_fields(id),
  tenant_id uuid not null references public.tenants(id),
  position integer not null,
  constraint uq_concat_position unique (field_id, position)
);

-- Match tables (CSV hierarchy data for Controlled picklists)
create table public.dictionary_match_tables (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.dictionary_fields(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  columns text[] not null,  -- Column header names from CSV
  data jsonb not null default '[]'::jsonb,  -- Array of row objects
  uploaded_at timestamptz default now(),
  constraint uq_match_table_per_field unique (field_id)
);

-- Dictionary versions (immutable snapshots)
create table public.dictionary_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  version_number integer not null,
  label text,
  snapshot jsonb not null,  -- Full dictionary state at publish time
  published_at timestamptz default now(),
  published_by uuid references auth.users(id),
  constraint uq_version_number unique (tenant_id, version_number)
);
```

**Why this approach:**
- Junction table `dictionary_field_domains` supports many-to-many (fields in multiple domains)
- Separate `dictionary_picklist_values` and `dictionary_concatenated_refs` tables keep the relational model clean rather than JSONB for sub-entities (enables proper FK constraints, easier querying)
- Match table `data` as JSONB because CSV data is semi-structured and varies per field
- Version `snapshot` as JSONB because it captures a point-in-time state of the entire dictionary (fields + domains + values + assignments) in a single immutable row
- RLS on all tables using same `get_user_tenant_id()` function from Phase 1

### Pattern 2: Versioning Snapshot Structure

**What:** JSONB snapshot format for immutable version storage
**When to use:** When publishing a version or computing diffs

```typescript
// Snapshot shape stored in dictionary_versions.snapshot
interface DictionarySnapshot {
  domains: Array<{
    id: string;
    name: string;
    description: string | null;
    domain_area: string | null;
    owner: string | null;
    display_order: number;
  }>;
  fields: Array<{
    id: string;
    field_name: string;
    field_definition: string | null;
    value_type: string;
    tagging_method: string;
    ai_instruction: string | null;
    controlled: boolean;
    domain_ids: string[];
    picklist_values?: Array<{ value: string; definition: string | null }>;
    concatenated_field_ids?: string[];
  }>;
}
```

**Diff computation:** Compare two snapshots client-side by iterating `fields` arrays. Match by `id`, detect added (in B not in A), removed (in A not in B), changed (same id, different properties). Display in a table with green/red/amber row backgrounds per UI-SPEC.

### Pattern 3: Server Action Pattern (following Phase 2)

**What:** All mutations go through `"use server"` functions
**When to use:** Every create, update, delete, reorder, and publish operation

```typescript
// Source: Phase 2 ontology class-actions.ts pattern
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DictionaryField, DictionaryFieldInput } from "../types/dictionary";

export async function createDictionaryField(
  input: DictionaryFieldInput
): Promise<
  { data: DictionaryField; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "User profile not found" };

  const { data, error } = await supabase
    .from("dictionary_fields")
    .insert({
      tenant_id: profile.tenant_id,
      field_name: input.fieldName,
      // ... remaining fields
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A field with this name already exists. Choose a different name." };
    }
    return { error: error.message };
  }

  revalidatePath("/dictionary");
  return { data: data as DictionaryField };
}
```

### Pattern 4: Grouped DataTable with Domain Sections

**What:** Fields DataTable with expandable domain group headers
**When to use:** DD-01 Fields tab

The DataTable uses `@tanstack/react-table` but with manual grouping logic rather than react-table's built-in grouping (which doesn't produce the visual pattern needed). The approach:

1. Fetch all fields with their domain assignments
2. Group fields by domain in memory, respecting domain display_order
3. Render domain header rows as collapsible sections (shadcn Collapsible)
4. Fields belonging to multiple domains appear under each domain
5. "Unassigned" group at the bottom for fields with no domain

```typescript
// Grouping logic (in component or hook)
interface DomainGroup {
  domain: DictionaryDomain | null; // null = "Unassigned"
  fields: DictionaryFieldWithDomains[];
  isExpanded: boolean;
}

function groupFieldsByDomain(
  fields: DictionaryFieldWithDomains[],
  domains: DictionaryDomain[]
): DomainGroup[] {
  const sorted = [...domains].sort((a, b) => a.display_order - b.display_order);
  const groups: DomainGroup[] = sorted.map(domain => ({
    domain,
    fields: fields.filter(f => f.domain_ids.includes(domain.id)),
    isExpanded: true,
  }));

  // Unassigned group
  const unassigned = fields.filter(f => f.domain_ids.length === 0);
  if (unassigned.length > 0) {
    groups.push({ domain: null, fields: unassigned, isExpanded: true });
  }

  return groups;
}
```

### Pattern 5: Drag-to-Reorder with dnd-kit

**What:** Domain display order reordering via drag handles
**When to use:** DD-04 Domains tab

```typescript
// Source: dnd-kit sortable documentation
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = domains.findIndex(d => d.id === active.id);
  const newIndex = domains.findIndex(d => d.id === over.id);
  const reordered = arrayMove(domains, oldIndex, newIndex);

  // Optimistic update
  setDomains(reordered);

  // Persist new order
  reorderDomains(reordered.map((d, i) => ({ id: d.id, display_order: i })));
}
```

### Pattern 6: react-force-graph-2d Integration

**What:** 2D force-directed graph for dictionary visualisation
**When to use:** DD-07, DD-08 Visualisation tab

```typescript
// Source: react-force-graph GitHub API docs
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";

interface GraphNode {
  id: string;
  name: string;
  type: "domain" | "field";
  colour: string;
  val: number; // affects node size
}

interface GraphLink {
  source: string;
  target: string;
  type: "belongs-to" | "concatenated";
}

// In component:
const fgRef = useRef<ForceGraphMethods | undefined>();

<ForceGraph2D
  ref={fgRef}
  graphData={{ nodes, links }}
  nodeId="id"
  nodeLabel="name"
  nodeColor="colour"
  nodeVal="val"
  nodeCanvasObject={(node, ctx, globalScale) => {
    // Custom node rendering with labels
    const label = node.name;
    const fontSize = node.type === "domain" ? 12 / globalScale : 10 / globalScale;
    ctx.font = `${fontSize}px Geist Sans, sans-serif`;
    // Draw circle + label
  }}
  nodeCanvasObjectMode={() => "replace"}
  linkColor={(link) => link.type === "concatenated" ? "#94a3b8" : "#d1d5db"}
  linkLineDash={(link) => link.type === "concatenated" ? [5, 5] : null}
  linkDirectionalArrowLength={4}
  onNodeHover={handleNodeHover}
  onNodeClick={handleNodeClick}
  width={containerWidth}
  height={600}
  cooldownTicks={100}
  onEngineStop={() => fgRef.current?.zoomToFit(400)}
/>
```

**Key API notes (verified from GitHub docs):**
- `ref` provides `.zoomToFit(ms, padding)`, `.centerAt(x, y, ms)`, `.d3ReheatSimulation()`
- `nodeCanvasObject(node, ctx, globalScale)` for custom node painting
- `nodeCanvasObjectMode` can be `"replace"`, `"before"`, `"after"`
- `linkLineDash` accepts number array (e.g. `[5, 5]`) for dashed lines
- `onNodeHover(node, prevNode)` for highlighting connected nodes
- `warmupTicks` / `cooldownTicks` for simulation lifecycle
- No SSR -- must be dynamically imported with `next/dynamic` and `ssr: false`

### Anti-Patterns to Avoid
- **Storing version diffs instead of snapshots:** Diffs are fragile and make it impossible to reconstruct a point-in-time state without replaying all diffs from the beginning. Use full snapshots -- storage is cheap.
- **Using react-table built-in grouping for domain sections:** The built-in `getGroupedRowModel()` doesn't produce the visual pattern needed (collapsible headers with domain colour dots). Use manual grouping with custom rendering.
- **SSR for force-graph:** `react-force-graph-2d` uses canvas/WebGL and cannot render server-side. Always use `next/dynamic({ ssr: false })`.
- **Inline `revalidatePath` without `router.refresh()`:** Server actions revalidate the cache but the client component won't see changes without `router.refresh()` (follows Phase 2 pattern).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom string splitting / regex parser | papaparse (v5.5.3) | Handles quoted fields, embedded newlines, BOM, encoding detection, streaming. CSV parsing has hundreds of edge cases. |
| Drag-to-reorder | Custom mouse event handlers + DOM manipulation | @dnd-kit/core + @dnd-kit/sortable | Provides keyboard accessibility (Space/Enter, Arrow keys), touch support, collision detection, smooth animations. |
| Force graph layout | Custom d3-force integration + canvas rendering | react-force-graph-2d (v1.29.1) | Wraps d3-force + HTML5 Canvas with React lifecycle management, zoom/pan, node interaction, responsive sizing. |
| Title Case | Custom regex or manual capitalisation | Simple utility function (`toTitleCase`) | Only need basic word capitalisation. A 3-line utility is fine -- no library needed. |
| JSONB diff | Custom deep comparison | Simple field-by-field comparison of snapshot arrays | Snapshots have a flat structure (array of field objects). Map by `id`, compare properties. No need for a diff library. |

**Key insight:** The dictionary feature is UI-heavy with established patterns from Phase 2. The complexity is in the data model relationships and the versioning snapshot logic, not in novel UI patterns. Follow Phase 2 exactly for CRUD/table/panel interactions.

## Common Pitfalls

### Pitfall 1: Force Graph SSR Crash
**What goes wrong:** `react-force-graph-2d` accesses `window` and `document` during import, causing Next.js server-side rendering to fail with `ReferenceError: window is not defined`.
**Why it happens:** The library uses HTML5 Canvas which is browser-only.
**How to avoid:** Always use dynamic import:
```typescript
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });
```
**Warning signs:** Build failure or hydration mismatch errors mentioning `window` or `document`.

### Pitfall 2: Multi-Domain Field Duplication in Grouped View
**What goes wrong:** Fields belonging to multiple domains appear multiple times in the grouped DataTable. If not handled carefully, clicking to edit opens the wrong instance or the row key causes React re-render issues.
**Why it happens:** The same field object is rendered under each domain group.
**How to avoid:** Use a composite key (`${domainId}-${fieldId}`) for row keys in the grouped view. The edit handler should use the field's canonical `id`, not the composite key. Track the editing state by field `id` only.
**Warning signs:** Stale edit panel data, flickering rows, incorrect delete confirmations.

### Pitfall 3: Drag-to-Reorder Race Condition
**What goes wrong:** User rapidly reorders multiple domains. Optimistic UI updates conflict with server persistence if the previous reorder hasn't completed.
**Why it happens:** Each reorder calls a server action that updates `display_order` for all affected rows. Concurrent calls may overwrite each other.
**How to avoid:** Debounce the server persistence (e.g., 500ms after the last drag). Optimistic local state is immediate; server sync is batched. Use a single server action that accepts the full ordered array of IDs.
**Warning signs:** Domain order reverting after a few seconds, inconsistent ordering between sessions.

### Pitfall 4: Versioning Snapshot Size
**What goes wrong:** JSONB snapshot becomes very large if the dictionary has hundreds of fields with picklist values.
**Why it happens:** Each snapshot stores the full dictionary state including all picklist values and concatenated references.
**How to avoid:** For v1 with 2 users and ~45+ fields, this is not a concern. The snapshot will be a few KB at most. If needed later, consider storing snapshots in Supabase Storage instead of JSONB column. Monitor with `pg_column_size()`.
**Warning signs:** Slow version list loading, insert timeout on publish.

### Pitfall 5: Nested Dialog Focus Trap
**What goes wrong:** Opening a Dialog on top of an open Sheet causes focus management conflicts. Escape key might close both layers, or focus escapes the dialog.
**Why it happens:** Radix UI's focus trap implementation needs proper nesting.
**How to avoid:** Radix Dialog and Sheet both implement focus trapping. When a Dialog opens over a Sheet, the Dialog's focus trap takes precedence. Escape closes the Dialog first, then the Sheet. This works out of the box with shadcn/Radix -- just ensure the Dialog is rendered as a child of the Sheet content or at the same level with proper open/close state management.
**Warning signs:** Escape closing both layers, inability to tab between dialog fields.

### Pitfall 6: Controlled? Field Visibility Logic
**What goes wrong:** The "Controlled?" checkbox appears when it shouldn't, or doesn't appear when it should.
**Why it happens:** The checkbox is conditionally visible based on TWO conditions: (1) Value Type = Picklist, AND (2) a match table exists for this field. Both conditions must be checked.
**How to avoid:** Fetch match table existence status when the field form opens. Store as boolean in form state. Only show "Controlled?" checkbox when both conditions are met.
**Warning signs:** Checkbox visible for non-Picklist fields, or invisible even when match table exists.

## Code Examples

### Title Case Enforcement Utility
```typescript
// src/features/dictionary/lib/validators.ts
export function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}
```

### CSV Parser Wrapper
```typescript
// src/features/dictionary/lib/csv-parser.ts
import Papa from "papaparse";

export interface ParsedMatchTable {
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseMatchTableCSV(file: File): Promise<ParsedMatchTable> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        const errors = results.errors.map((e) => `Row ${e.row}: ${e.message}`);
        resolve({ columns, rows, errors });
      },
      error: (error) => {
        resolve({ columns: [], rows: [], errors: [error.message] });
      },
    });
  });
}
```

### Dynamic Import for Force Graph (Next.js SSR-safe)
```typescript
// src/features/dictionary/components/visualisation/dictionary-graph.tsx
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { ssr: false, loading: () => <div className="h-[600px] animate-pulse bg-muted rounded-lg" /> }
);
```

### Domain Colour Palette Constant
```typescript
// src/features/dictionary/lib/constants.ts
export const DOMAIN_COLOUR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate (overflow)
] as const;

export const UNASSIGNED_COLOUR = "#6b7280";

export const VALUE_TYPES = [
  "Text",
  "Long Text",
  "Descriptive Text",
  "Picklist",
  "Concatenated",
  "Number",
] as const;

export const TAGGING_METHODS = [
  "Sourced",
  "AI Inferred",
  "System",
] as const;
```

### Page-Level Server Component Pattern
```typescript
// src/app/(dashboard)/dictionary/page.tsx
// Source: Phase 2 ontology/page.tsx pattern
import { getDictionaryDomains } from "@/features/dictionary/actions/domain-actions";
import { getDictionaryFields } from "@/features/dictionary/actions/field-actions";
import { getDictionaryVersions } from "@/features/dictionary/actions/version-actions";
import { DictionaryPageContent } from "@/features/dictionary/components/dictionary-page-content";

export default async function DictionaryPage() {
  const [domainsResult, fieldsResult, versionsResult] = await Promise.all([
    getDictionaryDomains(),
    getDictionaryFields(),
    getDictionaryVersions(),
  ]);

  return (
    <div className="p-8">
      <DictionaryPageContent
        domains={domainsResult.data ?? []}
        fields={fieldsResult.data ?? []}
        versions={versionsResult.data ?? []}
      />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @dnd-kit/sortable | 2022-2023 | react-beautiful-dnd deprecated (Atlassian). dnd-kit is the standard for React drag-and-drop. |
| CSV manual parsing | papaparse | Ongoing | papaparse is the de facto CSV parser for JS/TS. No dependencies, handles all edge cases. |
| react-force-graph (umbrella) | react-force-graph-2d (standalone) | Always separate | The 2D-specific package is lighter than the umbrella. Use the specific renderer you need. |
| @dnd-kit/react (unified) | @dnd-kit/core + sortable (modular) | 2025-2026 transition | @dnd-kit/react v0.3.2 exists but is pre-release (0.x). Use stable modular packages for production. |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated by Atlassian, no longer maintained. Do not use.
- `react-sortable-hoc`: Superseded by dnd-kit. Do not use.

## Open Questions

1. **Match table cascading control enforcement**
   - What we know: When `Controlled? = TRUE` on a Picklist field, its values should be constrained by the match table hierarchy. CONTEXT.md defines the concept but not the runtime enforcement mechanism.
   - What's unclear: Should the UI filter picklist values based on parent field selections at data-entry time? Or is "controlled" merely a metadata flag for now?
   - Recommendation: For v1, treat "controlled" as a metadata flag stored in the database. The match table is uploaded and associated with the field, but cascading picklist filtering is a v2 feature (requires the content classification pipeline to be active). The flag and data structure are ready for v2.

2. **Concatenated field self-reference prevention**
   - What we know: Concatenated fields reference other existing fields. A field should not reference itself.
   - What's unclear: Should we also prevent transitive cycles (Field A concatenates B, Field B concatenates A)?
   - Recommendation: Prevent self-reference in the UI (filter current field from dropdown options). Transitive cycle prevention is unnecessary because concatenated values are display-only (no recursive resolution).

3. **Version diff granularity**
   - What we know: CONTEXT.md specifies side-by-side diff of added/removed/changed fields.
   - What's unclear: Should diff also show changes to domains, picklist values, and domain assignments? Or only top-level field changes?
   - Recommendation: Show field-level changes (added, removed, changed properties) and domain changes. Picklist value changes should be shown as part of field changes (e.g., "Values changed: 5 -> 7 values").

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + jsdom |
| Config file | `vitest.config.ts` (exists, configured with @vitejs/plugin-react, jsdom, path aliases) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DD-01 | Fields grouped by domain in expandable DataTable | unit | `pnpm vitest run src/features/dictionary/components/fields/field-data-table.test.tsx -x` | No -- Wave 0 |
| DD-02 | Add, edit, delete fields via side panel | unit | `pnpm vitest run src/features/dictionary/actions/field-actions.test.ts -x` | No -- Wave 0 |
| DD-03 | Conditional form adapts to value_type | unit | `pnpm vitest run src/features/dictionary/components/fields/field-form-panel.test.tsx -x` | No -- Wave 0 |
| DD-04 | Domain CRUD + drag-to-reorder | unit | `pnpm vitest run src/features/dictionary/actions/domain-actions.test.ts -x` | No -- Wave 0 |
| DD-05 | Versioning: publish, list, diff | unit | `pnpm vitest run src/features/dictionary/actions/version-actions.test.ts -x` | No -- Wave 0 |
| DD-06 | DROPPED | n/a | n/a | n/a |
| DD-07 | Force graph renders domain/field nodes | unit | `pnpm vitest run src/features/dictionary/components/visualisation/dictionary-graph.test.tsx -x` | No -- Wave 0 |
| DD-08 | Graph nodes colour-coded by domain | unit | `pnpm vitest run src/features/dictionary/hooks/use-graph-data.test.ts -x` | No -- Wave 0 |
| DD-09 | Tree view renders domain/field hierarchy | unit | `pnpm vitest run src/features/dictionary/components/visualisation/tree-view.test.tsx -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/features/dictionary/actions/field-actions.test.ts` -- covers DD-02
- [ ] `src/features/dictionary/actions/domain-actions.test.ts` -- covers DD-04
- [ ] `src/features/dictionary/actions/version-actions.test.ts` -- covers DD-05
- [ ] `src/features/dictionary/components/fields/field-data-table.test.tsx` -- covers DD-01
- [ ] `src/features/dictionary/components/fields/field-form-panel.test.tsx` -- covers DD-03
- [ ] `src/features/dictionary/components/visualisation/dictionary-graph.test.tsx` -- covers DD-07
- [ ] `src/features/dictionary/components/visualisation/tree-view.test.tsx` -- covers DD-09
- [ ] `src/features/dictionary/hooks/use-graph-data.test.ts` -- covers DD-08
- [ ] `src/features/dictionary/lib/validators.test.ts` -- title case enforcement, field name validation
- [ ] `src/features/dictionary/lib/csv-parser.test.ts` -- CSV parsing edge cases

## Sources

### Primary (HIGH confidence)
- Phase 2 ontology codebase (`src/features/ontology/`) -- complete reference implementation for DataTable + Sheet + tabs + server actions + graph patterns
- Supabase migration `001_ontology_schema.sql` -- establishes RLS, tenant scoping, trigger patterns
- `03-CONTEXT.md` -- user-specified data model and UX decisions
- `03-UI-SPEC.md` -- complete visual and interaction contract
- `package.json` -- current dependency versions verified

### Secondary (MEDIUM confidence)
- [react-force-graph GitHub](https://github.com/vasturiano/react-force-graph) -- API documentation for ForceGraph2D props, methods, and interaction callbacks
- [react-force-graph-2d npm](https://www.npmjs.com/package/react-force-graph-2d) -- version 1.29.1 verified, peer dep `react: '*'` (React 19 compatible)
- [dnd-kit Sortable docs](https://docs.dndkit.com/presets/sortable) -- DndContext, SortableContext, useSortable, arrayMove patterns
- [@dnd-kit/react npm](https://www.npmjs.com/package/@dnd-kit/react) -- v0.3.2 pre-release, confirmed peer dep `react: '^18 || ^19'`
- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) -- v6.3.1 stable, peer dep `react: '>=16.8.0'`
- [Papa Parse](https://www.papaparse.com/) -- v5.5.3, zero dependencies, multi-threaded CSV parsing
- npm registry (verified via `npm view` commands) -- all package versions and peer dependencies confirmed

### Tertiary (LOW confidence)
- Versioning snapshot pattern -- designed from first principles based on domain requirements. No authoritative external source for this specific schema design. Validated against Supabase JSONB documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified via npm registry, peer deps confirmed, Phase 2 patterns established
- Architecture: HIGH -- follows established Phase 2 patterns exactly, schema designed from documented requirements
- Pitfalls: HIGH -- SSR issues well-documented for force-graph, multi-domain grouping is a known UX pattern, focus trap behaviour verified against Radix docs
- Versioning: MEDIUM -- snapshot approach is sound but schema design is first-principles (no external reference implementation reviewed)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- all dependencies are established libraries)
