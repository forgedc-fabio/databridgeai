"use client";

import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

interface FieldEmptyStateProps {
  domainsExist: boolean;
  onCreateFieldClick: () => void;
  onCreateDomainClick: () => void;
}

export function FieldEmptyState({
  domainsExist,
  onCreateFieldClick,
  onCreateDomainClick,
}: FieldEmptyStateProps) {
  if (!domainsExist) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-12">
        <BookOpen className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-[28px] font-semibold leading-[1.2]">
            Create your first domain
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Domains group related fields in your data dictionary. Start by
            creating a domain, then add fields to organise your taxonomy.
          </p>
        </div>
        <Button onClick={onCreateDomainClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-12">
      <BookOpen className="h-16 w-16 text-muted-foreground" />
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-[28px] font-semibold leading-[1.2]">
          Add your first field
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fields define the taxonomy attributes that DataBridge AI uses to
          classify your content. Create a field and assign it to a domain.
        </p>
      </div>
      <Button onClick={onCreateFieldClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Field
      </Button>
    </div>
  );
}
