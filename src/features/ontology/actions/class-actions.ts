"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OntologyClass, OntologyClassInput } from "../types/ontology";

/**
 * Fetch all ontology classes for the current tenant.
 * RLS handles tenant scoping automatically.
 */
export async function getOntologyClasses(): Promise<
  { data: OntologyClass[]; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ontology_classes")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return { data: data as OntologyClass[] };
}

/**
 * Create a new ontology class.
 * Looks up tenant_id from user_profiles for the authenticated user.
 */
export async function createOntologyClass(
  input: OntologyClassInput
): Promise<
  { data: OntologyClass; error?: undefined } | { data?: undefined; error: string }
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
    .from("ontology_classes")
    .insert({
      tenant_id: profile.tenant_id,
      name: input.name,
      description: input.description ?? null,
      domain_group: input.domainGroup ?? null,
      colour: input.colour ?? "#6366f1",
      icon_tag: input.iconTag ?? null,
      custom_attributes: input.customAttributes ?? [],
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A class with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data: data as OntologyClass };
}

/**
 * Update an existing ontology class.
 * Handles duplicate name error (23505).
 */
export async function updateOntologyClass(
  id: string,
  input: OntologyClassInput
): Promise<
  { data: OntologyClass; error?: undefined } | { data?: undefined; error: string }
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
    .from("ontology_classes")
    .update({
      name: input.name,
      description: input.description ?? null,
      domain_group: input.domainGroup ?? null,
      colour: input.colour ?? "#6366f1",
      icon_tag: input.iconTag ?? null,
      custom_attributes: input.customAttributes ?? [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A class with this name already exists. Choose a different name.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data: data as OntologyClass };
}

/**
 * Delete an ontology class.
 * Returns the count of relationships that were removed via cascade.
 */
export async function deleteOntologyClass(
  id: string
): Promise<
  { data: { deletedRelationships: number }; error?: undefined } | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  // Count relationships that will be removed by cascade
  const count = await getRelationshipCountForClass(id);

  const { error } = await supabase
    .from("ontology_classes")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data: { deletedRelationships: count } };
}

/**
 * Get the count of relationships involving a given class.
 * Used by the delete confirmation dialog to inform the user.
 */
export async function getRelationshipCountForClass(
  classId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("ontology_relationships")
    .select("*", { count: "exact", head: true })
    .or(`source_class_id.eq.${classId},target_class_id.eq.${classId}`);

  if (error) {
    return 0;
  }

  return count ?? 0;
}
