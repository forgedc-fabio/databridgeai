# Phase 2: Ontology Management - Research

**Researched:** 2026-03-18
**Domain:** Ontology CRUD, graph visualisation (Cytoscape.js), OWL generation (rdflib), Supabase RLS
**Confidence:** HIGH

## Summary

Phase 2 builds the ontology management feature: database tables with RLS, full CRUD for ontology classes and relationships, three tabbed views (Class List DataTable, Relationship Editor DataTable, Visual Graph), a read-only presentation graph view with export, and one-click sync to Cognee via OWL/RDF generation on Cloud Run. The tech stack is well-established: react-cytoscapejs wraps Cytoscape.js for graph rendering, TanStack Table powers shadcn/ui DataTables, and rdflib on Cloud Run generates OWL files from the ontology data.

The primary SSR concern is Cytoscape.js's dependency on browser APIs (`window`, `document`). The solution is Next.js `dynamic()` with `ssr: false` inside a `"use client"` wrapper component. This is a well-documented pattern. Cognee's `cognify()` function accepts an `ontology_file_path` parameter that points to an OWL file, meaning our sync flow is: generate OWL on Cloud Run with rdflib, store in Supabase Storage, then pass the file path when running `cognify()`. A custom FastAPI endpoint on the Cloud Run service will handle this.

**Primary recommendation:** Build the database layer first (tables + RLS + tenant scoping), then the Class List CRUD with DataTable and side panel, then add Relationship Editor and Graph views, and finally the sync-to-Cognee pipeline. Use `next/dynamic` with `ssr: false` for all Cytoscape components.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Editor layout:** Horizontal tab bar at top, switching full-page content between Class List, Relationship Editor, and Visual Graph
- **Class List view:** DataTable with slide-out side panel for editing; click row to open edit form, table stays visible
- **Create new class:** Primary action button top-right above DataTable, opens same side panel form
- **Visual Graph tab:** Not directly editable; click node navigates to Class List tab for that class
- **Class data model:** name (unique within tenant), description, custom attributes (JSONB key-value with type), colour/icon tag, domain grouping
- **Custom attributes:** JSONB with key, value, and type (text, number, boolean, enum)
- **Relationships:** Dropdown form: source class -> relationship type -> target class
- **Hierarchies:** Expressed as "is-a" / "subclass-of" relationship type (no separate hierarchy concept)
- **Relationship types:** Fixed starter set (is-a, has-part, related-to, depends-on) plus user-defined custom types
- **Relationship Editor view:** DataTable of all relationships (source -> type -> target), filter by class or type, add/edit/delete, no mini graph preview
- **Graph visualisation:** Cytoscape.js with hierarchical/dagre layout (top-down or left-right tree)
- **Node colours:** Coded by domain group (Clinical, Commercial, etc.)
- **Presentation graph:** Separate full-page view at /ontology/visualisation, larger canvas, no edit controls, shareable URL
- **Graph interactions:** Click node for details, zoom-to-fit, drag to reposition, highlight neighbours on hover
- **Filter/search/export:** Filter by domain, expand/collapse subtrees, search by class name, export PNG/SVG
- **Sync:** Manual "Sync to Cognee" button, stale indicator as badge/dot on sync button
- **Sync UX:** Button shows spinner during sync, success/error toast, non-blocking
- **OWL generation:** On Cloud Run using rdflib; frontend sends ontology data, Cloud Run generates OWL, stores in Supabase Storage
- **Empty state:** Illustration with "Create your first ontology class" CTA and brief explanation
- **No seed data:** Users start blank
- **Delete class:** Confirmation dialog listing relationships that will be removed
- **Class name uniqueness:** Enforced within tenant

### Claude's Discretion

