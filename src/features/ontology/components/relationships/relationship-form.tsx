"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import type {
  OntologyClass,
  OntologyRelationshipType,
  OntologyRelationshipInput,
} from "../../types/ontology";

interface RelationshipFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: OntologyClass[];
  relationshipTypes: OntologyRelationshipType[];
  onSave: (input: OntologyRelationshipInput) => Promise<{ error?: string }>;
  onCreateType: (name: string) => Promise<void>;
}

export function RelationshipForm({
  open,
  onOpenChange,
  classes,
  relationshipTypes,
  onSave,
  onCreateType,
}: RelationshipFormProps) {
  const [sourceClassId, setSourceClassId] = React.useState<string>("");
  const [targetClassId, setTargetClassId] = React.useState<string>("");
  const [relationshipTypeId, setRelationshipTypeId] =
    React.useState<string>("");
  const [newTypeName, setNewTypeName] = React.useState("");
  const [isCreatingType, setIsCreatingType] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSourceClassId("");
      setTargetClassId("");
      setRelationshipTypeId("");
      setNewTypeName("");
      setError(null);
    }
  }, [open]);

  const handleSourceChange = React.useCallback((value: unknown) => {
    if (typeof value === "string") {
      setSourceClassId(value);
      setError(null);
    }
  }, []);

  const handleTypeChange = React.useCallback((value: unknown) => {
    if (typeof value === "string") {
      setRelationshipTypeId(value);
      setError(null);
    }
  }, []);

  const handleTargetChange = React.useCallback((value: unknown) => {
    if (typeof value === "string") {
      setTargetClassId(value);
      setError(null);
    }
  }, []);

  const handleCreateType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    setIsCreatingType(true);
    try {
      await onCreateType(trimmed);
      setNewTypeName("");
    } finally {
      setIsCreatingType(false);
    }
  };

  const handleNewTypeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateType();
    }
  };

  const handleSubmit = async () => {
    if (!sourceClassId || !targetClassId || !relationshipTypeId) {
      setError("Please select source class, relationship type, and target class.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await onSave({
      sourceClassId,
      targetClassId,
      relationshipTypeId,
    });

    setIsSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSaving) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
          <DialogDescription>
            Define a relationship between two ontology classes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Source Class */}
          <div className="grid gap-2">
            <Label htmlFor="source-class">Source Class</Label>
            <Select
              value={sourceClassId || undefined}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select source class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Relationship Type */}
          <div className="grid gap-2">
            <Label htmlFor="relationship-type">Relationship Type</Label>
            <Select
              value={relationshipTypeId || undefined}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                    {type.is_system ? "" : " (custom)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Inline type creation */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Create new type..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={handleNewTypeKeyDown}
                disabled={isCreatingType}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || isCreatingType}
              >
                {isCreatingType ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Target Class */}
          <div className="grid gap-2">
            <Label htmlFor="target-class">Target Class</Label>
            <Select
              value={targetClassId || undefined}
              onValueChange={handleTargetChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select target class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error display */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add Relationship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
