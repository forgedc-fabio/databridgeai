import { describe, it, expect } from "vitest";

describe("value-actions", () => {
  it("scaffold — replace with real tests", () => {
    expect(true).toBe(true);
  });

  // Test plan:
  // - getPicklistValues returns values for a field_id ordered by display_order
  // - savePicklistValues upserts values (insert new, remove deleted)
  // - getConcatenatedRefs returns referenced field_ids in position order
  // - saveConcatenatedRefs replaces all refs for a field
  // - uploadMatchTable parses CSV and stores in dictionary_match_tables
  // - getMatchTable returns match table data for a field
});
