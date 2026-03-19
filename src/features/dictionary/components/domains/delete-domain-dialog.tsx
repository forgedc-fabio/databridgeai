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

interface DeleteDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  fieldCount: number;
  onConfirm: () => Promise<void>;
}

export function DeleteDomainDialog({
  open,
  onOpenChange,
  domainName,
  fieldCount,
  onConfirm,
}: DeleteDomainDialogProps) {
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
          <AlertDialogTitle>Delete {domainName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the domain. {fieldCount} field(s) currently
            assigned to this domain will become unassigned. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Keep Domain
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Domain
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
