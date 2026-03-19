"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { OntologyRelationshipWithNames } from "../../types/ontology";

interface DeleteRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: OntologyRelationshipWithNames | null;
  onConfirm: () => Promise<void>;
}

export function DeleteRelationshipDialog({
  open,
  onOpenChange,
  relationship,
  onConfirm,
}: DeleteRelationshipDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete relationship?</AlertDialogTitle>
          <AlertDialogDescription>
            {relationship
              ? `Remove the ${relationship.relationship_type_name} relationship between ${relationship.source_class_name} and ${relationship.target_class_name}?`
              : "Remove this relationship?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Keep Relationship
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Relationship
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
