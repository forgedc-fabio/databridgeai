---
phase: 03-data-dictionary
verified: 2026-03-19T20:00:00Z
status: human_needed
score: 4/4 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to /dictionary, confirm Fields tab shows expandable domain sections with colour-coded headers, field rows under each domain, and Unassigned group for orphan fields"
    expected: "Domain headers with colour dot, field count badge, and chevron expand/collapse toggle. Fields appear under each domain they belong to. Multi-domain fields appear under multiple sections."
    why_human: "Grouped DataTable rendering with Collapsible components requires browser to verify correct DOM structure and interactive collapse/expand behaviour"
  - test: "Create a domain, create a Picklist field, click Manage Values — add 3 values and save. Reopen the field and confirm values are preserved."
    expected: "Picklist values persisted to Supabase dictionary_picklist_values table, reloaded on field reopen. Value count shows in 'Manage Values (3)' button."
    why_human: "Database round-trip for sub-entity persistence requires live Supabase connection to verify"
  - test: "Create a Concatenated field, click Configure Fields — select 2 fields. Confirm Preview shows 'Field1 | Field2'. Save and reopen."
    expected: "Concatenated refs persisted, preview renders in correct order with | separator, max 10 fields limit enforced with tooltip"
    why_human: "State management and database persistence of ordered concatenated refs requires live testing"
  - test: "Upload a CSV file to Match Table upload dialog. Confirm drag-and-drop drop zone highlights on hover, preview table shows first 5 rows, Import button is only enabled after parse."
    expected: "File parses via papaparse, columns extracted from header row, preview renders correctly, Import button disabled until parse completes successfully"
    why_human: "File drag-and-drop and papaparse parsing in browser context requires live interaction testing"
  - test: "Drag domains to reorder in the Domains tab. Confirm the new order persists after page refresh."
    expected: "display_order updated in Supabase dictionary_domains table via reorderDomains() server action. Page reload shows updated order."
    why_human: "dnd-kit drag-to-reorder interaction and persistence requires live testing with actual mouse drag"
  - test: "Publish a version with a label. Browse back to it and confirm read-only amber banner appears with correct version number and label."
    expected: "Amber banner shows 'Viewing version v1 — [label]'. All CRUD controls are disabled. 'Switch to current draft' navigates back to edit mode."
    why_human: "Version state management, read-only mode enforcement, and banner display require live session testing"
  - test: "With 2+ versions published: open Compare Versions dialog, select Version A and Version B. Confirm green/red/amber diff rows appear."
    expected: "Added fields in green, removed in red, changed in amber. Domain changes section above field table. Both snapshots loaded from Supabase."
    why_human: "Diff computation and rendering with real snapshot data requires published versions to exist in database"
  - test: "Navigate to Visualisation tab. Confirm force graph renders with domain nodes (larger) and field nodes (smaller), colour-coded by domain. Toggle to Tree view and confirm expandable hierarchy."
    expected: "Graph loads with react-force-graph-2d (no SSR error). Domain nodes in palette colours, field nodes in lighter shade. Tree shows domains -> fields -> picklist values hierarchy."
    why_human: "Canvas rendering via react-force-graph-2d and Collapsible tree hierarchy require browser with JavaScript enabled. SSR-safe dynamic import can only be verified at runtime."
  - test: "Navigate to /dictionary/visualisation. Confirm full-page graph renders with Back to Dictionary link and Export PNG button functional."
    expected: "Presentation view at /dictionary/visualisation loads. Back to Dictionary links to /dictionary. Export PNG triggers a PNG download of the graph canvas."
    why_human: "Full-page route rendering and canvas-to-PNG export require live browser testing"
---

# Phase 3: Data Dictionary — Verification Report

