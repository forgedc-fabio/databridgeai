"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DictionaryPicklistValue,
  DictionaryConcatenatedRef,
  PicklistValueInput,
  ConcatenatedRefInput,
} from "../types/dictionary";

/**
 * Fetch all picklist values for a given field, ordered by display_order.
 */
export async function getPicklistValues(
  fieldId: string
): Promise<
  | { data: DictionaryPicklistValue[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_picklist_values")
    .select("*")
    .eq("field_id", fieldId)
    .order("display_order", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryPicklistValue[] };
}

/**
 * Replace all picklist values for a field.
 * Strategy: delete existing, then insert new with display_order = index.
 */
export async function savePicklistValues(
  fieldId: string,
  values: PicklistValueInput[]
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

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "User profile not found" };
  }

  // Delete existing values
  const { error: deleteError } = await supabase
    .from("dictionary_picklist_values")
    .delete()
    .eq("field_id", fieldId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Insert new values (skip if empty array)
  if (values.length > 0) {
    const { error: insertError } = await supabase
      .from("dictionary_picklist_values")
      .insert(
        values.map((v, i) => ({
          field_id: fieldId,
          tenant_id: profile.tenant_id,
          value: v.value,
          definition: v.definition ?? null,
          display_order: i,
        }))
      );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath("/dictionary");
  return { data: true };
}

/**
 * Fetch concatenated field references for a given field, ordered by position.
 */
export async function getConcatenatedRefs(
  fieldId: string
): Promise<
  | { data: DictionaryConcatenatedRef[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_concatenated_refs")
    .select("*")
    .eq("field_id", fieldId)
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryConcatenatedRef[] };
}

/**
 * Replace all concatenated field references for a field.
 * Strategy: delete existing, then insert new. Filters out self-references.
 */
export async function saveConcatenatedRefs(
  fieldId: string,
  refs: ConcatenatedRefInput[]
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

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "User profile not found" };
  }

  // Filter out self-references
  const filteredRefs = refs.filter((r) => r.referencedFieldId !== fieldId);

  // Delete existing refs
  const { error: deleteError } = await supabase
    .from("dictionary_concatenated_refs")
    .delete()
    .eq("field_id", fieldId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Insert new refs (skip if empty)
  if (filteredRefs.length > 0) {
    const { error: insertError } = await supabase
      .from("dictionary_concatenated_refs")
      .insert(
        filteredRefs.map((r) => ({
          field_id: fieldId,
          referenced_field_id: r.referencedFieldId,
          tenant_id: profile.tenant_id,
          position: r.position,
        }))
      );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath("/dictionary");
  return { data: true };
}

/**
 * Fetch all concatenated refs across all fields for the current tenant.
 * RLS handles tenant scoping automatically.
 * Consumed by Plan 04 (visualisation) to draw concatenated-type edges.
 */
export async function getAllConcatenatedRefs(): Promise<
  | { data: DictionaryConcatenatedRef[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_concatenated_refs")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryConcatenatedRef[] };
}

/**
 * Fetch all picklist values across all fields for the current tenant.
 * RLS handles tenant scoping automatically.
 * Consumed by Plan 04 (visualisation) TreeView to display picklist values.
 */
export async function getAllPicklistValues(): Promise<
  | { data: DictionaryPicklistValue[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_picklist_values")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryPicklistValue[] };
}
