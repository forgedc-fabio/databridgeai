/**
 * Enforces Title Case: capitalise the first letter of every word.
 * Applied on blur to Field Name inputs.
 */
export function toTitleCase(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

/**
 * Validates a field name.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateFieldName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Field name is required";
  }
  if (name.trim().length > 255) {
    return "Field name must be 255 characters or fewer";
  }
  return null;
}

/**
 * Validates a domain name.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateDomainName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Domain name is required";
  }
  if (name.trim().length > 255) {
    return "Domain name must be 255 characters or fewer";
  }
  return null;
}
