"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DictionaryDomain, DictionaryDomainInput } from "../types/dictionary";

/**
 * Fetch all dictionary domains for the current tenant.
 * RLS handles tenant scoping automatically.
 */
export async function getDictionaryDomains(): Promise<
  { data: DictionaryDomain[]; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dictionary_domains")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as DictionaryDomain[] };
}

/**
 * Create a new dictionary domain.
 * Looks up tenant_id from user_profiles for the authenticated user.
 * Auto-assigns next display_order.
 */
export async function createDictionaryDomain(
  input: DictionaryDomainInput
): Promise<
  { data: DictionaryDomain; error?: undefined } | { data?: undefined; error: string }
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

  // Get next display_order
  const { data: maxOrderRow } = await supabase
    .from("dictionary_domains")
    .select("display_order")
    .eq("tenant_id", profile.tenant_id)
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = maxOrderRow ? maxOrderRow.display_order + 1 : 0;

  const { data, error } = await supabase
    .from("dictionary_domains")
    .insert({
      tenant_id: profile.tenant_id,
      name: input.name,
      description: input.description ?? null,
      domain_area: input.domainArea ?? null,
      owner: input.owner ?? null,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A domain with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/dictionary");
  return { data: data as DictionaryDomain };
}

/**
 * Update an existing dictionary domain.
 * RLS handles tenant scoping on update.
 */
export async function updateDictionaryDomain(
  id: string,
  input: DictionaryDomainInput
): Promise<
  { data: DictionaryDomain; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("dictionary_domains")
    .update({
      name: input.name,
      description: input.description ?? null,
      domain_area: input.domainArea ?? null,
      owner: input.owner ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A domain with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/dictionary");
  return { data: data as DictionaryDomain };
}

/**
 * Delete a dictionary domain.
 * Returns the count of fields that were unlinked (cascade on field_domains).
 */
export async function deleteDictionaryDomain(
  id: string
): Promise<
  { data: { unlinkedFields: number }; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  // Count fields assigned to this domain before deletion
  const count = await getFieldCountForDomain(id);

  const { error } = await supabase
    .from("dictionary_domains")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dictionary");
  return { data: { unlinkedFields: count } };
}

/**
 * Reorder domains by updating display_order for each domain.
 * Accepts an array of { id, display_order } pairs.
 */
export async function reorderDomains(
  orderedIds: { id: string; display_order: number }[]
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

  const updates = orderedIds.map((item) =>
    supabase
      .from("dictionary_domains")
      .update({ display_order: item.display_order })
      .eq("id", item.id)
  );

  const results = await Promise.all(updates);

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath("/dictionary");
  return { data: true };
}

/**
 * Get the count of fields assigned to a given domain.
 * Used by the delete confirmation dialog to inform the user.
 */
export async function getFieldCountForDomain(
  domainId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("dictionary_field_domains")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
