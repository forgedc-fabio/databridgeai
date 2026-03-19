"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DictionaryField,
  DictionaryFieldWithDomains,
  DictionaryFieldInput,
} from "../types/dictionary";

/**
 * Fetch all dictionary fields with their domain assignments.
 * Assembles DictionaryFieldWithDomains[] by joining fields, field_domains, and domains.
 */
export async function getDictionaryFields(): Promise<
  | { data: DictionaryFieldWithDomains[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  // Fetch fields
  const { data: fields, error: fieldsError } = await supabase
    .from("dictionary_fields")
    .select("*")
    .order("field_name", { ascending: true });

  if (fieldsError) {
    return { error: fieldsError.message };
  }

  // Fetch field-domain assignments
  const { data: fieldDomains, error: fdError } = await supabase
    .from("dictionary_field_domains")
    .select("field_id, domain_id");

  if (fdError) {
    return { error: fdError.message };
  }

  // Fetch domain names
  const { data: domains, error: domError } = await supabase
    .from("dictionary_domains")
    .select("id, name");

  if (domError) {
    return { error: domError.message };
  }

  // Build domain lookup
  const domainMap = new Map<string, string>();
  for (const d of domains ?? []) {
    domainMap.set(d.id, d.name);
  }

  // Build field-to-domains lookup
  const fieldDomainMap = new Map<string, string[]>();
  for (const fd of fieldDomains ?? []) {
    const existing = fieldDomainMap.get(fd.field_id) ?? [];
    existing.push(fd.domain_id);
    fieldDomainMap.set(fd.field_id, existing);
  }

  // Assemble DictionaryFieldWithDomains[]
  const result: DictionaryFieldWithDomains[] = (
    fields as DictionaryField[]
  ).map((field) => {
    const domainIds = fieldDomainMap.get(field.id) ?? [];
    const domainNames = domainIds
      .map((id) => domainMap.get(id))
      .filter((name): name is string => !!name);

    return {
      ...field,
      domain_ids: domainIds,
      domain_names: domainNames,
    };
  });

  return { data: result };
}

/**
 * Create a new dictionary field with optional domain assignments.
 */
export async function createDictionaryField(
  input: DictionaryFieldInput
): Promise<
  | { data: DictionaryField; error?: undefined }
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

  const { data, error } = await supabase
    .from("dictionary_fields")
    .insert({
      tenant_id: profile.tenant_id,
      field_name: input.fieldName,
      field_definition: input.fieldDefinition ?? null,
      value_type: input.valueType,
      tagging_method: input.taggingMethod,
      ai_instruction: input.aiInstruction ?? null,
      controlled: input.controlled ?? false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "A field with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  // Insert domain assignments
  if (input.domainIds && input.domainIds.length > 0) {
    const domainRows = input.domainIds.map((domainId) => ({
      field_id: data.id,
      domain_id: domainId,
      tenant_id: profile.tenant_id,
    }));

    const { error: fdError } = await supabase
      .from("dictionary_field_domains")
      .insert(domainRows);

    if (fdError) {
      // Field was created but domain assignment failed — log but do not block
      console.error("Failed to assign domains:", fdError.message);
    }
  }

  revalidatePath("/dictionary");
  return { data: data as DictionaryField };
}

/**
 * Update an existing dictionary field and sync domain assignments.
 */
export async function updateDictionaryField(
  id: string,
  input: DictionaryFieldInput
): Promise<
  | { data: DictionaryField; error?: undefined }
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

  const { data, error } = await supabase
    .from("dictionary_fields")
    .update({
      field_name: input.fieldName,
      field_definition: input.fieldDefinition ?? null,
      value_type: input.valueType,
      tagging_method: input.taggingMethod,
      ai_instruction: input.aiInstruction ?? null,
      controlled: input.controlled ?? false,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "A field with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  // Sync domain assignments: delete existing, insert new
  await supabase
    .from("dictionary_field_domains")
    .delete()
    .eq("field_id", id);

  if (input.domainIds && input.domainIds.length > 0) {
    const domainRows = input.domainIds.map((domainId) => ({
      field_id: id,
      domain_id: domainId,
      tenant_id: profile.tenant_id,
    }));

    const { error: fdError } = await supabase
      .from("dictionary_field_domains")
      .insert(domainRows);

    if (fdError) {
      console.error("Failed to sync domains:", fdError.message);
    }
  }

  revalidatePath("/dictionary");
  return { data: data as DictionaryField };
}

/**
 * Delete a dictionary field.
 * Cascade handles picklist_values, concatenated_refs, and field_domains.
 */
export async function deleteDictionaryField(
  id: string
): Promise<
  { data: true; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("dictionary_fields")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dictionary");
  return { data: true };
}

/**
 * Check whether a match table exists for a given field.
 * Used to conditionally show the "Controlled" checkbox in the field form.
 */
export async function checkMatchTableExists(
  fieldId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("dictionary_match_tables")
    .select("id", { count: "exact", head: true })
    .eq("field_id", fieldId);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}
