import { describe, it, expect } from "vitest";
import { toTitleCase, validateFieldName, validateDomainName } from "./validators";

describe("toTitleCase", () => {
  it("returns empty string for empty input", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("capitalises first letter of a single word", () => {
    expect(toTitleCase("hello")).toBe("Hello");
  });

  it("capitalises first letter of each word in a multi-word string", () => {
    expect(toTitleCase("engagement type")).toBe("Engagement Type");
  });

  it("handles already Title Case input without change", () => {
    expect(toTitleCase("Media Type")).toBe("Media Type");
  });

  it("converts mixed case to Title Case", () => {
    expect(toTitleCase("mEDIA tYPE")).toBe("Media Type");
  });

  it("handles all-uppercase input", () => {
    expect(toTitleCase("FIELD NAME")).toBe("Field Name");
  });
});

describe("validateFieldName", () => {
  it("returns null for a valid field name", () => {
    expect(validateFieldName("Engagement Type")).toBeNull();
  });

  it("returns error string for empty string", () => {
    const result = validateFieldName("");
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns error string for whitespace-only string", () => {
    const result = validateFieldName("   ");
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns error string for name exceeding 255 characters", () => {
    const longName = "a".repeat(256);
    const result = validateFieldName(longName);
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns null for name at exactly 255 characters", () => {
    const maxName = "a".repeat(255);
    expect(validateFieldName(maxName)).toBeNull();
  });
});

describe("validateDomainName", () => {
  it("returns null for a valid domain name", () => {
    expect(validateDomainName("Campaign")).toBeNull();
  });

  it("returns error string for empty string", () => {
    const result = validateDomainName("");
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns error string for whitespace-only string", () => {
    const result = validateDomainName("   ");
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns error string for name exceeding 255 characters", () => {
    const longName = "d".repeat(256);
    const result = validateDomainName(longName);
    expect(typeof result).toBe("string");
    expect(result).not.toBeNull();
  });

  it("returns null for name at exactly 255 characters", () => {
    const maxName = "d".repeat(255);
    expect(validateDomainName(maxName)).toBeNull();
  });
});
