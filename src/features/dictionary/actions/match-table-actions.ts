"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DictionaryMatchTable } from "../types/dictionary";

/**
 * Fetch the match table for a given field.
 * Returns null if no match table exists.
 */
export async function getMatchTable(
  fieldId: string
): Promise<
  | { data: DictionaryMatchTable | null; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_match_tables")
    .select("*")
    .eq("field_id", fieldId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryMatchTable | null };
}

/**
 * Upload (upsert) a match table for a field.
 * Replaces any existing match table for the same field_id.
 */
export async function uploadMatchTable(
  fieldId: string,
  columns: string[],
  data: Record<string, string>[]
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

  const { error: upsertError } = await supabase
    .from("dictionary_match_tables")
    .upsert(
      {
        field_id: fieldId,
        tenant_id: profile.tenant_id,
        columns,
        data,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "field_id" }
    );

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath("/dictionary");
  return { data: true };
}
