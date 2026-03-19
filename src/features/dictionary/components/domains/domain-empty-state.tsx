"use client";

import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

interface DomainEmptyStateProps {
  onCreateClick: () => void;
}

export function DomainEmptyState({ onCreateClick }: DomainEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <FolderOpen className="h-16 w-16 text-muted-foreground" />
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-[28px] font-semibold leading-[1.2]">
          Create your first domain
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Domains group related fields in your data dictionary. Start by
          creating a domain, then add fields to organise your taxonomy.
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Add Domain
      </Button>
    </div>
  );
}