**Phase Goal:** Users can manage a versioned data dictionary of taxonomy fields grouped by domains, with conditional editing, picklist/concatenated value management, match table CSV upload, and visual exploration via force graph and tree views
**Verified:** 2026-03-19T20:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | User can view taxonomy fields grouped by domains in an expandable DataTable with collapsible domain sections | VERIFIED (automated) | `field-data-table.tsx` imports `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, groups fields by `domain_ids`, renders Unassigned group. Domain header rows with `ChevronDown`/`ChevronRight` toggle. |
| 2 | User can add, edit, and delete fields with a conditional form that adapts to value_type, and can manage domains with drag-to-reorder | VERIFIED (automated) | `field-form-panel.tsx` has conditional Picklist/Concatenated sections, `toTitleCase` on blur, `PicklistValuesDialog`, `ConcatenatedFieldsDialog`, `MatchTableUploadDialog` wired. `domain-data-table.tsx` uses `DndContext` + `SortableContext` + `useSortable` with `restrictToVerticalAxis`. |
| 3 | User can view a colour-coded force-graph of domains and fields, and switch to an expandable tree view | VERIFIED (automated) | `dictionary-graph.tsx` uses `dynamic(react-force-graph-2d, {ssr:false})` with `nodeCanvasObject`, `cooldownTicks`. `use-graph-data.ts` assigns `DOMAIN_COLOUR_PALETTE` colours, `val:20` domain nodes, `val:8` field nodes. `tree-view.tsx` uses `Collapsible` hierarchy with `ScrollArea`. Segmented Graph/Tree control in `dictionary-page-content.tsx`. |
| 4 | User can publish, browse, and compare dictionary versions with side-by-side diff | VERIFIED (automated) | `version-dropdown.tsx` (Publish Version, Compare Versions, Current Draft). `publish-version-dialog.tsx` (label input). `version-banner.tsx` (Viewing version, Switch to current draft). `diff-view-dialog.tsx` (`computeVersionDiff`, `bg-green-50`, `bg-red-50`, `bg-amber-50`). `use-dictionary-version.ts` (viewingVersionId, isReadOnly). |

**Score:** 4/4 truths verified at code level. Live browser testing needed for runtime confirmation.

---

### Required Artifacts

#### Plan 00: Test Scaffolds

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/features/dictionary/actions/domain-actions.test.ts` | VERIFIED | Exists, `describe("domain-actions"` present |
| `src/features/dictionary/actions/field-actions.test.ts` | VERIFIED | Exists |
| `src/features/dictionary/actions/value-actions.test.ts` | VERIFIED | Exists |
| `src/features/dictionary/actions/version-actions.test.ts` | VERIFIED | Exists |
| `src/features/dictionary/lib/validators.test.ts` | VERIFIED | Exists |
| `src/features/dictionary/lib/csv-parser.test.ts` | VERIFIED | Exists |
| `src/features/dictionary/components/fields/field-data-table.test.tsx` | VERIFIED | Exists |
| `src/features/dictionary/components/fields/field-form-panel.test.tsx` | VERIFIED | Exists |
| `src/features/dictionary/components/domains/domain-data-table.test.tsx` | VERIFIED | Exists |
| `src/features/dictionary/components/visualisation/dictionary-graph.test.tsx` | VERIFIED | Exists |
| `src/features/dictionary/components/visualisation/tree-view.test.tsx` | VERIFIED | Exists |
| `src/features/dictionary/hooks/use-graph-data.test.ts` | VERIFIED | Exists |

#### Plan 01: Foundation

| Artifact | Status | Evidence |
|----------|--------|---------|
| `supabase/migrations/002_dictionary_schema.sql` | VERIFIED | 7 tables: dictionary_domains, dictionary_fields, dictionary_field_domains, dictionary_picklist_values, dictionary_concatenated_refs, dictionary_match_tables, dictionary_versions. 7x `enable row level security`. `get_user_tenant_id()` used in all policies. Does NOT recreate existing functions. |
| `src/features/dictionary/types/dictionary.ts` | VERIFIED | Exports: DictionaryDomain, DictionaryField, DictionaryFieldWithDomains, DictionaryPicklistValue, DictionaryConcatenatedRef, DictionaryMatchTable, DictionaryVersion, DictionarySnapshot, DictionaryFieldInput, DictionaryDomainInput |
| `src/features/dictionary/lib/constants.ts` | VERIFIED | Exports: DOMAIN_COLOUR_PALETTE (8 colours), UNASSIGNED_COLOUR, VALUE_TYPES, TAGGING_METHODS |
| `src/features/dictionary/lib/validators.ts` | VERIFIED | Exports: toTitleCase, validateFieldName, validateDomainName |
| `src/features/dictionary/lib/csv-parser.ts` | VERIFIED | Exports: parseMatchTableCSV, ParsedMatchTable. Uses `import Papa from "papaparse"` |
| `src/lib/constants.ts` (Dictionary nav) | VERIFIED | `enabled: true, // Phase 3` on Dictionary nav item |
| Dependencies in `package.json` | VERIFIED | react-force-graph-2d, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, @dnd-kit/modifiers, papaparse, @types/papaparse all present |
| `src/components/ui/scroll-area.tsx` | VERIFIED | Exists |
| `src/components/ui/collapsible.tsx` | VERIFIED | Exists |

