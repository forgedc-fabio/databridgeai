"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCogneeIdToken } from "@/lib/google-auth";
import type { OntologySyncStatus } from "../types/ontology";

/**
 * Sync the current tenant's ontology to Cognee via Cloud Run.
 *
 * Fetches all classes and relationships, sends them to the Cloud Run
 * /ontology/sync endpoint for OWL generation, and updates the
 * ontology_sync_status table on success.
 */
export async function syncOntologyToCognee(): Promise<
  | {
      data: {
        owl_file_path: string;
        class_count: number;
        relationship_count: number;
      };
      error?: undefined;
    }
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

  const tenantId = profile.tenant_id as string;

  // Fetch classes
  const { data: classes, error: classError } = await supabase
    .from("ontology_classes")
    .select("name, description, domain_group")
    .eq("tenant_id", tenantId);

  if (classError) {
    return { error: `Failed to fetch classes: ${classError.message}` };
  }

  // Fetch relationships with joined names
  const { data: relationships, error: relError } = await supabase
    .from("ontology_relationships")
    .select(
      `
      source_class:ontology_classes!source_class_id(name),
      target_class:ontology_classes!target_class_id(name),
      relationship_type:ontology_relationship_types!relationship_type_id(name)
    `
    )
    .eq("tenant_id", tenantId);

  if (relError) {
    return { error: `Failed to fetch relationships: ${relError.message}` };
  }

  // Transform relationships to the SyncRequest shape
  const transformedRelationships = (relationships ?? []).map(
    (row: Record<string, unknown>) => ({
      source_name:
        (row.source_class as { name: string } | null)?.name ?? "Unknown",
      target_name:
        (row.target_class as { name: string } | null)?.name ?? "Unknown",
      type:
        (row.relationship_type as { name: string } | null)?.name ?? "Unknown",
    })
  );

  // Call Cloud Run /ontology/sync endpoint directly
  const cogneeApiUrl = process.env.COGNEE_API_URL;
  if (!cogneeApiUrl) {
    return { error: "COGNEE_API_URL not configured" };
  }

  const syncRequest = {
    tenant_id: tenantId,
    classes: (classes ?? []).map((c: Record<string, unknown>) => ({
      name: c.name,
      description: c.description ?? null,
      domain_group: c.domain_group ?? null,
    })),
    relationships: transformedRelationships,
  };

  try {
    const idToken = await getCogneeIdToken();

    const response = await fetch(`${cogneeApiUrl}/ontology/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(syncRequest),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        error: `Sync endpoint returned ${response.status}: ${errorBody}`,
      };
    }

    const result = (await response.json()) as {
      owl_file_path: string;
      synced_at: string;
      class_count: number;
      relationship_count: number;
    };

    // Upsert ontology_sync_status
    const { error: upsertError } = await supabase
      .from("ontology_sync_status")
      .upsert(
        {
          tenant_id: tenantId,
          last_synced_at: result.synced_at,
          owl_file_path: result.owl_file_path,
          sync_status: "synced" as const,
        },
        { onConflict: "tenant_id" }
      );

    if (upsertError) {
      // Non-fatal: sync succeeded but status update failed
      console.error("Failed to update sync status:", upsertError.message);
    }

    revalidatePath("/ontology");

    return {
      data: {
        owl_file_path: result.owl_file_path,
        class_count: result.class_count,
        relationship_count: result.relationship_count,
      },
    };
  } catch (err) {
    // Update sync status to failed
    await supabase
      .from("ontology_sync_status")
      .upsert(
        {
          tenant_id: tenantId,
          sync_status: "failed" as const,
        },
        { onConflict: "tenant_id" }
      )
      .then(() => {});

    const message =
      err instanceof Error ? err.message : "Unknown error during sync";
    return { error: message };
  }
}

/**
 * Get the current sync status for the tenant.
 */
export async function getSyncStatus(): Promise<{
  data: OntologySyncStatus | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { data: null, error: "User profile not found" };
  }

  const { data, error } = await supabase
    .from("ontology_sync_status")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as OntologySyncStatus | null };
}
