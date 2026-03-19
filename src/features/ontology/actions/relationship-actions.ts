"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { detectCircularHierarchy } from "../lib/validators";
import type {
  OntologyRelationshipWithNames,
  OntologyRelationshipType,
  OntologyRelationshipInput,
} from "../types/ontology";

/**
 * Fetch all relationships for the current tenant with joined class and type names.
 * RLS handles tenant scoping automatically.
 */
export async function getOntologyRelationships(): Promise<
  | { data: OntologyRelationshipWithNames[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ontology_relationships")
    .select(
      `
      *,
      source_class:ontology_classes!source_class_id(name),
      target_class:ontology_classes!target_class_id(name),
      relationship_type:ontology_relationship_types!relationship_type_id(name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Flatten the joined response into OntologyRelationshipWithNames shape
  const relationships: OntologyRelationshipWithNames[] = (data ?? []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      tenant_id: row.tenant_id as string,
      source_class_id: row.source_class_id as string,
      target_class_id: row.target_class_id as string,
      relationship_type_id: row.relationship_type_id as string,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      source_class_name:
        (row.source_class as { name: string } | null)?.name ?? "Unknown",
      target_class_name:
        (row.target_class as { name: string } | null)?.name ?? "Unknown",
      relationship_type_name:
        (row.relationship_type as { name: string } | null)?.name ?? "Unknown",
    })
  );

  return { data: relationships };
}

/**
 * Fetch all relationship types for the current tenant.
 * RLS handles tenant scoping automatically.
 */
export async function getRelationshipTypes(): Promise<
  | { data: OntologyRelationshipType[]; error?: undefined }
  | { data?: undefined; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ontology_relationship_types")
    .select("*")
    .order("name");

  if (error) {
    return { error: error.message };
  }

  return { data: data as OntologyRelationshipType[] };
}

/**
 * Create a custom relationship type.
 * System types (is_system: true) are seeded; user-created types are is_system: false.
 */
export async function createRelationshipType(
  name: string
): Promise<
  | { data: OntologyRelationshipType; error?: undefined }
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
    .from("ontology_relationship_types")
    .insert({
      tenant_id: profile.tenant_id,
      name: name.trim(),
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error: "A relationship type with this name already exists.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data: data as OntologyRelationshipType };
}

/**
 * Create a new ontology relationship.
 * For "is-a" relationships, validates against circular hierarchies before inserting.
 */
export async function createOntologyRelationship(
  input: OntologyRelationshipInput
): Promise<
  | { data: { id: string }; error?: undefined }
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

  // Check if the relationship type is "is-a"
  const { data: relType, error: relTypeError } = await supabase
    .from("ontology_relationship_types")
    .select("name")
    .eq("id", input.relationshipTypeId)
    .single();

  if (relTypeError || !relType) {
    return { error: "Relationship type not found" };
  }

  if (relType.name === "is-a") {
    // Fetch all existing "is-a" relationships for the tenant
    const { data: isATypes } = await supabase
      .from("ontology_relationship_types")
      .select("id")
      .eq("name", "is-a");

    const isATypeIds = (isATypes ?? []).map(
      (t: { id: string }) => t.id
    );

    if (isATypeIds.length > 0) {
      const { data: existingIsA } = await supabase
        .from("ontology_relationships")
        .select("source_class_id, target_class_id")
        .in("relationship_type_id", isATypeIds);

      // Fetch all classes to build name map
      const { data: allClasses } = await supabase
        .from("ontology_classes")
        .select("id, name");

      const classNameMap = new Map<string, string>();
      for (const cls of allClasses ?? []) {
        classNameMap.set(
          (cls as { id: string; name: string }).id,
          (cls as { id: string; name: string }).name
        );
      }

      const result = detectCircularHierarchy(
        input.sourceClassId,
        input.targetClassId,
        (existingIsA ?? []) as Array<{
          source_class_id: string;
          target_class_id: string;
        }>,
        classNameMap
      );

      if (result.circular) {
        return {
          error: `Cannot create this relationship — it would create a circular hierarchy: ${result.path.join(" -> ")}.`,
        };
      }
    }
  }

  // Insert the relationship
  const { data, error } = await supabase
    .from("ontology_relationships")
    .insert({
      tenant_id: profile.tenant_id,
      source_class_id: input.sourceClassId,
      target_class_id: input.targetClassId,
      relationship_type_id: input.relationshipTypeId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "This relationship already exists." };
    }
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return { data: { id: data.id as string } };
}

/**
 * Delete an ontology relationship.
 */
export async function deleteOntologyRelationship(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("ontology_relationships")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/ontology");
  return {};
}
