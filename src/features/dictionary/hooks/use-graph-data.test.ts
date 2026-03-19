import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGraphData } from "./use-graph-data";
import { DOMAIN_COLOUR_PALETTE, UNASSIGNED_COLOUR } from "../lib/constants";
import type {
  DictionaryDomain,
  DictionaryFieldWithDomains,
  DictionaryConcatenatedRef,
} from "../types/dictionary";

function makeDomain(id: string, displayOrder = 0): DictionaryDomain {
  return {
    id,
    tenant_id: "tenant-1",
    name: `Domain ${id}`,
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
  domainIds: string[] = []
): DictionaryFieldWithDomains {
  return {
    id,
    tenant_id: "tenant-1",
    field_name: `Field ${id}`,
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

describe("useGraphData — domain nodes", () => {
  it("transforms domains into nodes with type domain", () => {
    const domains = [makeDomain("d1")];
    const { result } = renderHook(() => useGraphData(domains, [], []));

    const domainNode = result.current.nodes.find((n) => n.id === "domain-d1");
    expect(domainNode).toBeDefined();
    expect(domainNode?.type).toBe("domain");
  });

  it("assigns val: 20 to domain nodes", () => {
    const domains = [makeDomain("d1")];
    const { result } = renderHook(() => useGraphData(domains, [], []));

    const domainNode = result.current.nodes.find((n) => n.id === "domain-d1");
    expect(domainNode?.val).toBe(20);
  });

  it("assigns colour from DOMAIN_COLOUR_PALETTE by display_order position", () => {
    const domains = [makeDomain("d1", 0), makeDomain("d2", 1)];
    const { result } = renderHook(() => useGraphData(domains, [], []));

    const node1 = result.current.nodes.find((n) => n.id === "domain-d1");
    const node2 = result.current.nodes.find((n) => n.id === "domain-d2");

    expect(node1?.colour).toBe(DOMAIN_COLOUR_PALETTE[0]);
    expect(node2?.colour).toBe(DOMAIN_COLOUR_PALETTE[1]);
  });
});

describe("useGraphData — field nodes", () => {
  it("transforms fields into nodes with type field", () => {
    const fields = [makeField("f1")];
    const { result } = renderHook(() => useGraphData([], fields, []));

    const fieldNode = result.current.nodes.find((n) => n.id === "field-f1");
    expect(fieldNode).toBeDefined();
    expect(fieldNode?.type).toBe("field");
  });

  it("assigns val: 8 to field nodes", () => {
    const fields = [makeField("f1")];
    const { result } = renderHook(() => useGraphData([], fields, []));

    const fieldNode = result.current.nodes.find((n) => n.id === "field-f1");
    expect(fieldNode?.val).toBe(8);
  });

  it("assigns UNASSIGNED_COLOUR to fields with no domain_ids", () => {
    const fields = [makeField("f1", [])];
    const { result } = renderHook(() => useGraphData([], fields, []));

    const fieldNode = result.current.nodes.find((n) => n.id === "field-f1");
    expect(fieldNode?.colour).toBe(UNASSIGNED_COLOUR);
  });

  it("assigns domain colour with 99 opacity suffix to assigned fields", () => {
    const domains = [makeDomain("d1", 0)];
    const fields = [makeField("f1", ["d1"])];
    const { result } = renderHook(() => useGraphData(domains, fields, []));

    const fieldNode = result.current.nodes.find((n) => n.id === "field-f1");
    expect(fieldNode?.colour).toBe(DOMAIN_COLOUR_PALETTE[0] + "99");
  });
});

describe("useGraphData — links", () => {
  it("creates belongs-to links from each field to each assigned domain", () => {
    const domains = [makeDomain("d1")];
    const fields = [makeField("f1", ["d1"])];
    const { result } = renderHook(() => useGraphData(domains, fields, []));

    const belongsToLinks = result.current.links.filter(
      (l) => l.type === "belongs-to"
    );

    expect(belongsToLinks).toHaveLength(1);
    expect(belongsToLinks[0].source).toBe("field-f1");
    expect(belongsToLinks[0].target).toBe("domain-d1");
  });

  it("creates multiple belongs-to links for fields assigned to multiple domains", () => {
    const domains = [makeDomain("d1"), makeDomain("d2", 1)];
    const fields = [makeField("f1", ["d1", "d2"])];
    const { result } = renderHook(() => useGraphData(domains, fields, []));

    const belongsToLinks = result.current.links.filter(
      (l) => l.type === "belongs-to"
    );

    expect(belongsToLinks).toHaveLength(2);
  });

  it("creates concatenated links from concatenated refs", () => {
    const refs: DictionaryConcatenatedRef[] = [
      {
        id: "ref-1",
        field_id: "f1",
        referenced_field_id: "f2",
        tenant_id: "tenant-1",
        position: 0,
      },
    ];
    const { result } = renderHook(() => useGraphData([], [], refs));

    const concatLinks = result.current.links.filter(
      (l) => l.type === "concatenated"
    );

    expect(concatLinks).toHaveLength(1);
    expect(concatLinks[0].source).toBe("field-f1");
    expect(concatLinks[0].target).toBe("field-f2");
  });

  it("returns no links when no domains, fields, or refs", () => {
    const { result } = renderHook(() => useGraphData([], [], []));

    expect(result.current.links).toHaveLength(0);
  });
});
