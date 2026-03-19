import { describe, it, expect, vi, beforeEach } from "vitest";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockCreateClient = vi.mocked(createClient);

describe("getDictionaryVersions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns version list ordered by version_number desc", async () => {
    const mockVersions = [
      { id: "v2", version_number: 2, label: "Release 2", published_at: "2024-02-01" },
      { id: "v1", version_number: 1, label: "Release 1", published_at: "2024-01-01" },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockVersions, error: null }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryVersions } = await import("./version-actions");
    const result = await getDictionaryVersions();

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].version_number).toBe(2);
      expect(result.data[1].version_number).toBe(1);
    }
  });

  it("returns error when Supabase query fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: { message: "Versions query failed" } }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryVersions } = await import("./version-actions");
    const result = await getDictionaryVersions();

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Versions query failed");
    }
  });
});

describe("publishDictionaryVersion", () => {
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

    const { publishDictionaryVersion } = await import("./version-actions");
    const result = await publishDictionaryVersion("Test label");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("getDictionaryVersionSnapshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns full version snapshot for a valid version id", async () => {
    const mockVersion = {
      id: "v1",
      tenant_id: "t1",
      version_number: 1,
      label: "Release 1",
      snapshot: { domains: [], fields: [] },
      published_at: "2024-01-01",
      published_by: "user-1",
    };

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockVersion, error: null }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryVersionSnapshot } = await import("./version-actions");
    const result = await getDictionaryVersionSnapshot("v1");

    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data.id).toBe("v1");
      expect(result.data.version_number).toBe(1);
      expect(result.data.snapshot).toBeDefined();
    }
  });

  it("returns error when version is not found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          }),
        }),
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as never);

    const { getDictionaryVersionSnapshot } = await import("./version-actions");
    const result = await getDictionaryVersionSnapshot("nonexistent");

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Not found");
    }
  });
});