#### Plan 02: Core CRUD

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/features/dictionary/actions/domain-actions.ts` | VERIFIED | `"use server"`, exports: getDictionaryDomains, createDictionaryDomain, updateDictionaryDomain, deleteDictionaryDomain, reorderDomains, getFieldCountForDomain. Handles 23505. revalidatePath("/dictionary"). |
| `src/features/dictionary/actions/field-actions.ts` | VERIFIED | `"use server"`, exports: getDictionaryFields, createDictionaryField, updateDictionaryField, deleteDictionaryField, checkMatchTableExists. Uses dictionary_field_domains junction. revalidatePath("/dictionary"). |
| `src/features/dictionary/components/domains/domain-data-table.tsx` | VERIFIED | DndContext, SortableContext, useSortable, restrictToVerticalAxis all imported and used. handleDragEnd calls onReorder prop. |
| `src/features/dictionary/components/domains/domain-form-panel.tsx` | VERIFIED | Sheet, Save Domain, Discard Changes, validateDomainName present |
| `src/features/dictionary/components/fields/field-data-table.tsx` | VERIFIED | Collapsible, domain_ids grouping, Unassigned group, ChevronDown/ChevronRight |
| `src/features/dictionary/components/fields/field-form-panel.tsx` | VERIFIED | Sheet, toTitleCase on blur, Manage Values, Configure Fields, controlled checkbox, PicklistValuesDialog, ConcatenatedFieldsDialog, MatchTableUploadDialog wired |
| `src/features/dictionary/components/dictionary-tabs.tsx` | VERIFIED | Fields, Domains, Visualisation tabs |
| `src/features/dictionary/components/dictionary-page-content.tsx` | VERIFIED | "use client", DictionaryTabs, Create Field, Add Domain, VersionDropdown, VersionBanner, DictionaryGraph, TreeView, getAllConcatenatedRefs, getAllPicklistValues |
| `src/app/(dashboard)/dictionary/page.tsx` | VERIFIED | getDictionaryDomains, getDictionaryFields, getDictionaryVersions, DictionaryPageContent. Server component with parallel data fetching. |

#### Plan 03: Values, Match Tables, Versioning

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/features/dictionary/actions/value-actions.ts` | VERIFIED | `"use server"`, exports: getPicklistValues, savePicklistValues, getConcatenatedRefs, saveConcatenatedRefs, getAllConcatenatedRefs, getAllPicklistValues |
| `src/features/dictionary/actions/match-table-actions.ts` | VERIFIED | `"use server"`, exports: getMatchTable, uploadMatchTable |
| `src/features/dictionary/actions/version-actions.ts` | VERIFIED | `"use server"`, exports: getDictionaryVersions, publishDictionaryVersion, getDictionaryVersionSnapshot. Assembles DictionarySnapshot. |
| `src/features/dictionary/lib/version-diff.ts` | VERIFIED | `export function computeVersionDiff`. Correctly separated from "use server" file per Next.js constraints. |
| `src/features/dictionary/components/fields/picklist-values-dialog.tsx` | VERIFIED | Dialog, "Picklist Values for {fieldName}", Add Value, ScrollArea |
| `src/features/dictionary/components/fields/concatenated-fields-dialog.tsx` | VERIFIED | Dialog, "Concatenated Fields for {fieldName}", "Maximum 10 concatenated fields" tooltip, Preview: |
| `src/features/dictionary/components/fields/match-table-upload-dialog.tsx` | VERIFIED | parseMatchTableCSV imported, "Drag a CSV file here", Import button |
| `src/features/dictionary/components/versioning/version-dropdown.tsx` | VERIFIED | "Publish Version", "Compare Versions", "Current Draft" |
| `src/features/dictionary/components/versioning/publish-version-dialog.tsx` | VERIFIED | "Publish Dictionary Version", label placeholder |
| `src/features/dictionary/components/versioning/version-banner.tsx` | VERIFIED | "Viewing version", "Switch to current draft", amber styling |
| `src/features/dictionary/components/versioning/diff-view-dialog.tsx` | VERIFIED | "Compare Versions", computeVersionDiff, bg-green-50, bg-red-50, bg-amber-50 |
| `src/features/dictionary/hooks/use-dictionary-version.ts` | VERIFIED | viewingVersionId, isReadOnly, viewVersion, switchToDraft, refreshVersions |

