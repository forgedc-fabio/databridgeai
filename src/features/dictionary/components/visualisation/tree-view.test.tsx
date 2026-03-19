import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { TreeView } from "./tree-view";
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
  picklistValues: {},
  onFieldClick: vi.fn(),
};

describe("TreeView — domain nodes", () => {
  it("renders domain name at root level", () => {
    const domains = [makeDomain("d1", "Campaign", 0)];
    const fields = [makeField("f1", "Brand Name", ["d1"])];

    render(<TreeView {...defaultProps} domains={domains} fields={fields} />);

    expect(screen.getByText("Campaign")).toBeDefined();
  });

  it("renders multiple domain names", () => {
    const domains = [makeDomain("d1", "Campaign", 0), makeDomain("d2", "Media", 1)];

    render(<TreeView {...defaultProps} domains={domains} fields={[]} />);

    expect(screen.getByText("Campaign")).toBeDefined();
    expect(screen.getByText("Media")).toBeDefined();
  });
});

describe("TreeView — field nodes under domains", () => {
  it("renders field names under their assigned domain", () => {
    const domains = [makeDomain("d1", "Campaign", 0)];
    const fields = [makeField("f1", "Brand Name", ["d1"])];

    render(<TreeView {...defaultProps} domains={domains} fields={fields} />);

    expect(screen.getByText("Brand Name")).toBeDefined();
  });
});

describe("TreeView — Unassigned group", () => {
  it("renders Unassigned node for orphan fields", () => {
    const fields = [makeField("f1", "Orphan Field", [])];

    render(<TreeView {...defaultProps} domains={[]} fields={fields} />);

    expect(screen.getByText("Unassigned")).toBeDefined();
    expect(screen.getByText("Orphan Field")).toBeDefined();
  });
});
