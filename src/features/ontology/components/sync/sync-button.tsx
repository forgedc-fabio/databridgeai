"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SyncButtonProps {
  isStale: boolean;
  isSyncing: boolean;
  onSync: () => Promise<void>;
}

/**
 * Sync button with stale indicator and loading state.
 *
 * Shows an amber dot when the ontology has changed since the last sync.
 * During sync, the icon spins and the label changes to "Syncing...".
 */
export function SyncButton({ isStale, isSyncing, onSync }: SyncButtonProps) {
  const button = (
    <div className="relative inline-flex">
      <Button variant="default" onClick={onSync} disabled={isSyncing}>
        <RefreshCw
          className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
        />
        {isSyncing ? "Syncing..." : "Sync to Cognee"}
      </Button>
      {isStale && !isSyncing && (
        <span
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500"
          aria-label="Ontology has changed since last sync"
        />
      )}
    </div>
  );

  // Only wrap in tooltip when stale indicator is showing
  if (isStale && !isSyncing) {
    return (
      <Tooltip>
        <TooltipTrigger className="inline-flex">{button}</TooltipTrigger>
        <TooltipContent>
          <p>Ontology has changed since last sync</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