#### Plan 04: Visualisation

| Artifact | Status | Evidence |
|----------|--------|---------|
| `src/features/dictionary/hooks/use-graph-data.ts` | VERIFIED | export function useGraphData, DOMAIN_COLOUR_PALETTE, "belongs-to", "concatenated", val:20 (domains), val:8 (fields) |
| `src/features/dictionary/components/visualisation/dictionary-graph.tsx` | VERIFIED | dynamic(), "react-force-graph-2d", ssr:false, nodeCanvasObject, cooldownTicks |
| `src/features/dictionary/components/visualisation/graph-controls.tsx` | VERIFIED | onDomainFilter, "All Domains", onZoomToFit, Zoom button |
| `src/features/dictionary/components/visualisation/tree-view.tsx` | VERIFIED | Collapsible, CollapsibleTrigger, ScrollArea, "Unassigned", ChevronDown, ChevronRight |
| `src/features/dictionary/components/visualisation/presentation-view.tsx` | VERIFIED | "Back to Dictionary", "Dictionary Visualisation", DictionaryGraph, concatenatedRefs prop |
| `src/app/(dashboard)/dictionary/visualisation/page.tsx` | VERIFIED | getDictionaryDomains, getAllConcatenatedRefs, PresentationView |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `src/app/(dashboard)/dictionary/page.tsx` | `domain-actions.ts` | getDictionaryDomains() | WIRED | Line 1+8: import + call in Promise.all |
| `src/app/(dashboard)/dictionary/page.tsx` | `field-actions.ts` | getDictionaryFields() | WIRED | Line 2+9: import + call in Promise.all |
| `src/app/(dashboard)/dictionary/page.tsx` | `version-actions.ts` | getDictionaryVersions() | WIRED | Line 3+10: import + call in Promise.all |
| `dictionary-page-content.tsx` | `dictionary-tabs.tsx` | DictionaryTabs rendered | WIRED | Line 9 import, line 538 usage |
| `domain-data-table.tsx` | `domain-actions.ts` | reorderDomains via onReorder prop chain | WIRED | domain-data-table.tsx calls onReorder prop; dictionary-page-content.tsx line 34 imports reorderDomains, line 396 calls it in handleDomainReorder, line 431 passes as onReorder |
| `field-form-panel.tsx` | `picklist-values-dialog.tsx` | PicklistValuesDialog import | WIRED | Line 38 import, rendered in JSX |
| `field-form-panel.tsx` | `concatenated-fields-dialog.tsx` | ConcatenatedFieldsDialog import | WIRED | Line 39 import, rendered in JSX |
| `dictionary-graph.tsx` | `react-force-graph-2d` | dynamic import ssr:false | WIRED | Lines 16-17 |
| `use-graph-data.ts` | `constants.ts` | DOMAIN_COLOUR_PALETTE | WIRED | Line 5 import, used in node construction |
| `tree-view.tsx` | `@/components/ui/collapsible` | Collapsible components | WIRED | Lines 6-8 import |
| `src/app/(dashboard)/dictionary/visualisation/page.tsx` | `value-actions.ts` | getAllConcatenatedRefs | WIRED | Line 3 import, line 10 call |
| `dictionary-page-content.tsx` | `value-actions.ts` | getAllPicklistValues | WIRED | Lines 45-46 import, lines 134-135 calls in useEffect |
| `version-dropdown.tsx` | `version-actions.ts` | publishDictionaryVersion (via onPublish prop) | WIRED | version-dropdown receives onPublish; dictionary-page-content.tsx line 503+ wires publish via useDictionaryVersion hook |
| `diff-view-dialog.tsx` | `version-diff.ts` | computeVersionDiff | WIRED | Line 23 import, line 78 call |

