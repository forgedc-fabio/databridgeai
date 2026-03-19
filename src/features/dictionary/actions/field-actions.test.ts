import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("getDictionaryFields", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns field list with domain assignments", async () => {
    const mockFields = [
      {
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
      },
    ];
    const mockFieldDomains = [{ field_id: "f1", domain_id: "d1" }];
    const mockDomains = [{ id: "d1", name: "Campaign" }];

    const mockFrom = vi.fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockFields, error: null }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: mockFieldDomains, error: null }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({ data: mockDomains, error: null }),
      });

    mockCreateClient.mockResolvedValue({ from: mockFrom } as never);

    const { getDictionaryFields } = await import("./field-actions");
    const result = await getDictionaryFields();

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].field_name).toBe("Campaign Name");
      expect(result.data[0].domain_ids).toEqual(["d1"]);
      expect(result.data[0].domain_names).toEqual(["Campaign"]);
    }
  });

  it("returns error when fields query fails", async () => {
    const mockFrom = vi.fn().mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      }),
    });

    mockCreateClient.mockResolvedValue({ from: mockFrom } as never);

    const { getDictionaryFields } = await import("./field-actions");
    const result = await getDictionaryFields();

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("DB error");
    }
  });
});

describe("createDictionaryField", () => {
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

    const { createDictionaryField } = await import("./field-actions");
    const result = await createDictionaryField({
      fieldName: "Campaign Name",
      valueType: "Text",
      taggingMethod: "Sourced",
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("updateDictionaryField", () => {
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

    const { updateDictionaryField } = await import("./field-actions");
    const result = await updateDictionaryField("f1", {
      fieldName: "Updated Name",
      valueType: "Text",
      taggingMethod: "Sourced",
    });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("deleteDictionaryField", () => {
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

    const { deleteDictionaryField } = await import("./field-actions");
    const result = await deleteDictionaryField("f1");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});
