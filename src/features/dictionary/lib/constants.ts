export const DOMAIN_COLOUR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#f43f5e", // Rose
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate (overflow)
] as const;

export const UNASSIGNED_COLOUR = "#6b7280";

export const VALUE_TYPES = [
  "Text",
  "Long Text",
  "Descriptive Text",
  "Picklist",
  "Concatenated",
  "Number",
] as const;

export const TAGGING_METHODS = [
  "Sourced",
  "AI Inferred",
  "System",
] as const;

// Value type descriptions for form tooltips
export const VALUE_TYPE_DESCRIPTIONS: Record<string, string> = {
  "Text": "VARCHAR(255) -- short text values",
  "Long Text": "NVARCHAR(600) -- medium-length text",
  "Descriptive Text": "NVARCHAR(MAX) -- long-form text",
  "Picklist": "Select from defined values",
  "Concatenated": "Combined from existing fields, separated by \" | \"",
  "Number": "Numeric values",
};
