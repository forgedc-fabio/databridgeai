import type {
  DictionarySnapshot,
  VersionDiffResult,
} from "../types/dictionary";

/**
 * Compute the diff between two dictionary snapshots.
 * Pure function — no server action, safe to import from client components.
 */
export function computeVersionDiff(
  snapshotA: DictionarySnapshot,
  snapshotB: DictionarySnapshot
): VersionDiffResult {
  const fieldsAById = new Map(snapshotA.fields.map((f) => [f.id, f]));
  const fieldsBById = new Map(snapshotB.fields.map((f) => [f.id, f]));

  const added: DictionarySnapshot["fields"] = [];
  const removed: DictionarySnapshot["fields"] = [];
  const changed: VersionDiffResult["changed"] = [];

  // Fields in B not in A = added
  for (const [id, field] of fieldsBById) {
    if (!fieldsAById.has(id)) {
      added.push(field);
    }
  }

  // Fields in A not in B = removed
  for (const [id, field] of fieldsAById) {
    if (!fieldsBById.has(id)) {
      removed.push(field);
    }
  }

  // Fields in both = check for changes
  for (const [id, fieldA] of fieldsAById) {
    const fieldB = fieldsBById.get(id);
    if (!fieldB) continue;

    const changes: string[] = [];

    if (fieldA.field_name !== fieldB.field_name) {
      changes.push(`field_name: "${fieldA.field_name}" -> "${fieldB.field_name}"`);
    }
    if (fieldA.field_definition !== fieldB.field_definition) {
      changes.push("field_definition changed");
    }
    if (fieldA.value_type !== fieldB.value_type) {
      changes.push(`value_type: "${fieldA.value_type}" -> "${fieldB.value_type}"`);
    }
    if (fieldA.tagging_method !== fieldB.tagging_method) {
      changes.push(
        `tagging_method: "${fieldA.tagging_method}" -> "${fieldB.tagging_method}"`
      );
    }
    if (fieldA.ai_instruction !== fieldB.ai_instruction) {
      changes.push("ai_instruction changed");
    }
    if (fieldA.controlled !== fieldB.controlled) {
      changes.push(`controlled: ${fieldA.controlled} -> ${fieldB.controlled}`);
    }

    // Compare domain_ids
    const domainsASorted = [...fieldA.domain_ids].sort().join(",");
    const domainsBSorted = [...fieldB.domain_ids].sort().join(",");
    if (domainsASorted !== domainsBSorted) {
      changes.push("domain assignments changed");
    }

    // Compare picklist values
    const pvCountA = fieldA.picklist_values?.length ?? 0;
    const pvCountB = fieldB.picklist_values?.length ?? 0;
    if (pvCountA !== pvCountB) {
      changes.push(`picklist_values count: ${pvCountA} -> ${pvCountB}`);
    } else if (pvCountA > 0) {
      const pvAStr = JSON.stringify(fieldA.picklist_values);
      const pvBStr = JSON.stringify(fieldB.picklist_values);
      if (pvAStr !== pvBStr) {
        changes.push("picklist_values changed");
      }
    }

    // Compare concatenated field ids
    const cfA = [...(fieldA.concatenated_field_ids ?? [])].sort().join(",");
    const cfB = [...(fieldB.concatenated_field_ids ?? [])].sort().join(",");
    if (cfA !== cfB) {
      changes.push("concatenated_field_ids changed");
    }

    if (changes.length > 0) {
      changed.push({ field: fieldB, changes });
    }
  }

  // Domain changes
  const domainsAById = new Map(snapshotA.domains.map((d) => [d.id, d]));
  const domainsBById = new Map(snapshotB.domains.map((d) => [d.id, d]));

  const addedDomains: DictionarySnapshot["domains"] = [];
  const removedDomains: DictionarySnapshot["domains"] = [];

  for (const [id, domain] of domainsBById) {
    if (!domainsAById.has(id)) {
      addedDomains.push(domain);
    }
  }

  for (const [id, domain] of domainsAById) {
    if (!domainsBById.has(id)) {
      removedDomains.push(domain);
    }
  }

  return {
    added,
    removed,
    changed,
    domainChanges: {
      added: addedDomains,
      removed: removedDomains,
    },
  };
}
