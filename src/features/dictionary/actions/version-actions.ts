"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DictionaryVersion,
  DictionarySnapshot,
  VersionDiffResult,
} from "../types/dictionary";

/**
 * Fetch all dictionary versions for the current tenant.
 * Returns lightweight list (no snapshot JSONB) ordered by version_number desc.
 */
export async function getDictionaryVersions(): Promise<
  | {
      data: Pick<
        DictionaryVersion,
        "id" | "version_number" | "label" | "published_at"
      >[];
      error?: undefined;
    }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_versions")
    .select("id, version_number, label, published_at")
    .order("version_number", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return {
    data: data as Pick<
      DictionaryVersion,
      "id" | "version_number" | "label" | "published_at"
    >[],
  };
}

/**
 * Publish a new dictionary version by snapshotting current state.
 * Auto-increments version number. Creates immutable JSONB snapshot.
 */
export async function publishDictionaryVersion(
  label?: string
): Promise<
  | { data: { versionNumber: number }; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "User profile not found" };
  }

  const tenantId = profile.tenant_id;

  // Step 1: Get next version number
  const { data: latestVersion } = await supabase
    .from("dictionary_versions")
    .select("version_number")
    .eq("tenant_id", tenantId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (latestVersion?.version_number ?? 0) + 1;

  // Step 2: Build snapshot by querying all current dictionary data
  const [domainsResult, fieldsResult, fieldDomainsResult, picklistResult, concatResult] =
    await Promise.all([
      supabase
        .from("dictionary_domains")
        .select("id, name, description, domain_area, owner, display_order")
        .eq("tenant_id", tenantId)
        .order("display_order"),
      supabase
        .from("dictionary_fields")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("field_name"),
      supabase
        .from("dictionary_field_domains")
        .select("field_id, domain_id")
        .eq("tenant_id", tenantId),
      supabase
        .from("dictionary_picklist_values")
        .select("field_id, value, definition")
        .eq("tenant_id", tenantId)
        .order("display_order"),
      supabase
        .from("dictionary_concatenated_refs")
        .select("field_id, referenced_field_id")
        .eq("tenant_id", tenantId)
        .order("position"),
    ]);

  if (domainsResult.error) return { error: domainsResult.error.message };
  if (fieldsResult.error) return { error: fieldsResult.error.message };
  if (fieldDomainsResult.error) return { error: fieldDomainsResult.error.message };
  if (picklistResult.error) return { error: picklistResult.error.message };
  if (concatResult.error) return { error: concatResult.error.message };

  // Step 3: Assemble DictionarySnapshot
  // Build field-domain lookup
  const fieldDomainMap = new Map<string, string[]>();
  for (const fd of fieldDomainsResult.data ?? []) {
    const existing = fieldDomainMap.get(fd.field_id) ?? [];
    existing.push(fd.domain_id);
    fieldDomainMap.set(fd.field_id, existing);
  }

  // Build picklist values lookup grouped by field_id
  const picklistMap = new Map<
    string,
    Array<{ value: string; definition: string | null }>
  >();
  for (const pv of picklistResult.data ?? []) {
    const existing = picklistMap.get(pv.field_id) ?? [];
    existing.push({ value: pv.value, definition: pv.definition });
    picklistMap.set(pv.field_id, existing);
  }

  // Build concatenated refs lookup grouped by field_id
  const concatMap = new Map<string, string[]>();
  for (const cr of concatResult.data ?? []) {
    const existing = concatMap.get(cr.field_id) ?? [];
    existing.push(cr.referenced_field_id);
    concatMap.set(cr.field_id, existing);
  }

  const snapshot: DictionarySnapshot = {
    domains: (domainsResult.data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      domain_area: d.domain_area,
      owner: d.owner,
      display_order: d.display_order,
    })),
    fields: (fieldsResult.data ?? []).map((f) => {
      const fieldSnapshot: DictionarySnapshot["fields"][number] = {
        id: f.id,
        field_name: f.field_name,
        field_definition: f.field_definition,
        value_type: f.value_type,
        tagging_method: f.tagging_method,
        ai_instruction: f.ai_instruction,
        controlled: f.controlled,
        domain_ids: fieldDomainMap.get(f.id) ?? [],
      };

      const picklistValues = picklistMap.get(f.id);
      if (picklistValues && picklistValues.length > 0) {
        fieldSnapshot.picklist_values = picklistValues;
      }

      const concatFieldIds = concatMap.get(f.id);
      if (concatFieldIds && concatFieldIds.length > 0) {
        fieldSnapshot.concatenated_field_ids = concatFieldIds;
      }

      return fieldSnapshot;
    }),
  };

  // Step 4: Insert version
  const { error: insertError } = await supabase
    .from("dictionary_versions")
    .insert({
      tenant_id: tenantId,
      version_number: nextNumber,
      label: label ?? null,
      snapshot,
      published_by: user.id,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dictionary");
  return { data: { versionNumber: nextNumber } };
}

/**
 * Fetch a single dictionary version with its full snapshot.
 */
export async function getDictionaryVersionSnapshot(
  versionId: string
): Promise<
  | { data: DictionaryVersion; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryVersion };
}

/**
 * Compute the diff between two dictionary snapshots.
 * Pure function (not a server action) -- exported for colocation.
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