---

### Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|---------|
| DD-01 | User can view taxonomy fields grouped by categories in expandable DataTable | 00, 01, 02 | SATISFIED | field-data-table.tsx groups by domain with Collapsible sections; field-data-table.test.tsx scaffold exists |
| DD-02 | User can add, edit, and delete dictionary fields | 00, 01, 02, 03 | SATISFIED | Full CRUD in field-actions.ts, field-form-panel.tsx, delete-field-dialog.tsx |
| DD-03 | Edit form is conditional on value_type | 00, 02, 03 | SATISFIED | field-form-panel.tsx shows Manage Values (Picklist), Configure Fields (Concatenated), Controlled checkbox (Picklist + match table) |
| DD-04 | User can manage categories (domains) — add, rename, reorder | 00, 01, 02 | SATISFIED | domain-actions.ts (createDomainDomain, updateDictionaryDomain, reorderDomains), domain-data-table.tsx (DndContext drag-to-reorder) |
| DD-05 | Data dictionary supports versioning | 00, 01, 03 | SATISFIED | version-actions.ts (publishDictionaryVersion, getDictionaryVersions, getDictionaryVersionSnapshot), version-diff.ts (computeVersionDiff), full versioning UI |
| DD-06 | Seed data loaded from TaxonomyDataDic.json | — | INTENTIONALLY EXCLUDED | Explicitly dropped in CONTEXT.md: "users create the dictionary from scratch after deployment". REQUIREMENTS.md shows Pending. Not a gap — a documented scope decision. |
| DD-07 | User can view visual graph of categories, fields, and hierarchies | 00, 04 | SATISFIED | dictionary-graph.tsx (force-graph), use-graph-data.ts (domains + fields + concatenated edges), /dictionary/visualisation route |
| DD-08 | Graph uses react-force-graph with colour-coded nodes | 00, 04 | SATISFIED | dynamic import of react-force-graph-2d confirmed. Nodes colour-coded by domain (DOMAIN_COLOUR_PALETTE) per CONTEXT.md spec, which supersedes the original "by value_type" wording in REQUIREMENTS.md |
| DD-09 | Alternative table/tree view available alongside graph | 00, 04 | SATISFIED | tree-view.tsx with Collapsible hierarchy; segmented Graph/Tree control in dictionary-page-content.tsx |

**Note on DD-06:** REQUIREMENTS.md still shows DD-06 as `[ ] Pending`. This is intentional — the requirement was descoped in the CONTEXT.md research phase before any plans were written. It remains as a future backlog item, not an oversight.

**Note on DD-08 colour-coding:** REQUIREMENTS.md says "colour-coded nodes by value_type" but CONTEXT.md (which supersedes original requirements) specifies "Nodes colour-coded by domain". The implementation follows the CONTEXT.md specification, which is correct.

---

### Anti-Patterns Found

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| All implementation files | None found | — | No TODO/FIXME/HACK/placeholder stubs in implementation files |
| `domain-data-table.tsx` line 211 | `header.isPlaceholder` | Info | TanStack Table API usage, not a stub indicator |
| `validators.ts` lines 23, 37 | `return null` | Info | Correct: returns null = no validation error |
| `dictionary-page-content.tsx` lines 361, 370 | `return {}` | Info | Correct: success response shape from mutation handlers |

No blocker anti-patterns found.

---

### Human Verification Required

All automated checks pass. The following items require live browser testing against a running Supabase instance:

#### 1. Grouped DataTable with Collapsible Domain Sections

**Test:** Navigate to `/dictionary`. Create 2 domains and 3 fields assigned to different domains. Verify fields appear grouped under domain headers with collapse/expand toggle.
**Expected:** Domain header rows with colour dot, field count badge, and chevron. Click header to collapse — field rows hidden. Click again — field rows visible.
**Why human:** Interactive Collapsible DOM behaviour requires browser rendering.

#### 2. Picklist Value Persistence Round-Trip

**Test:** Create a Picklist field. Click "Manage Values", add 3 values with definitions, click Done. Close and reopen the field.
**Expected:** "Manage Values (3)" shown on reopen. Values persist in Supabase `dictionary_picklist_values` table.
**Why human:** Requires live Supabase connection and auth session.