- Circular hierarchy prevention approach (validate on create vs allow with warning)
- Relationship type management UX (inline creation in dropdown vs separate settings)
- Exact tab styling and icons
- DataTable column configuration and sorting
- Side panel form layout for class editing
- Graph node sizes, edge styling, animation
- Toast notification styling
- Presentation view URL structure and layout details

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONT-01 | View list of ontology classes in a DataTable | TanStack Table + shadcn/ui table components; column definitions pattern |
| ONT-02 | Create, edit, delete ontology classes with properties | Sheet (slide-out panel) + form components; JSONB for custom attributes |
| ONT-03 | Define relationships between classes via form with dropdowns | Select component; relationship table with FK constraints |
| ONT-04 | Define hierarchies and constraints between classes | "is-a" relationship type; circular hierarchy detection via DFS/BFS |
| ONT-05 | Ontology data is tenant-scoped with RLS | Supabase RLS with tenant_id lookup from auth.uid(); user_profiles table |
| ONT-06 | Ontology editor has three views: Class List, Relationship Editor, Visual Graph | shadcn/ui Tabs component; tab-based routing within /ontology page |
| ONT-07 | Visual graph uses Cytoscape.js with hierarchical/DAG layout | react-cytoscapejs + cytoscape-dagre layout extension |
| ONT-08 | Read-only presentation-optimised ontology visualisation | Separate route /ontology/visualisation; autoungrabify=false, userPanningEnabled |
| ONT-09 | Visualisation supports filter by domain, expand/collapse, search | Domain filter via state; expand/collapse via compound nodes or show/hide; search highlights |
| ONT-10 | Export ontology visualisation as PNG/SVG | cy.png() with blob output + cytoscape-svg extension |
| ONT-11 | Ontology syncs to Cognee as OWL/RDF file via Cloud Run endpoint | Custom FastAPI endpoint; rdflib OWL generation; Supabase Storage upload |
| ONT-12 | UI shows stale indicator when ontology changed since last sync | last_synced_at timestamp vs max(updated_at) comparison |
| ONT-13 | OWL generated via rdflib on Cloud Run, stored in Supabase Storage | rdflib Graph + OWL namespace; serialize to RDF/XML; upload to Storage bucket |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-cytoscapejs | 2.0.0 | React wrapper for Cytoscape.js graph rendering | Official Plotly-maintained React binding; `cy` ref callback for full API access |
| cytoscape | 3.33.1 | Graph theory library for visualisation | Industry standard for web graph visualisation; 160k+ weekly downloads |
| cytoscape-dagre | 2.5.0 | Hierarchical DAG layout for Cytoscape.js | Standard layout for ontology/tree structures; uses dagre 0.8.5 internally |
| cytoscape-svg | 0.4.0 | SVG export extension for Cytoscape.js | Only way to get true vector SVG export from Cytoscape |
| @tanstack/react-table | 8.21.3 | Headless table library for DataTable | Powers shadcn/ui data-table pattern; sorting, filtering, pagination |
| rdflib | 7.4.0 | Python OWL/RDF generation (Cloud Run) | Standard Python RDF library; parses and serialises OWL/RDF-XML, Turtle, etc. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/cytoscape | 3.31.0 | TypeScript definitions for Cytoscape.js | Always (TypeScript project) |
| @types/react-cytoscapejs | 1.2.6 | TypeScript definitions for react-cytoscapejs | Always (TypeScript project) |
| dagre | 0.8.5 | DAG layout algorithm (peer dep of cytoscape-dagre) | Installed automatically as peer dep |
| file-saver | 2.0.5 | Trigger file downloads from blob/base64 | PNG/SVG export download |
| sonner | (bundled with shadcn) | Toast notifications | Sync success/error feedback |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-cytoscapejs | Direct Cytoscape.js | More boilerplate, but full control; react-cytoscapejs is thin wrapper |
| cytoscape-svg | cy.png() only | No vector export; PNG only. SVG needed per ONT-10 |
| cytoscape-expand-collapse | Manual show/hide | Extension adds compound node expand/collapse but is heavyweight; manual show/hide is simpler for this use case |
| rdflib (Python) | owlready2 | owlready2 is higher-level but heavier; rdflib is standard and already what Cognee uses internally |

### Installation

Frontend:
```bash
pnpm add react-cytoscapejs cytoscape cytoscape-dagre cytoscape-svg file-saver
pnpm add -D @types/cytoscape @types/react-cytoscapejs @types/file-saver
```

shadcn/ui components (needed for this phase):
```bash
pnpm dlx shadcn@latest add table tabs sheet dialog select alert-dialog sonner skeleton dropdown-menu
```

Backend (add to `backend/pyproject.toml`):
```toml
dependencies = [
    "cognee>=0.5.5,<0.6.0",
    "rdflib>=7.0.0,<8.0.0",
    "supabase>=2.0.0",
]
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/(dashboard)/
│   ├── ontology/
│   │   ├── page.tsx                    # Ontology editor with tabs (replaces placeholder)
│   │   └── visualisation/
│   │       └── page.tsx                # Read-only presentation graph (ONT-08)
│   └── layout.tsx                      # Existing dashboard layout
├── features/ontology/
│   ├── components/
│   │   ├── ontology-tabs.tsx           # Tab container (Class List | Relationships | Graph)
│   │   ├── class-list/
│   │   │   ├── class-data-table.tsx    # DataTable for classes
│   │   │   ├── class-columns.tsx       # TanStack column definitions
│   │   │   ├── class-form-panel.tsx    # Sheet side panel for create/edit
│   │   │   └── class-empty-state.tsx   # Zero-class illustration + CTA
│   │   ├── relationships/
│   │   │   ├── relationship-data-table.tsx
│   │   │   ├── relationship-columns.tsx
│   │   │   └── relationship-form.tsx   # Add/edit relationship dialog
│   │   ├── graph/
│   │   │   ├── ontology-graph.tsx      # Cytoscape wrapper (use client + dynamic)
│   │   │   ├── graph-controls.tsx      # Zoom, fit, filter, search controls
│   │   │   └── graph-export.tsx        # PNG/SVG export buttons
│   │   └── sync/
│   │       ├── sync-button.tsx         # Sync to Cognee button with stale badge
│   │       └── sync-status.tsx         # Stale indicator logic
│   ├── hooks/
│   │   ├── use-ontology-classes.ts     # Fetch/mutate classes
│   │   ├── use-ontology-relationships.ts
│   │   ├── use-ontology-sync.ts        # Sync state management
│   │   └── use-graph-data.ts           # Transform DB data to Cytoscape elements
│   ├── lib/
│   │   ├── cytoscape-setup.ts          # Extension registration (dagre, svg)
│   │   ├── graph-styles.ts             # Cytoscape stylesheet definitions
│   │   └── validators.ts              # Circular hierarchy detection, name uniqueness
│   ├── actions/
│   │   ├── class-actions.ts            # Server actions for class CRUD
│   │   ├── relationship-actions.ts     # Server actions for relationship CRUD
│   │   └── sync-actions.ts             # Server action to trigger Cognee sync
│   └── types/
│       └── ontology.ts                 # TypeScript types for ontology domain
├── components/ui/                      # shadcn/ui components (shared)
└── lib/supabase/                       # Existing Supabase clients
```

