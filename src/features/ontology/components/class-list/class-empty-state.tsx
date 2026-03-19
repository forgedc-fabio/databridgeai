"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ClassEmptyStateProps {
  onCreateClick: () => void;
}

export function ClassEmptyState({ onCreateClick }: ClassEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-[28px] font-semibold leading-[1.2]">
          Create your first ontology class
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          An ontology defines the entity types and relationships that DataBridge
          AI uses to classify your content. Start by creating a class, then
          connect them with relationships.
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Class
      </Button>
    </div>
  );
}
