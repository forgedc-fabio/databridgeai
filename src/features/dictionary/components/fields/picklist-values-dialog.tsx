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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
import { getPicklistValues } from "../../actions/value-actions";
import type { PicklistValueInput } from "../../types/dictionary";

interface PicklistValuesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  fieldId: string | null;
  initialValues: PicklistValueInput[];
  onSave: (values: PicklistValueInput[]) => void;
}

export function PicklistValuesDialog({
  open,
  onOpenChange,
  fieldName,
  fieldId,
  initialValues,
  onSave,
}: PicklistValuesDialogProps) {
  const [values, setValues] = React.useState<
    Array<{ value: string; definition: string }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Initialise values when dialog opens
  React.useEffect(() => {
    if (!open) return;

    const loadValues = async () => {
      if (fieldId) {
        setIsLoading(true);
        const result = await getPicklistValues(fieldId);
        if (result.data) {
          setValues(
            result.data.map((v) => ({
              value: v.value,
              definition: v.definition ?? "",
            }))
          );
        } else {
          // Fallback to initial values on error
          setValues(
            initialValues.map((v) => ({
              value: v.value,
              definition: v.definition ?? "",
            }))
          );
        }
        setIsLoading(false);
      } else {
        // New field (not yet saved) — use local state
        setValues(
          initialValues.map((v) => ({
            value: v.value,
            definition: v.definition ?? "",
          }))
        );
      }
    };

    loadValues();
  }, [open, fieldId, initialValues]);

  const addValue = () => {
    setValues((prev) => [...prev, { value: "", definition: "" }]);
  };

  const removeValue = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const updateValue = (
    index: number,
    field: "value" | "definition",
    newValue: string
  ) => {
    setValues((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: newValue } : v))
    );
  };

  const handleDone = () => {
    const cleaned = values
      .filter((v) => v.value.trim().length > 0)
      .map((v) => ({
        value: v.value.trim(),
        definition: v.definition.trim() || undefined,
      }));
    onSave(cleaned);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const valuesList = (
    <div className="space-y-2">
      {values.map((v, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Input
              value={v.value}
              onChange={(e) => updateValue(index, "value", e.target.value)}
              placeholder="Value"
              className="h-8 text-sm"
            />
            <Input
              value={v.definition}
              onChange={(e) =>
                updateValue(index, "definition", e.target.value)
              }
              placeholder="Sent to AI for context"
              className="h-8 text-sm text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeValue(index)}
            className="mt-1 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Remove value</span>
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Picklist Values for {fieldName}</DialogTitle>
          <DialogDescription>
            Define the allowed values for this picklist field. Each value can
            have an optional definition sent to the AI for classification
            context.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Loading values...
            </div>
          ) : values.length > 8 ? (
            <ScrollArea className="max-h-[400px]">{valuesList}</ScrollArea>
          ) : (
            valuesList
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addValue}
            className="mt-3 w-full"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Value
          </Button>
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