### Pattern 1: Dynamic Import for Cytoscape (SSR Safety)

**What:** Cytoscape.js depends on browser APIs (`window`, `document`). Must be loaded client-side only.
**When to use:** Every component that renders a Cytoscape graph.
**Example:**

```typescript
// src/features/ontology/components/graph/ontology-graph.tsx
"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const CytoscapeGraph = dynamic(
  () => import("./cytoscape-graph-inner"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

export function OntologyGraph({ elements, onNodeClick }: OntologyGraphProps) {
  return <CytoscapeGraph elements={elements} onNodeClick={onNodeClick} />;
}
```

```typescript
// src/features/ontology/components/graph/cytoscape-graph-inner.tsx
"use client";

import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import svg from "cytoscape-svg";
import { useRef, useCallback } from "react";
import { graphStyles } from "../../lib/graph-styles";

// Register extensions once
cytoscape.use(dagre);
cytoscape.use(svg);

export default function CytoscapeGraphInner({
  elements,
  onNodeClick,
}: CytoscapeGraphInnerProps) {
  const cyRef = useRef<cytoscape.Core | null>(null);

  const setCyRef = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;

    cy.on("tap", "node", (evt) => {
      const nodeId = evt.target.id();
      onNodeClick?.(nodeId);
    });

    // Highlight neighbours on hover
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const neighbourhood = node.neighborhood().add(node);
      cy.elements().not(neighbourhood).addClass("dimmed");
      neighbourhood.addClass("highlighted");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("dimmed highlighted");
    });

    cy.fit(undefined, 50);
  }, [onNodeClick]);

  return (
    <CytoscapeComponent
      elements={elements}
      stylesheet={graphStyles}
      layout={{ name: "dagre", rankDir: "TB", nodeSep: 50, rankSep: 80 }}
      style={{ width: "100%", height: "100%" }}
      cy={setCyRef}
      userPanningEnabled
      userZoomingEnabled
      boxSelectionEnabled={false}
    />
  );
}
```

### Pattern 2: Supabase RLS with Tenant Scoping

**What:** All ontology data is scoped to a tenant via `tenant_id` column. RLS policies enforce isolation.
**When to use:** Every ontology table.
**Example:**

```sql
-- Tenant lookup function (reusable across all tables)
create or replace function public.get_user_tenant_id()
returns uuid as $$
  select tenant_id from public.user_profiles
  where user_id = auth.uid()
$$ language sql security definer stable;

-- Ontology classes table
create table public.ontology_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  domain_group text,
  colour text default '#6366f1',
  icon_tag text,
  custom_attributes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_class_name_per_tenant unique (tenant_id, name)
);

-- Enable RLS
alter table public.ontology_classes enable row level security;

-- RLS policies
create policy "Tenant read own classes"
  on public.ontology_classes for select
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "Tenant insert own classes"
  on public.ontology_classes for insert
  to authenticated
  with check (tenant_id = public.get_user_tenant_id());

create policy "Tenant update own classes"
  on public.ontology_classes for update
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

create policy "Tenant delete own classes"
  on public.ontology_classes for delete
  to authenticated
  using (tenant_id = public.get_user_tenant_id());

-- Performance index
create index idx_ontology_classes_tenant on public.ontology_classes(tenant_id);
```

### Pattern 3: Server Actions for CRUD

**What:** Next.js Server Actions for database mutations, keeping Supabase credentials server-side.
**When to use:** All create/update/delete operations.
**Example:**

```typescript
// src/features/ontology/actions/class-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OntologyClassInput } from "../types/ontology";

export async function createOntologyClass(input: OntologyClassInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorised");

  // Tenant ID resolved by RLS helper function; we fetch it for the insert
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("No tenant profile found");

  const { data, error } = await supabase
    .from("ontology_classes")
    .insert({
      tenant_id: profile.tenant_id,
      name: input.name,
      description: input.description,
      domain_group: input.domainGroup,
      colour: input.colour,
      icon_tag: input.iconTag,
      custom_attributes: input.customAttributes ?? [],
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A class with this name already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data };
}
```