#### 3. Concatenated Field Configuration

**Test:** Create a Concatenated field with 2 fields selected. Verify Preview shows "Field1 | Field2". Save, reopen.
**Expected:** Refs persisted in `dictionary_concatenated_refs`. 10-field maximum enforced.
**Why human:** Ordered state management and database persistence require live testing.

#### 4. Match Table CSV Upload

**Test:** Upload a multi-column CSV to a Picklist field's match table. Confirm drop zone styling, first 5 rows preview, and Import button state.
**Expected:** File parsed by papaparse, column headers extracted, preview table rendered, Import enabled post-parse.
**Why human:** Browser file drag-and-drop and papaparse CSV parsing require real browser context.

#### 5. Drag-to-Reorder Domains

**Test:** Create 3 domains. Drag the third domain to the first position. Refresh the page.
**Expected:** New order persists — Supabase `display_order` values updated.
**Why human:** dnd-kit mouse drag interaction only verifiable in browser.

#### 6. Version Publish and Read-Only Mode

**Test:** Publish a version with label "Test version". Click it in the version dropdown.
**Expected:** Amber banner "Viewing version v1 — Test version". All edit controls disabled. "Switch to current draft" exits read-only mode.
**Why human:** React state management with isReadOnly propagation and banner rendering require browser session.

#### 7. Side-by-Side Version Diff

**Test:** Publish 2 versions with different fields. Open Compare Versions, select both. Verify diff highlights.
**Expected:** Green rows for fields added in V2, red for removed, amber for changed. Domain changes section above.
**Why human:** Requires 2 published versions with real data in Supabase.

#### 8. Force Graph Rendering

**Test:** Navigate to Visualisation tab with data. Confirm graph loads (no SSR error), nodes appear colour-coded, concatenated edges show as dashed lines.
**Expected:** react-force-graph-2d canvas renders. Domain nodes larger than field nodes. Domain filter and search operational.
**Why human:** Canvas rendering via dynamic import only verifiable in browser. SSR-safe guard only testable at runtime.

#### 9. Presentation View and PNG Export

**Test:** Navigate to `/dictionary/visualisation`. Confirm graph renders full-screen, Back to Dictionary link works, Export PNG downloads an image.
**Expected:** Route loads PresentationView with concatenated edges. PNG download triggered by Export button.
**Why human:** Full-page route and canvas-to-PNG conversion require browser.

---

### Summary

Phase 03 Data Dictionary is **fully implemented at the code level**. All 4 observable truths are verified: the DataTable structure, CRUD/form logic, visualisation components, and versioning system are all present, substantive, and correctly wired.

**Infrastructure verified:**
- 7-table database schema (migration SQL present; confirmed executed by user in Plan 01)
- All TypeScript contracts match database columns
- All dependencies installed (react-force-graph-2d, dnd-kit suite, papaparse)
- Dictionary nav enabled

**CRUD layer verified:**
- Domain and field server actions with tenant scoping, duplicate handling, revalidatePath
- Field-domain junction table correctly managed on create/update/delete
- Domain drag-to-reorder correctly wired through component prop chain to server action

**Value management verified:**
- Picklist values, concatenated refs, match table upload all implemented
- getAllConcatenatedRefs and getAllPicklistValues correctly consumed by visualisation layer
- computeVersionDiff extracted to version-diff.ts (correct Next.js server action architecture)

**Versioning verified:**
- publishDictionaryVersion assembles full DictionarySnapshot JSONB
- Version dropdown, banner, publish dialog, diff view all fully wired into page

**Visualisation verified:**
- SSR-safe dynamic import of react-force-graph-2d
- useGraphData hook produces correct node/link format with domain colours
- Tree view uses Collapsible hierarchy with ScrollArea
- Presentation view at /dictionary/visualisation fetches concatenated refs for graph edges

**DD-06 (seed data) is intentionally out of scope** — documented in CONTEXT.md as dropped, with users creating the dictionary from scratch.

All 9 items requiring human verification relate to runtime behaviour (database round-trips, drag interactions, canvas rendering) that cannot be verified programmatically against the source files alone.

---

_Verified: 2026-03-19T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
