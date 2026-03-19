import { describe, it, expect } from "vitest";

describe("useGraphData", () => {
  it("scaffold — replace with real tests", () => {
    expect(true).toBe(true);
  });

  // Test plan:
  // - Transforms domains to domain nodes with colour from DOMAIN_COLOUR_PALETTE
  // - Transforms fields to field nodes with domain colour at 60% opacity
  // - Creates belongs-to links from fields to their domains
  // - Creates concatenated links between concatenated fields
  // - Unassigned fields get UNASSIGNED_COLOUR
  // - Domain nodes are larger (val: 20) than field nodes (val: 8)
});