### Pattern 4: Stale Indicator for Sync Status

**What:** Compare `last_synced_at` (on ontology_sync_status table) with `max(updated_at)` across ontology tables.
**When to use:** Sync button rendering.
**Example:**

```typescript
// src/features/ontology/hooks/use-ontology-sync.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOntologySyncStatus() {
  const [isStale, setIsStale] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function checkStaleness() {
      const supabase = createClient();

      const [{ data: syncStatus }, { data: latestClass }, { data: latestRel }] =
        await Promise.all([
          supabase
            .from("ontology_sync_status")
            .select("last_synced_at")
            .single(),
          supabase
            .from("ontology_classes")
            .select("updated_at")
            .order("updated_at", { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from("ontology_relationships")
            .select("updated_at")
            .order("updated_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

      const lastSynced = syncStatus?.last_synced_at
        ? new Date(syncStatus.last_synced_at)
        : new Date(0);
      const latestChange = new Date(
        Math.max(
          latestClass?.updated_at ? new Date(latestClass.updated_at).getTime() : 0,
          latestRel?.updated_at ? new Date(latestRel.updated_at).getTime() : 0
        )
      );

      setIsStale(latestChange > lastSynced);
    }

    checkStaleness();
  }, []);

  return { isStale, isSyncing, setIsSyncing };
}
```

### Pattern 5: OWL Generation with rdflib (Cloud Run)

**What:** Custom FastAPI endpoint that converts ontology data to OWL/RDF-XML using rdflib.
**When to use:** Sync-to-Cognee flow.
**Example:**

```python
# backend/owl_generator.py
from rdflib import Graph, Namespace, Literal, URIRef, RDF, RDFS, OWL, XSD

def generate_owl(ontology_data: dict) -> str:
    """Generate OWL/RDF-XML from ontology class and relationship data."""
    g = Graph()

    # Define namespace for this ontology
    ns = Namespace("http://databridgeai.forgedc.com/ontology#")
    g.bind("dba", ns)
    g.bind("owl", OWL)
    g.bind("rdfs", RDFS)

    # Declare ontology
    ontology_uri = URIRef("http://databridgeai.forgedc.com/ontology")
    g.add((ontology_uri, RDF.type, OWL.Ontology))

    # Add classes
    for cls in ontology_data.get("classes", []):
        class_uri = ns[cls["name"].replace(" ", "_")]
        g.add((class_uri, RDF.type, OWL.Class))
        if cls.get("description"):
            g.add((class_uri, RDFS.comment, Literal(cls["description"])))
        if cls.get("domain_group"):
            g.add((class_uri, RDFS.label, Literal(cls["name"])))

    # Add relationships
    for rel in ontology_data.get("relationships", []):
        source_uri = ns[rel["source_name"].replace(" ", "_")]
        target_uri = ns[rel["target_name"].replace(" ", "_")]

        if rel["type"] == "is-a":
            g.add((source_uri, RDFS.subClassOf, target_uri))
        else:
            # Object property
            prop_uri = ns[rel["type"].replace("-", "_").replace(" ", "_")]
            g.add((prop_uri, RDF.type, OWL.ObjectProperty))
            g.add((prop_uri, RDFS.domain, source_uri))
            g.add((prop_uri, RDFS.range, target_uri))

    return g.serialize(format="xml")
```

### Anti-Patterns to Avoid

- **Rendering Cytoscape in a Server Component:** Will crash with `window is not defined`. Always use `"use client"` + `dynamic(() => ..., { ssr: false })`.
- **Storing tenant_id in JWT custom claims (for v1):** Adds complexity of Custom Access Token Auth Hook. For 2 users, a simple `user_profiles` lookup table is sufficient and avoids JWT customisation.
- **Using `cy.on('click', ...)` instead of `cy.on('tap', ...)`:** `tap` is the Cytoscape-standard event that works for both mouse and touch. `click` does not exist in the Cytoscape event model.
- **Re-registering Cytoscape extensions on every render:** Extensions like dagre and svg must be registered once with `cytoscape.use()` at module scope, not inside a component body.
- **Fetching ontology data client-side for the DataTable:** Use Server Components to fetch data, pass to client DataTable component. Keeps Supabase credentials server-side and reduces client bundle.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph layout algorithms | Custom DAG positioning | cytoscape-dagre | Dagre handles edge crossing minimisation, rank assignment, node ordering -- extremely complex to implement correctly |
| DataTable with sorting/filtering | Custom table with manual sorting | @tanstack/react-table + shadcn/ui table | Headless approach handles column state, pagination, sorting, filtering with minimal code |
| OWL/RDF serialisation | Custom XML generation | rdflib (Python) | OWL/RDF-XML has strict namespace, entity encoding, and structural rules; rdflib handles all edge cases |
| SVG graph export | Manual SVG construction from nodes | cytoscape-svg | Captures all styling, edge paths, labels; handles viewport transforms |
| Toast notifications | Custom notification system | sonner (via shadcn/ui) | Accessible, animated, queueable, with auto-dismiss |
| Side panel (slide-out) | Custom panel with transitions | shadcn/ui Sheet | Accessible overlay with keyboard dismiss, focus trap, animations |
| Circular hierarchy detection | Naive parent walk | DFS/BFS on adjacency list | Must handle multi-parent hierarchies; simple parent walk misses cycles through siblings |

