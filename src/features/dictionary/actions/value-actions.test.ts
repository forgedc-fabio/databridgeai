import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("getPicklistValues", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns picklist values for a field_id", async () => {
    const mockValues = [
      { id: "pv1", field_id: "f1", tenant_id: "t1", value: "Option A", definition: null, display_order: 0 },
      { id: "pv2", field_id: "f1", tenant_id: "t1", value: "Option B", definition: "B desc", display_order: 1 },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockValues, error: null }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getPicklistValues } = await import("./value-actions");
    const result = await getPicklistValues("f1");

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].value).toBe("Option A");
      expect(result.data[1].value).toBe("Option B");
    }
  });

  it("returns error when Supabase query fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: "Query failed" } }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getPicklistValues } = await import("./value-actions");
    const result = await getPicklistValues("f1");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Query failed");
    }
  });
});

describe("savePicklistValues", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { savePicklistValues } = await import("./value-actions");
    const result = await savePicklistValues("f1", [{ value: "A" }]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("getConcatenatedRefs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns concatenated refs for a field_id", async () => {
    const mockRefs = [
      { id: "cr1", field_id: "f1", referenced_field_id: "f2", tenant_id: "t1", position: 0 },
      { id: "cr2", field_id: "f1", referenced_field_id: "f3", tenant_id: "t1", position: 1 },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRefs, error: null }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getConcatenatedRefs } = await import("./value-actions");
    const result = await getConcatenatedRefs("f1");

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].referenced_field_id).toBe("f2");
      expect(result.data[0].position).toBe(0);
    }
  });

  it("returns error when Supabase query fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: "Refs query failed" } }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getConcatenatedRefs } = await import("./value-actions");
    const result = await getConcatenatedRefs("f1");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Refs query failed");
    }
  });
});

describe("saveConcatenatedRefs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns error when user is not authenticated", async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { saveConcatenatedRefs } = await import("./value-actions");
    const result = await saveConcatenatedRefs("f1", [{ referencedFieldId: "f2", position: 0 }]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});
