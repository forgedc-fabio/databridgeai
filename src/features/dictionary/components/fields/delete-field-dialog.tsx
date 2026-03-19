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

interface DeleteFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  onConfirm: () => Promise<void>;
}

export function DeleteFieldDialog({
  open,
  onOpenChange,
  fieldName,
  onConfirm,
}: DeleteFieldDialogProps) {
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
          <AlertDialogTitle>Delete {fieldName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the field from all domains. Any
            concatenated fields referencing it will need updating. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Keep Field
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Field
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
