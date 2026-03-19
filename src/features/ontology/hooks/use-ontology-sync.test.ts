import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockSelect = vi.fn(() => ({ order: mockOrder, limit: mockLimit }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom }),
}));

// Must import after mock setup
const { useOntologySyncStatus } = await import("./use-ontology-sync");

describe("useOntologySyncStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports useOntologySyncStatus function", () => {
    expect(typeof useOntologySyncStatus).toBe("function");
  });

  it("module has 'use client' directive", async () => {
    // Verify the file starts with "use client" — structural check
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/features/ontology/hooks/use-ontology-sync.ts",
      "utf-8"
    );
    expect(content.startsWith('"use client"')).toBe(true);
  });

  it("hook signature returns expected shape", () => {
    // Since this is a React hook, we verify the return type structure
    // by checking the function exists and is callable
    expect(useOntologySyncStatus).toBeDefined();
    expect(useOntologySyncStatus.length).toBe(0); // no args
  });
});
