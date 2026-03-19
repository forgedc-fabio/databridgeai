---
status: testing
phase: 02-ontology-management
source: [02-00-SUMMARY.md, 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md]
started: 2026-03-19T08:00:00Z
updated: 2026-03-19T08:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  Kill any running dev server. Run `pnpm dev`. App boots without errors. Navigate to http://localhost:3000 — the dashboard loads. Sign in if prompted. No console errors on initial load.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Run `pnpm dev`. App boots without errors. Navigate to http://localhost:3000 — the dashboard loads. Sign in if prompted. No console errors on initial load.
result: [pending]

### 2. Ontology Nav Item
expected: Sidebar shows "Ontology" link with an icon. Clicking it navigates to /ontology. The page loads without error.
result: [pending]

### 3. Ontology Page Tabs
expected: The ontology page shows three tabs — Classes, Relationships, Graph — each with a Lucide icon. Classes tab is active by default.
result: [pending]

### 4. Empty State
expected: With no classes in the database, the Classes tab shows an empty state with "Create your first ontology class" message and a CTA button.
result: [pending]

### 5. Create Ontology Class
expected: Click "Create Class". A side panel (sheet) opens from the right. Fill in name (required), description, select a domain group, optionally add custom attributes. Submit. The panel closes, a success toast appears, and the new class appears in the DataTable.
result: [pending]

### 6. Class DataTable
expected: After creating classes, the DataTable shows columns: name, domain (as badge), description (truncated), properties count, and last updated (relative time). Columns are sortable. Row actions dropdown has Edit and Delete options.
result: [pending]

### 7. Edit Ontology Class
expected: Click the row action dropdown on a class → Edit. The side panel opens pre-filled with the class data. Modify a field, save. Toast confirms update, DataTable reflects the change.
result: [pending]

### 8. Delete Ontology Class
expected: Click the row action dropdown → Delete. A confirmation dialog appears showing how many relationships will be affected. Confirm deletion. Toast confirms, class is removed from the DataTable.
result: [pending]

### 9. Relationships Tab
expected: Switch to the Relationships tab. A DataTable is shown with columns: source class, relationship type (as badge), target class, and created date. Filter dropdowns for class and type are visible above the table.
result: [pending]

### 10. Create Relationship
expected: Click "Add Relationship". A dialog form opens with three dropdowns: source class, relationship type, target class. Select values and submit. The new relationship appears in the DataTable. Success toast shown.
result: [pending]

### 11. Custom Relationship Type
expected: In the relationship form dialog, below the type dropdown, there is an input field with a "+" button to create a new relationship type inline. Type a name, click "+", the new type appears in the dropdown and can be selected.
result: [pending]

### 12. Circular Hierarchy Prevention
expected: Create two classes (A and B). Create an is-a relationship from A to B. Then try to create an is-a relationship from B to A. An error message appears indicating a circular hierarchy would be created. The relationship is not saved.
result: [pending]

### 13. Graph Visualisation
expected: Switch to the Graph tab. A Cytoscape graph renders with classes as nodes (coloured by domain) and relationships as edges. Layout is hierarchical (top-down dagre). Hovering a node highlights it and dims others.
result: [pending]

### 14. Graph Controls
expected: Above the graph: a domain filter dropdown filters nodes by domain group. A search field with autocomplete finds and centres on a class. A "Zoom to Fit" button resets the viewport. An expand/collapse toggle hides/shows subtrees.
result: [pending]

### 15. Graph Export
expected: PNG and SVG export buttons are visible. Clicking PNG downloads a .png file of the graph. Clicking SVG downloads a .svg file. Both files contain the rendered graph.
result: [pending]

### 16. Presentation View
expected: Navigate to /ontology/visualisation. A full-viewport read-only graph is displayed with minimal toolbar and a "Back to Editor" link. No edit controls visible.
result: [pending]

### 17. Sync Button and Stale Indicator
expected: The ontology page header shows a "Sync to Cognee" button. After creating or modifying a class, an amber dot appears on the button indicating stale data. Note: sync may fail due to Cloud Run auth — just verify the button, stale indicator, and that clicking triggers a loading spinner.
result: [pending]

## Summary

total: 17
passed: 0
issues: 0
pending: 17
skipped: 0

## Gaps

[none yet]
