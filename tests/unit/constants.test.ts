import { describe, it, expect } from "vitest";
import { NAV_ITEMS } from "@/lib/constants";

describe("NAV_ITEMS", () => {
  it("has exactly 5 navigation items", () => {
    expect(NAV_ITEMS).toHaveLength(5);
  });

  it("only Dashboard is enabled", () => {
    const enabled = NAV_ITEMS.filter((item) => item.enabled);
    expect(enabled).toHaveLength(1);
    expect(enabled[0].title).toBe("Dashboard");
  });

  it("all items have title, url, icon, and enabled properties", () => {
    NAV_ITEMS.forEach((item) => {
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("url");
      expect(item).toHaveProperty("icon");
      expect(item).toHaveProperty("enabled");
    });
  });
});
