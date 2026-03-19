"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook for tracking ontology sync status and stale detection.
 *
 * Compares last_synced_at from ontology_sync_status with max(updated_at)
 * from ontology_classes and ontology_relationships to determine staleness.
 *
 * Call checkStaleness() after any mutation to re-evaluate.
 */
export function useOntologySyncStatus() {
  const [isStale, setIsStale] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const checkStaleness = useCallback(async () => {
    const supabase = createClient();

    // Fetch sync status
    const { data: syncStatus } = await supabase
      .from("ontology_sync_status")
      .select("last_synced_at")
      .limit(1)
      .maybeSingle();

    const syncedAt = syncStatus?.last_synced_at as string | null;
    setLastSyncedAt(syncedAt);

    // Fetch max updated_at from classes
    const { data: latestClass } = await supabase
      .from("ontology_classes")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch max updated_at from relationships
    const { data: latestRel } = await supabase
      .from("ontology_relationships")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const classUpdatedAt = latestClass?.updated_at as string | null;
    const relUpdatedAt = latestRel?.updated_at as string | null;

    // Determine the most recent edit
    let maxUpdatedAt: string | null = null;
    if (classUpdatedAt && relUpdatedAt) {
      maxUpdatedAt = classUpdatedAt > relUpdatedAt ? classUpdatedAt : relUpdatedAt;
    } else {
      maxUpdatedAt = classUpdatedAt ?? relUpdatedAt;
    }

    // If no classes or relationships exist, not stale
    if (!maxUpdatedAt) {
      setIsStale(false);
      return;
    }

    // If never synced but classes/relationships exist, it is stale
    if (!syncedAt) {
      setIsStale(true);
      return;
    }

    // Compare timestamps: stale if ontology edited after last sync
    setIsStale(new Date(maxUpdatedAt) > new Date(syncedAt));
  }, []);

  // Check staleness on mount
  useEffect(() => {
    checkStaleness();
  }, [checkStaleness]);

  return { isStale, isSyncing, setIsSyncing, lastSyncedAt, checkStaleness };
}
