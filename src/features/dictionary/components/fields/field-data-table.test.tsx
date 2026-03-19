import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock dnd-kit to avoid jsdom pointer event limitations
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

import { FieldDataTable } from "./field-data-table";
import type { DictionaryDomain, DictionaryFieldWithDomains } from "../../types/dictionary";

function makeDomain(id: string, name: string, displayOrder = 0): DictionaryDomain {
  return {
    id,
    tenant_id: "t1",
    name,
    description: null,
    domain_area: null,
    owner: null,
    display_order: displayOrder,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

function makeField(
  id: string,
  name: string,
  domainIds: string[] = []
): DictionaryFieldWithDomains {
  return {
    id,
    tenant_id: "t1",
    field_name: name,
    field_definition: null,
    value_type: "Text",
    tagging_method: "Sourced",
    ai_instruction: null,
    controlled: false,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    created_by: null,
    domain_ids: domainIds,
    domain_names: domainIds,
  };
}

const defaultProps = {
  onRowClick: vi.fn(),
  onDelete: vi.fn(),
  editingFieldId: null,
};

describe("FieldDataTable — domain group headers", () => {
  it("renders domain group name as a collapsible trigger", () => {
    const domains = [makeDomain("d1", "Campaign", 0)];
    const fields = [makeField("f1", "Brand Name", ["d1"])];

    render(<FieldDataTable {...defaultProps} fields={fields} domains={domains} />);

    expect(screen.getByText("Campaign")).toBeDefined();
  });

  it("renders field names under their domain group", () => {
    const domains = [makeDomain("d1", "Campaign", 0)];
    const fields = [makeField("f1", "Brand Name", ["d1"])];

    render(<FieldDataTable {...defaultProps} fields={fields} domains={domains} />);

    expect(screen.getByText("Brand Name")).toBeDefined();
  });
});

describe("FieldDataTable — Unassigned group", () => {
  it("renders Unassigned group header for fields with no domain assignment", () => {
    const fields = [makeField("f1", "Orphan Field", [])];

    render(<FieldDataTable {...defaultProps} fields={fields} domains={[]} />);

    // The group header cell contains "Unassigned" as the bold/semibold label
    const unassignedElements = screen.getAllByText("Unassigned");
    expect(unassignedElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Orphan Field")).toBeDefined();
  });

  it("does not render Unassigned group when all fields have domain assignments", () => {
    const domains = [makeDomain("d1", "Campaign", 0)];
    const fields = [makeField("f1", "Brand Name", ["d1"])];

    render(<FieldDataTable {...defaultProps} fields={fields} domains={domains} />);

    expect(screen.queryByText("Unassigned")).toBeNull();
  });
});

describe("FieldDataTable — empty state", () => {
  it("renders only the header row when both fields and domains lists are empty", () => {
    render(<FieldDataTable {...defaultProps} fields={[]} domains={[]} />);

    // The table header row is always present; no data rows rendered
    const rows = screen.getAllByRole("row");
    // Only the header row should exist (no domain group rows, no field rows)
    expect(rows).toHaveLength(1);
  });
});
