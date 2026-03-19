"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { validateDomainName } from "../../lib/validators";
import type {
  DictionaryDomain,
  DictionaryDomainInput,
} from "../../types/dictionary";

interface DomainFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDomain: DictionaryDomain | null;
  onSave: (input: DictionaryDomainInput) => Promise<{ error?: string }>;
}

export function DomainFormPanel({
  open,
  onOpenChange,
  editingDomain,
  onSave,
}: DomainFormPanelProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [domainArea, setDomainArea] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset form when editingDomain or open changes
  React.useEffect(() => {
    if (open) {
      if (editingDomain) {
        setName(editingDomain.name);
        setDescription(editingDomain.description ?? "");
        setDomainArea(editingDomain.domain_area ?? "");
        setOwner(editingDomain.owner ?? "");
      } else {
        setName("");
        setDescription("");
        setDomainArea("");
        setOwner("");
      }
      setNameError(null);
    }
  }, [open, editingDomain]);

  const handleSave = async () => {
    const validationError = validateDomainName(name);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setNameError(null);
    setIsSaving(true);

    const input: DictionaryDomainInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      domainArea: domainArea.trim() || undefined,
      owner: owner.trim() || undefined,
    };

    const result = await onSave(input);
    setIsSaving(false);

    if (result?.error) {
      if (result.error.includes("already exists")) {
        setNameError(result.error);
      }
      return;
    }

    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {editingDomain ? "Edit Domain" : "Create Domain"}
          </SheetTitle>
          <SheetDescription>
            {editingDomain
              ? "Update the domain properties below."
              : "Define a new dictionary domain."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="domain-name">Name *</Label>
            <Input
              id="domain-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Marketing Channels"
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="domain-description">Description</Label>
            <textarea
              id="domain-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this domain..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          {/* Domain Area */}
          <div className="space-y-2">
            <Label htmlFor="domain-area">Domain Area</Label>
            <Input
              id="domain-area"
              value={domainArea}
              onChange={(e) => setDomainArea(e.target.value)}
              placeholder="e.g. Digital Marketing"
            />
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="domain-owner">Owner</Label>
            <Input
              id="domain-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Tom Botting"
            />
          </div>
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Domain
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
