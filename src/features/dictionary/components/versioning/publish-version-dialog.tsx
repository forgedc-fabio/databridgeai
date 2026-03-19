"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PublishVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (label?: string) => Promise<void>;
}

export function PublishVersionDialog({
  open,
  onOpenChange,
  onPublish,
}: PublishVersionDialogProps) {
  const [label, setLabel] = React.useState("");
  const [isPublishing, setIsPublishing] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setLabel("");
      setIsPublishing(false);
    }
  }, [open]);

  const handlePublish = async () => {
    setIsPublishing(true);
    await onPublish(label.trim() || undefined);
    setIsPublishing(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Publish Dictionary Version</DialogTitle>
          <DialogDescription>
            Create an immutable snapshot of the current dictionary state. You
            can optionally add a label.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="version-label">Label (optional)</Label>
            <Input
              id="version-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Added compliance fields"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
