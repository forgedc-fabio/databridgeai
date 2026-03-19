import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock server actions called inside FieldFormPanel
vi.mock("../../actions/value-actions", () => ({
  getPicklistValues: vi.fn().mockResolvedValue({ data: [] }),
  getConcatenatedRefs: vi.fn().mockResolvedValue({ data: [] }),
  savePicklistValues: vi.fn().mockResolvedValue({ data: true }),
  saveConcatenatedRefs: vi.fn().mockResolvedValue({ data: true }),
  getAllPicklistValues: vi.fn().mockResolvedValue({ data: [] }),
  getAllConcatenatedRefs: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../actions/match-table-actions", () => ({
  uploadMatchTable: vi.fn().mockResolvedValue({ data: true }),
  getMatchTable: vi.fn().mockResolvedValue({ data: null }),
}));

// Mock the nested dialogs to keep tests simple
vi.mock("./picklist-values-dialog", () => ({
  PicklistValuesDialog: () => <div data-testid="picklist-dialog" />,
}));

vi.mock("./concatenated-fields-dialog", () => ({
  ConcatenatedFieldsDialog: () => <div data-testid="concat-dialog" />,
}));

vi.mock("./match-table-upload-dialog", () => ({
  MatchTableUploadDialog: () => <div data-testid="match-table-dialog" />,
}));

import { FieldFormPanel } from "./field-form-panel";
import type { DictionaryFieldWithDomains } from "../../types/dictionary";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  editingField: null as DictionaryFieldWithDomains | null,
  domains: [],
  allFields: [],
  onSave: vi.fn().mockResolvedValue({}),
  matchTableExists: false,
};

describe("FieldFormPanel — title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Create Field title when editingField is null", () => {
    render(<FieldFormPanel {...defaultProps} editingField={null} />);
    expect(screen.getByText("Create Field")).toBeDefined();
  });

  it("renders Edit Field title when editingField is provided", () => {
    const editingField: DictionaryFieldWithDomains = {
      id: "f1",
      tenant_id: "t1",
      field_name: "Campaign Name",
      field_definition: null,
      value_type: "Text",
      tagging_method: "Sourced",
      ai_instruction: null,
      controlled: false,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      created_by: null,
      domain_ids: [],
      domain_names: [],
    };

    render(<FieldFormPanel {...defaultProps} editingField={editingField} />);
    expect(screen.getByText("Edit Field")).toBeDefined();
  });
});

describe("FieldFormPanel — Manage Values button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Manage Values button when editing a Picklist field", async () => {
    const picklistField: DictionaryFieldWithDomains = {
      id: "f1",
      tenant_id: "t1",
      field_name: "Status",
      field_definition: null,
      value_type: "Picklist",
      tagging_method: "Sourced",
      ai_instruction: null,
      controlled: false,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      created_by: null,
      domain_ids: [],
      domain_names: [],
    };

    render(<FieldFormPanel {...defaultProps} editingField={picklistField} />);

    // Manage Values button appears for Picklist fields
    const button = screen.queryByText(/Manage Values/i);
    expect(button).not.toBeNull();
  });

  it("does not show Manage Values button for a Text field", () => {
    const textField: DictionaryFieldWithDomains = {
      id: "f2",
      tenant_id: "t1",
      field_name: "Description",
      field_definition: null,
      value_type: "Text",
      tagging_method: "Sourced",
      ai_instruction: null,
      controlled: false,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      created_by: null,
      domain_ids: [],
      domain_names: [],
    };

    render(<FieldFormPanel {...defaultProps} editingField={textField} />);

    const button = screen.queryByText(/Manage Values/i);
    expect(button).toBeNull();
  });
});
