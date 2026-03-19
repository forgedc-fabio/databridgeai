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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Plus, X } from "lucide-react";
import type {
  DictionaryField,
  ConcatenatedRefInput,
} from "../../types/dictionary";

const MAX_CONCATENATED_FIELDS = 10;

interface ConcatenatedFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  currentFieldId: string | null;
  availableFields: DictionaryField[];
  initialRefs: ConcatenatedRefInput[];
  onSave: (refs: ConcatenatedRefInput[]) => void;
}

export function ConcatenatedFieldsDialog({
  open,
  onOpenChange,
  fieldName,
  currentFieldId,
  availableFields,
  initialRefs,
  onSave,
}: ConcatenatedFieldsDialogProps) {
  const [refs, setRefs] = React.useState<
    Array<{ referencedFieldId: string; position: number }>
  >([]);

  // Initialise refs when dialog opens
  React.useEffect(() => {
    if (!open) return;
    setRefs(
      initialRefs.map((r) => ({
        referencedFieldId: r.referencedFieldId,
        position: r.position,
      }))
    );
  }, [open, initialRefs]);

  // Filter out current field to prevent self-reference
  const selectableFields = availableFields.filter(
    (f) => f.id !== currentFieldId
  );

  const addRef = () => {
    setRefs((prev) => [
      ...prev,
      { referencedFieldId: "", position: prev.length + 1 },
    ]);
  };

  const removeRef = (index: number) => {
    setRefs((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Recalculate positions
      return updated.map((r, i) => ({ ...r, position: i + 1 }));
    });
  };

  const updateRef = (index: number, referencedFieldId: string) => {
    setRefs((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, referencedFieldId } : r
      )
    );
  };

  const handleDone = () => {
    const cleaned = refs
      .filter((r) => r.referencedFieldId.length > 0)
      .map((r, i) => ({
        referencedFieldId: r.referencedFieldId,
        position: i + 1,
      }));
    onSave(cleaned);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Build preview string
  const previewParts = refs
    .filter((r) => r.referencedFieldId)
    .map((r) => {
      const field = availableFields.find(
        (f) => f.id === r.referencedFieldId
      );
      return field?.field_name ?? "Unknown";
    });

  const isAtLimit = refs.length >= MAX_CONCATENATED_FIELDS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Concatenated Fields for {fieldName}</DialogTitle>
          <DialogDescription>
            Select and order the fields that make up this concatenated value.
            Values will be joined with &quot; | &quot; separator.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {refs.map((ref, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-6 text-right shrink-0">
                {index + 1}.
              </span>
              <Select
                value={ref.referencedFieldId || undefined}
                onValueChange={(val) => { if (val) updateRef(index, val); }}
              >
                <SelectTrigger className="flex-1 h-8 text-sm">
                  <SelectValue placeholder="Select a field..." />
                </SelectTrigger>
                <SelectContent>
                  {selectableFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.field_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRef(index)}
                className="shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Remove field</span>
              </Button>
            </div>
          ))}

          {isAtLimit ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full opacity-50"
                    disabled
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Add Field
                  </Button>
                }
              />
              <TooltipContent>Maximum 10 concatenated fields</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRef}
              className="w-full"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Field
            </Button>
          )}

          {previewParts.length > 0 && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Preview:</span>{" "}
                {previewParts.join(" | ")}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleDone}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
