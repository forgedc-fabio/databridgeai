import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

function buildSupabaseChain(returnValue: { data?: unknown; error?: unknown; count?: number }) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    maybeSingle: vi.fn().mockResolvedValue(returnValue),
    head: vi.fn().mockReturnThis(),
  };
  return chain;
}

function buildSupabase(returnValue: { data?: unknown; error?: unknown; count?: number }) {
  const chain = buildSupabaseChain(returnValue);
  const resolved = Promise.resolve(returnValue);

  // Make most chain terminators return the resolved value
  (chain.from as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    ...chain,
    select: vi.fn().mockImplementation(() => ({
      ...chain,
      order: vi.fn().mockResolvedValue(returnValue),
      eq: vi.fn().mockImplementation(() => ({
        ...chain,
        order: vi.fn().mockImplementation(() => ({
          ...chain,
          limit: vi.fn().mockImplementation(() => ({
            ...chain,
            single: vi.fn().mockResolvedValue(returnValue),
          })),
        })),
        single: vi.fn().mockResolvedValue(returnValue),
        head: vi.fn().mockResolvedValue(returnValue),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      ...chain,
      select: vi.fn().mockImplementation(() => ({
        ...chain,
        single: vi.fn().mockResolvedValue(returnValue),
      })),
    })),
    update: vi.fn().mockResolvedValue(returnValue),
    delete: vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue(returnValue),
    })),
  }));

  return { ...chain, auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } };
}

describe("getDictionaryDomains", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns domain list when Supabase returns data", async () => {
    const mockDomains = [
      { id: "d1", name: "Campaign", display_order: 0 },
      { id: "d2", name: "Media", display_order: 1 },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockDomains, error: null }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryDomains } = await import("./domain-actions");
    const result = await getDictionaryDomains();

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Campaign");
    }
  });

  it("returns error when Supabase returns an error", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryDomains } = await import("./domain-actions");
    const result = await getDictionaryDomains();

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("DB error");
    }
  });
});

describe("createDictionaryDomain", () => {
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

    const { createDictionaryDomain } = await import("./domain-actions");
    const result = await createDictionaryDomain({ name: "Campaign" });

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("reorderDomains", () => {
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

    const { reorderDomains } = await import("./domain-actions");
    const result = await reorderDomains([{ id: "d1", display_order: 0 }]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("calls update for each domain in the ordered list", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const mockFrom = vi.fn().mockReturnValue({
      update: mockUpdate,
    });

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null,
        }),
      },
      from: mockFrom,
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { reorderDomains } = await import("./domain-actions");
    const orderedIds = [
      { id: "d1", display_order: 0 },
      { id: "d2", display_order: 1 },
    ];
    const result = await reorderDomains(orderedIds);

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 0 });
    expect(mockUpdate).toHaveBeenCalledWith({ display_order: 1 });
    expect("data" in result).toBe(true);
  });
});
