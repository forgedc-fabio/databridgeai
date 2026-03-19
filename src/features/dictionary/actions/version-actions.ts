"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DictionaryVersion,
  DictionarySnapshot,
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

// Note: computeVersionDiff is a pure function located in ../lib/version-diff.ts
// It was moved out of this "use server" file because Next.js server action modules
// can only export async server action functions.