**Key insight:** Graph visualisation and OWL serialisation are domains where edge cases far outnumber the happy path. Libraries have years of bug fixes for problems you will not anticipate.

## Common Pitfalls

### Pitfall 1: Cytoscape SSR Crash

**What goes wrong:** `ReferenceError: window is not defined` during server-side rendering.
**Why it happens:** Cytoscape.js accesses `window` and `document` at import time, and Next.js App Router pre-renders Client Components on the server.
**How to avoid:** Use `next/dynamic` with `ssr: false` for any component that imports `react-cytoscapejs` or `cytoscape`. Create a wrapper Client Component that dynamically imports the graph inner component.
**Warning signs:** Build errors or hydration mismatches mentioning `window`.

### Pitfall 2: Cytoscape Extension Double Registration

**What goes wrong:** Console warnings or errors about extensions already registered.
**Why it happens:** `cytoscape.use(dagre)` called inside a component that re-renders, or in a module that gets hot-reloaded in development.
**How to avoid:** Register extensions at module scope in a dedicated setup file. Guard with a flag: `if (!registered) { cytoscape.use(dagre); registered = true; }`.
**Warning signs:** `Cytoscape.use: Can not register` warnings in console.

### Pitfall 3: RLS Policy Performance

**What goes wrong:** Slow queries on ontology tables.
**Why it happens:** RLS policies that call subqueries (`select tenant_id from user_profiles where user_id = auth.uid()`) execute per row without proper indexing.
**How to avoid:** Create index on `user_profiles(user_id)` and `ontology_classes(tenant_id)`. Use `security definer` on the tenant lookup function so it runs with elevated privileges and is optimised by the planner. Mark it `stable` for caching within a transaction.
**Warning signs:** Query plans showing sequential scans on user_profiles.

### Pitfall 4: Stale Indicator Race Condition

**What goes wrong:** User edits ontology, stale badge does not appear until page refresh.
**Why it happens:** Stale check runs on mount but not after mutations.
**How to avoid:** After any class/relationship mutation, either invalidate the sync status query or optimistically set `isStale = true`. Use `revalidatePath` from server actions to refresh server data.
**Warning signs:** Badge stays green after editing.

### Pitfall 5: Cytoscape Graph Not Rendering

**What goes wrong:** Empty white box where the graph should be.
**Why it happens:** Cytoscape requires a container with explicit width and height. CSS `height: 100%` only works if all parent containers also have explicit heights.
**How to avoid:** Set explicit dimensions on the Cytoscape container (e.g., `h-[600px]` or use CSS `calc(100vh - headerHeight)`). Alternatively, use `flex-1` within a flex column that has a fixed height ancestor.
**Warning signs:** The Cytoscape instance exists but renders nothing.

### Pitfall 6: OWL Class Name Encoding

**What goes wrong:** Invalid OWL/RDF-XML output due to special characters in class names.
**Why it happens:** Class names like "Phase III Trial" contain spaces that are invalid in RDF URIs.
**How to avoid:** Sanitise class names to valid URI fragments (replace spaces with underscores, remove special characters) when generating OWL. Keep the human-readable name as `rdfs:label`.
**Warning signs:** RDFLib serialisation errors or Cognee parsing failures.

### Pitfall 7: Circular Hierarchy in "is-a" Relationships

**What goes wrong:** Infinite loops during graph traversal or OWL reasoner crashes.
**Why it happens:** User creates A is-a B, then B is-a A (directly or indirectly via C).
**How to avoid:** On relationship creation/update, run DFS from the target class following "is-a" edges. If DFS reaches the source class, reject with an error message. This is a server-side validation, not just UI.
**Warning signs:** OWL generation hangs or produces invalid ontology.

