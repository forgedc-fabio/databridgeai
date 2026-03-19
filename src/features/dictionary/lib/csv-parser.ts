import Papa from "papaparse";

export interface ParsedMatchTable {
  columns: string[];
  rows: Record<string, string>[];
  errors: string[];
}

/**
 * Parse a match table CSV file using papaparse.
 * Expects headers in the first row. Multi-column hierarchy:
 * e.g., Engagement Type | Media Type | Channel | Sub-Channel
 */
export function parseMatchTableCSV(file: File): Promise<ParsedMatchTable> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];
        const errors = results.errors.map(
          (e) => `Row ${e.row}: ${e.message}`
        );
        resolve({ columns, rows, errors });
      },
      error: (error) => {
        resolve({ columns: [], rows: [], errors: [error.message] });
      },
    });
  });
}
