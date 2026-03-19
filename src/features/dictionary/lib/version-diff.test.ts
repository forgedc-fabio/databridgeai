import { describe, it, expect } from "vitest";
import { computeVersionDiff } from "./version-diff";
import type { DictionarySnapshot } from "../types/dictionary";

// Helper to build a minimal snapshot field
function makeField(
  id: string,
  overrides: Partial<DictionarySnapshot["fields"][number]> = {}
): DictionarySnapshot["fields"][number] {
  return {
    id,
    field_name: `Field ${id}`,
    field_definition: null,
    value_type: "Text",
    tagging_method: "Sourced",
    ai_instruction: null,
    controlled: false,
    domain_ids: [],
    ...overrides,
  };
}

// Helper to build a minimal snapshot domain
function makeDomain(
  id: string,
  name = `Domain ${id}`
): DictionarySnapshot["domains"][number] {
  return {
    id,
    name,
    description: null,
    domain_area: null,
    owner: null,
    display_order: 0,
  };
}

const emptySnapshot: DictionarySnapshot = { domains: [], fields: [] };

describe("computeVersionDiff — added fields", () => {
  it("identifies fields present in B but not in A as added", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("field-1")],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("field-1"), makeField("field-2")],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.added).toHaveLength(1);
    expect(result.added[0].id).toBe("field-2");
  });

  it("returns empty added array when B has no new fields", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("field-1")],
    };
    const result = computeVersionDiff(snapshotA, snapshotA);
    expect(result.added).toHaveLength(0);
  });
});

describe("computeVersionDiff — removed fields", () => {
  it("identifies fields present in A but not in B as removed", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("field-1"), makeField("field-2")],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("field-1")],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.removed).toHaveLength(1);
    expect(result.removed[0].id).toBe("field-2");
  });
});

describe("computeVersionDiff — changed fields", () => {
  it("detects field_name change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { field_name: "Old Name" })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { field_name: "New Name" })],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].field.id).toBe("f1");
    expect(result.changed[0].changes.some((c) => c.includes("field_name"))).toBe(true);
  });

  it("detects value_type change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { value_type: "Text" })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { value_type: "Picklist" })],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changes.some((c) => c.includes("value_type"))).toBe(true);
  });

  it("detects controlled flag change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { controlled: false })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { controlled: true })],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changes.some((c) => c.includes("controlled"))).toBe(true);
  });

  it("detects domain assignment change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { domain_ids: ["d1"] })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { domain_ids: ["d1", "d2"] })],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changes.some((c) => c.includes("domain"))).toBe(true);
  });

  it("detects picklist_values count change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { picklist_values: [{ value: "A", definition: null }] })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [
        makeField("f1", {
          picklist_values: [
            { value: "A", definition: null },
            { value: "B", definition: null },
          ],
        }),
      ],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changes.some((c) => c.includes("picklist_values"))).toBe(true);
  });

  it("detects concatenated_field_ids change", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { concatenated_field_ids: ["f2"] })],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1", { concatenated_field_ids: ["f2", "f3"] })],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].changes.some((c) => c.includes("concatenated"))).toBe(true);
  });

  it("returns no changed entries when fields are identical", () => {
    const snapshot: DictionarySnapshot = {
      domains: [],
      fields: [makeField("f1")],
    };

    const result = computeVersionDiff(snapshot, snapshot);

    expect(result.changed).toHaveLength(0);
  });
});

describe("computeVersionDiff — domain changes", () => {
  it("identifies domains in B not in A as added", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [makeDomain("d1")],
      fields: [],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [makeDomain("d1"), makeDomain("d2")],
      fields: [],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.domainChanges.added).toHaveLength(1);
    expect(result.domainChanges.added[0].id).toBe("d2");
  });

  it("identifies domains in A not in B as removed", () => {
    const snapshotA: DictionarySnapshot = {
      domains: [makeDomain("d1"), makeDomain("d2")],
      fields: [],
    };
    const snapshotB: DictionarySnapshot = {
      domains: [makeDomain("d1")],
      fields: [],
    };

    const result = computeVersionDiff(snapshotA, snapshotB);

    expect(result.domainChanges.removed).toHaveLength(1);
    expect(result.domainChanges.removed[0].id).toBe("d2");
  });
});

describe("computeVersionDiff — empty snapshots", () => {
  it("returns empty diff for two empty snapshots", () => {
    const result = computeVersionDiff(emptySnapshot, emptySnapshot);

    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
    expect(result.domainChanges.added).toHaveLength(0);
    expect(result.domainChanges.removed).toHaveLength(0);
  });
});