**Recommendation (Claude's discretion):** Validate on create (reject circular hierarchies) rather than allowing with warning. OWL semantics require acyclic subclass hierarchies, and allowing cycles would produce invalid ontologies that Cognee cannot process.

## Code Examples

### Cytoscape Stylesheet (Domain-Coloured Nodes)

```typescript
// src/features/ontology/lib/graph-styles.ts
import type { Stylesheet } from "cytoscape";

export const DOMAIN_COLOURS: Record<string, string> = {
  Clinical: "#3b82f6",     // blue
  Commercial: "#10b981",   // emerald
  Regulatory: "#f59e0b",   // amber
  Medical: "#8b5cf6",      // violet
  Manufacturing: "#ef4444", // red
  Default: "#6b7280",      // grey
};

export const graphStyles: Stylesheet[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "background-color": "data(colour)",
      color: "#ffffff",
      "font-size": "12px",
      width: 60,
      height: 60,
      "text-wrap": "wrap",
      "text-max-width": "80px",
    },
  },
  {
    selector: "edge",
    style: {
      label: "data(label)",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 1.2,
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
      "font-size": "10px",
      "text-rotation": "autorotate",
    },
  },
  {
    selector: "edge[type='is-a']",
    style: {
      "line-style": "solid",
      "line-color": "#64748b",
      "target-arrow-color": "#64748b",
      "target-arrow-shape": "triangle",
    },
  },
  {
    selector: ".dimmed",
    style: {
      opacity: 0.2,
    },
  },
  {
    selector: ".highlighted",
    style: {
      "border-width": 3,
      "border-color": "#1e40af",
    },
  },
];
```

### Transform DB Data to Cytoscape Elements

```typescript
// src/features/ontology/hooks/use-graph-data.ts
import { useMemo } from "react";
import type { ElementDefinition } from "cytoscape";
import type { OntologyClass, OntologyRelationship } from "../types/ontology";
import { DOMAIN_COLOURS } from "../lib/graph-styles";

export function useGraphData(
  classes: OntologyClass[],
  relationships: OntologyRelationship[]
): ElementDefinition[] {
  return useMemo(() => {
    const nodes: ElementDefinition[] = classes.map((cls) => ({
      data: {
        id: cls.id,
        label: cls.name,
        colour: cls.colour ?? DOMAIN_COLOURS[cls.domain_group ?? "Default"] ?? DOMAIN_COLOURS.Default,
        domainGroup: cls.domain_group,
      },
    }));

    const edges: ElementDefinition[] = relationships.map((rel) => ({
      data: {
        id: rel.id,
        source: rel.source_class_id,
        target: rel.target_class_id,
        label: rel.relationship_type,
        type: rel.relationship_type,
      },
    }));

    return [...nodes, ...edges];
  }, [classes, relationships]);
}
```

### PNG/SVG Export

```typescript
// src/features/ontology/components/graph/graph-export.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { Core } from "cytoscape";

interface GraphExportProps {
  cyRef: React.RefObject<Core | null>;
}

export function GraphExport({ cyRef }: GraphExportProps) {
  const exportPng = () => {
    const cy = cyRef.current;
    if (!cy) return;
    const blob = cy.png({ output: "blob", full: true, scale: 2, bg: "#ffffff" });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontology.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSvg = () => {
    const cy = cyRef.current;
    if (!cy) return;
    // cytoscape-svg adds cy.svg() method
    const svgContent = (cy as any).svg({ full: true, scale: 1, bg: "#ffffff" });
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontology.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportPng}>
        <Download className="mr-2 h-4 w-4" /> PNG
      </Button>
      <Button variant="outline" size="sm" onClick={exportSvg}>
        <Download className="mr-2 h-4 w-4" /> SVG
      </Button>
    </div>
  );
}
```

### Database Schema (Complete)

```sql
-- Tenants and user profiles (foundation for RLS)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  created_at timestamptz default now(),
  constraint uq_user_profile unique (user_id)
);

create index idx_user_profiles_user_id on public.user_profiles(user_id);

-- Tenant lookup helper
create or replace function public.get_user_tenant_id()
returns uuid as $$
  select tenant_id from public.user_profiles
  where user_id = auth.uid()
$$ language sql security definer stable;

-- Relationship types (starter set + user-defined)
create table public.ontology_relationship_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  is_system boolean default false,
  created_at timestamptz default now(),
  constraint uq_rel_type_name_per_tenant unique (tenant_id, name)
);

-- Ontology classes
create table public.ontology_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  name text not null,
  description text,
  domain_group text,
  colour text default '#6366f1',
  icon_tag text,
  custom_attributes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_class_name_per_tenant unique (tenant_id, name)
);

-- Ontology relationships
create table public.ontology_relationships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  source_class_id uuid not null references public.ontology_classes(id) on delete cascade,
  target_class_id uuid not null references public.ontology_classes(id) on delete cascade,
  relationship_type_id uuid not null references public.ontology_relationship_types(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_relationship unique (tenant_id, source_class_id, target_class_id, relationship_type_id)
);

-- Sync tracking
create table public.ontology_sync_status (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  last_synced_at timestamptz,
  owl_file_path text,
  sync_status text default 'never_synced',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_sync_per_tenant unique (tenant_id)
);

-- Indexes
create index idx_ontology_classes_tenant on public.ontology_classes(tenant_id);
create index idx_ontology_relationships_tenant on public.ontology_relationships(tenant_id);
create index idx_ontology_relationships_source on public.ontology_relationships(source_class_id);
create index idx_ontology_relationships_target on public.ontology_relationships(target_class_id);
create index idx_ontology_rel_types_tenant on public.ontology_relationship_types(tenant_id);

-- Enable RLS on all tables
alter table public.tenants enable row level security;
alter table public.user_profiles enable row level security;
alter table public.ontology_classes enable row level security;
alter table public.ontology_relationships enable row level security;
alter table public.ontology_relationship_types enable row level security;
alter table public.ontology_sync_status enable row level security;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_ontology_classes_updated_at
  before update on public.ontology_classes
  for each row execute function public.set_updated_at();

create trigger tr_ontology_relationships_updated_at
  before update on public.ontology_relationships
  for each row execute function public.set_updated_at();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shadcn/ui toast component | Sonner (via shadcn/ui) | 2024 | Toast component deprecated; use sonner for all toast notifications |
| react-table v7 (useTable hook) | @tanstack/react-table v8 (useReactTable) | 2022 | Complete API change; v7 patterns do not work with v8 |
| `ssr: false` in Server Components | `ssr: false` in Client Component wrapper | Next.js 13+ | Cannot use `dynamic({ ssr: false })` directly in Server Components |
| gcr.io for container images | Artifact Registry (*.pkg.dev) | 2023 | gcr.io deprecated; project already uses Artifact Registry |
| Cognee `ontology_file_path` param | Config-based or env-based ontology config | 2025 | `ontology_file_path` still works as a shortcut; Config object is the full-control approach |

**Deprecated/outdated:**
- shadcn/ui `toast` component: Replaced by `sonner`. Do not install `toast`.
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr` (already used in project).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (per Phase 1 decision).

## Open Questions

1. **Cognee REST API ontology parameter**
   - What we know: Python SDK supports `ontology_file_path` param in `cognify()`. REST API `/cognify` endpoint exists but ontology config via REST is not well-documented.
   - What's unclear: Whether the REST API accepts ontology config in the POST body, or if the OWL file must be on the Cloud Run filesystem.
   - Recommendation: Build a custom FastAPI endpoint on the Cloud Run service (`/ontology/sync`) that accepts ontology data as JSON, generates OWL with rdflib, saves to a local temp file, calls `cognee.cognify(ontology_file_path=temp_path)`, then uploads the OWL file to Supabase Storage for records. This bypasses the REST API limitation entirely since we control the Cloud Run service.

2. **Relationship type management UX (Claude's discretion)**
   - What we know: Fixed starter set (is-a, has-part, related-to, depends-on) plus user-defined custom types.
   - Recommendation: Inline creation within the relationship dropdown -- when user types a new type name, offer "Create new type" option. This avoids a separate settings page for a simple list. Store in `ontology_relationship_types` table. System types are non-deletable (`is_system = true`).

3. **Expand/collapse subtrees implementation**
   - What we know: `cytoscape-expand-collapse` extension exists (v4.1.1) but is designed for compound node graphs. Our ontology uses a flat node graph with "is-a" edges.
   - What's unclear: Whether compound nodes or simple show/hide is more appropriate.
   - Recommendation: Use simple show/hide approach -- clicking a collapse control hides descendant nodes (found via BFS on "is-a" edges) and their connecting edges. Simpler, no additional extension needed, and avoids compound node complexity.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + Playwright 1.58.2 |
| Config file | `vitest.config.ts` (exists), `playwright.config.ts` (none -- see Wave 0) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test && pnpm test:e2e` |

### Phase Requirements -> Test Map

| Req ID | Behaviour | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONT-01 | Class list renders in DataTable | unit | `pnpm vitest run src/features/ontology/components/class-list/class-data-table.test.tsx -x` | Wave 0 |
| ONT-02 | Create/edit/delete class | unit + integration | `pnpm vitest run src/features/ontology/actions/class-actions.test.ts -x` | Wave 0 |
| ONT-03 | Define relationships via form | unit | `pnpm vitest run src/features/ontology/actions/relationship-actions.test.ts -x` | Wave 0 |
| ONT-04 | Hierarchy constraints (circular detection) | unit | `pnpm vitest run src/features/ontology/lib/validators.test.ts -x` | Wave 0 |
| ONT-05 | RLS tenant scoping | manual-only | Verify via Supabase SQL editor with different user contexts | N/A |
| ONT-06 | Three-view tab switching | unit | `pnpm vitest run src/features/ontology/components/ontology-tabs.test.tsx -x` | Wave 0 |
| ONT-07 | Cytoscape renders with dagre layout | unit | `pnpm vitest run src/features/ontology/components/graph/ontology-graph.test.tsx -x` | Wave 0 |
| ONT-08 | Presentation view renders read-only | smoke | `pnpm vitest run src/app/(dashboard)/ontology/visualisation/page.test.tsx -x` | Wave 0 |
| ONT-09 | Filter/expand/search graph | unit | `pnpm vitest run src/features/ontology/components/graph/graph-controls.test.tsx -x` | Wave 0 |
| ONT-10 | PNG/SVG export triggers download | manual-only | Requires browser canvas API; verify manually | N/A |
| ONT-11 | Sync to Cognee triggers API call | unit | `pnpm vitest run src/features/ontology/actions/sync-actions.test.ts -x` | Wave 0 |
| ONT-12 | Stale indicator shows after edit | unit | `pnpm vitest run src/features/ontology/hooks/use-ontology-sync.test.ts -x` | Wave 0 |
| ONT-13 | OWL generation produces valid XML | unit (Python) | `python -m pytest backend/tests/test_owl_generator.py -x` | Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test && pnpm test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `playwright.config.ts` -- Playwright configuration file
- [ ] `src/features/ontology/components/class-list/class-data-table.test.tsx` -- covers ONT-01
- [ ] `src/features/ontology/actions/class-actions.test.ts` -- covers ONT-02
- [ ] `src/features/ontology/actions/relationship-actions.test.ts` -- covers ONT-03
- [ ] `src/features/ontology/lib/validators.test.ts` -- covers ONT-04
- [ ] `src/features/ontology/components/ontology-tabs.test.tsx` -- covers ONT-06
- [ ] `src/features/ontology/components/graph/ontology-graph.test.tsx` -- covers ONT-07
- [ ] `src/features/ontology/components/graph/graph-controls.test.tsx` -- covers ONT-09
- [ ] `src/features/ontology/actions/sync-actions.test.ts` -- covers ONT-11
- [ ] `src/features/ontology/hooks/use-ontology-sync.test.ts` -- covers ONT-12
- [ ] `backend/tests/test_owl_generator.py` -- covers ONT-13
- [ ] `backend/tests/conftest.py` -- shared Python test fixtures
- [ ] Python test framework install: `pip install pytest pytest-asyncio` (add to backend/pyproject.toml dev deps)

## Sources

### Primary (HIGH confidence)

- [npm: react-cytoscapejs 2.0.0](https://www.npmjs.com/package/react-cytoscapejs) -- version, peer deps, API
- [npm: cytoscape 3.33.1](https://www.npmjs.com/package/cytoscape) -- version
- [npm: cytoscape-dagre 2.5.0](https://www.npmjs.com/package/cytoscape-dagre) -- version, peer deps
- [npm: cytoscape-svg 0.4.0](https://www.npmjs.com/package/cytoscape-svg) -- version, peer deps
- [npm: @tanstack/react-table 8.21.3](https://www.npmjs.com/package/@tanstack/react-table) -- version
- [Cytoscape.js official docs](https://js.cytoscape.org/) -- API methods, events, export
- [GitHub: plotly/react-cytoscapejs](https://github.com/plotly/react-cytoscapejs) -- props, extension registration, usage patterns
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- installation, column definitions, DataTable pattern
- [shadcn/ui Components](https://ui.shadcn.com/docs/components) -- tabs, sheet, dialog, sonner availability
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- policy patterns, auth functions
- [Supabase Custom Claims](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) -- JWT claims, tenant_id patterns
- [Cognee Ontology Support](https://docs.cognee.ai/guides/ontology-support) -- OWL integration, cognify config, file formats
- [Cognee Ontology Concepts](https://docs.cognee.ai/core-concepts/ontologies) -- ontology_file_path, RDFLib parsing, validation
- [Cognee REST API](https://docs.cognee.ai/guides/deploy-rest-api-server) -- endpoint paths, add/cognify/search

### Secondary (MEDIUM confidence)

- [GitHub: cytoscape-expand-collapse](https://github.com/iVis-at-Bilkent/cytoscape.js-expand-collapse) -- expand/collapse extension API
- [GitHub: kinimesi/cytoscape-svg](https://github.com/kinimesi/cytoscape-svg) -- SVG export extension usage
- [GitHub: topoteretes/cognee cognify.py](https://github.com/topoteretes/cognee/blob/main/cognee/api/v1/cognify/cognify.py) -- cognify function signature, config handling
- [RDFLib docs](https://rdflib.readthedocs.io/en/7.1.1/) -- Graph API, serialisation formats
- [RDFLib extras infixowl](https://rdflib.readthedocs.io/en/stable/_modules/rdflib/extras/infixowl.html) -- OWL class/property creation

### Tertiary (LOW confidence)

- Cognee REST API ontology config: Not documented whether REST endpoint supports ontology_file_path; recommendation is to use custom endpoint (see Open Questions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all library versions verified via npm, APIs confirmed via official docs
- Architecture: HIGH -- patterns follow established Next.js App Router + shadcn/ui conventions; Cytoscape SSR solution well-documented
- Database schema: HIGH -- standard Supabase RLS pattern with tenant lookup function
- Cognee integration: MEDIUM -- Python SDK well-documented, but REST API ontology config requires custom endpoint (pragmatic workaround identified)
- Pitfalls: HIGH -- all pitfalls sourced from official docs, GitHub issues, or verified through research

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days -- stable ecosystem, no breaking changes expected)
