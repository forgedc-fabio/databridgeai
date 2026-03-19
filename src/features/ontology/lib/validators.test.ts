import { describe, it, expect } from "vitest";
import { detectCircularHierarchy } from "./validators";

describe("detectCircularHierarchy", () => {
  const classNameMap = new Map<string, string>([
    ["a", "Animal"],
    ["b", "Bird"],
    ["c", "Crow"],
    ["d", "Dog"],
  ]);

  it("returns { circular: false } for a valid hierarchy (no cycle)", () => {
    // Existing: Bird is-a Animal
    // Proposed: Crow is-a Bird (valid chain: Crow -> Bird -> Animal)
    const existing = [{ source_class_id: "b", target_class_id: "a" }];
    const result = detectCircularHierarchy("c", "b", existing, classNameMap);
    expect(result.circular).toBe(false);
  });

  it("returns { circular: true, path } for a direct cycle (A is-a B, B is-a A)", () => {
    // Existing: Bird is-a Animal
    // Proposed: Animal is-a Bird (creates cycle)
    const existing = [{ source_class_id: "b", target_class_id: "a" }];
    const result = detectCircularHierarchy("a", "b", existing, classNameMap);
    expect(result.circular).toBe(true);
    if (result.circular) {
      expect(result.path).toContain("Animal");
      expect(result.path).toContain("Bird");
    }
  });

  it("returns { circular: true, path } for a transitive cycle (A is-a B, B is-a C, C is-a A)", () => {
    // Existing: Bird is-a Animal, Crow is-a Bird
    // Proposed: Animal is-a Crow (creates cycle: Animal -> Crow -> Bird -> Animal)
    const existing = [
      { source_class_id: "b", target_class_id: "a" },
      { source_class_id: "c", target_class_id: "b" },
    ];
    const result = detectCircularHierarchy("a", "c", existing, classNameMap);
    expect(result.circular).toBe(true);
    if (result.circular) {
      expect(result.path).toContain("Animal");
      expect(result.path).toContain("Crow");
      expect(result.path).toContain("Bird");
    }
  });

  it("handles single-node self-reference", () => {
    const result = detectCircularHierarchy("a", "a", [], classNameMap);
    expect(result.circular).toBe(true);
    if (result.circular) {
      expect(result.path).toEqual(["Animal", "Animal"]);
    }
  });

  it("returns human-readable class names in path", () => {
    // Existing: Bird is-a Animal
    // Proposed: Animal is-a Bird (cycle)
    const existing = [{ source_class_id: "b", target_class_id: "a" }];
    const result = detectCircularHierarchy("a", "b", existing, classNameMap);
    expect(result.circular).toBe(true);
    if (result.circular) {
      // All entries should be human-readable names, not IDs
      for (const entry of result.path) {
        expect(["Animal", "Bird", "Crow", "Dog"]).toContain(entry);
      }
    }
  });

  it("returns { circular: false } for independent branches", () => {
    // Existing: Bird is-a Animal
    // Proposed: Dog is-a Animal (no conflict, different branch)
    const existing = [{ source_class_id: "b", target_class_id: "a" }];
    const result = detectCircularHierarchy("d", "a", existing, classNameMap);
    expect(result.circular).toBe(false);
  });

  it("returns { circular: false } when no existing relationships", () => {
    const result = detectCircularHierarchy("a", "b", [], classNameMap);
    expect(result.circular).toBe(false);
  });

  it("falls back to class ID when name is not in map", () => {
    const sparseMap = new Map<string, string>([["a", "Animal"]]);
    const result = detectCircularHierarchy("unknown-id", "unknown-id", [], sparseMap);
    expect(result.circular).toBe(true);
    if (result.circular) {
      expect(result.path).toEqual(["unknown-id", "unknown-id"]);
    }
  });
});
