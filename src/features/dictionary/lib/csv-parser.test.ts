import { describe, it, expect } from "vitest";
import { parseMatchTableCSV } from "./csv-parser";

function makeFile(content: string, name = "test.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("parseMatchTableCSV — columns", () => {
  it("extracts column names from header row", async () => {
    const csv = "Name,Age,City\nAlice,30,London";
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.columns).toEqual(["Name", "Age", "City"]);
  });

  it("returns empty columns for a CSV with no rows", async () => {
    const csv = "Name,Age,City";
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.columns).toEqual(["Name", "Age", "City"]);
  });
});

describe("parseMatchTableCSV — rows", () => {
  it("parses data rows into Record<string, string>[]", async () => {
    const csv = "Name,Age\nAlice,30\nBob,25";
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ Name: "Alice", Age: "30" });
    expect(result.rows[1]).toEqual({ Name: "Bob", Age: "25" });
  });

  it("skips empty lines", async () => {
    const csv = "Name,Age\nAlice,30\n\nBob,25\n";
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.rows).toHaveLength(2);
  });

  it("handles quoted fields containing commas", async () => {
    const csv = `Name,Location\nAlice,"London, UK"\nBob,"New York, USA"`;
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.rows[0]).toEqual({ Name: "Alice", Location: "London, UK" });
    expect(result.rows[1]).toEqual({ Name: "Bob", Location: "New York, USA" });
  });
});

describe("parseMatchTableCSV — errors", () => {
  it("returns empty errors array for a valid CSV", async () => {
    const csv = "Name,Age\nAlice,30";
    const result = await parseMatchTableCSV(makeFile(csv));

    expect(result.errors).toHaveLength(0);
  });
});
