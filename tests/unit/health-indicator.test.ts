import { describe, it, expect } from "vitest";
import { STATUS_LABELS } from "@/components/health-indicator";

describe("Health status mapping", () => {
  it("cognee has labels for all three states", () => {
    expect(Object.keys(STATUS_LABELS.cognee)).toEqual(
      expect.arrayContaining(["healthy", "degraded", "unreachable"])
    );
  });

  it("storage has labels for healthy and unreachable states", () => {
    expect(Object.keys(STATUS_LABELS.storage)).toEqual(
      expect.arrayContaining(["healthy", "unreachable"])
    );
  });

  it("all labels are non-empty strings", () => {
    Object.values(STATUS_LABELS).forEach((service) => {
      Object.values(service).forEach((label) => {
        expect(typeof label).toBe("string");
        expect(label.length).toBeGreaterThan(0);
      });
    });
  });

  it("cognee healthy label matches copywriting contract", () => {
    expect(STATUS_LABELS.cognee.healthy).toBe("Cognee: Connected");
  });

  it("cognee degraded label matches copywriting contract", () => {
    expect(STATUS_LABELS.cognee.degraded).toBe(
      "Cognee: Degraded \u2014 service responding with errors"
    );
  });

  it("cognee unreachable label matches copywriting contract", () => {
    expect(STATUS_LABELS.cognee.unreachable).toBe(
      "Cognee: Unreachable \u2014 service is not responding"
    );
  });

  it("storage healthy label matches copywriting contract", () => {
    expect(STATUS_LABELS.storage.healthy).toBe("Storage: Available");
  });

  it("storage unreachable label matches copywriting contract", () => {
    expect(STATUS_LABELS.storage.unreachable).toBe(
      "Storage: Unavailable \u2014 file operations will fail"
    );
  });
});
