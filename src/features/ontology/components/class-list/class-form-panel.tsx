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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2 } from "lucide-react";
import type {
  OntologyClass,
  OntologyClassInput,
  CustomAttribute,
} from "../../types/ontology";
import { DOMAIN_GROUPS } from "../../types/ontology";

interface ClassFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass: OntologyClass | null;
  onSave: (input: OntologyClassInput) => Promise<{ error?: string }>;
}

const EMPTY_ATTRIBUTE: CustomAttribute = {
  key: "",
  value: "",
  type: "text",
};

export function ClassFormPanel({
  open,
  onOpenChange,
  editingClass,
  onSave,
}: ClassFormPanelProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [domainGroup, setDomainGroup] = React.useState<string>("");
  const [colour, setColour] = React.useState("#6366f1");
  const [iconTag, setIconTag] = React.useState("");
  const [customAttributes, setCustomAttributes] = React.useState<
    CustomAttribute[]
  >([]);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Reset form when editing class changes or panel opens
  React.useEffect(() => {
    if (open) {
      if (editingClass) {
        setName(editingClass.name);
        setDescription(editingClass.description ?? "");
        setDomainGroup(editingClass.domain_group ?? "");
        setColour(editingClass.colour);
        setIconTag(editingClass.icon_tag ?? "");
        setCustomAttributes(
          editingClass.custom_attributes.length > 0
            ? [...editingClass.custom_attributes]
            : []
        );
      } else {
        setName("");
        setDescription("");
        setDomainGroup("");
        setColour("#6366f1");
        setIconTag("");
        setCustomAttributes([]);
      }
      setNameError(null);
    }
  }, [open, editingClass]);

  const handleAddAttribute = () => {
    setCustomAttributes((prev) => [...prev, { ...EMPTY_ATTRIBUTE }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (
    index: number,
    field: keyof CustomAttribute,
    value: string
  ) => {
    setCustomAttributes((prev) =>
      prev.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }

    setNameError(null);
    setIsSaving(true);

    const input: OntologyClassInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      domainGroup: domainGroup || undefined,
      colour,
      iconTag: iconTag.trim() || undefined,
      customAttributes: customAttributes.filter((a) => a.key.trim() !== ""),
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
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {editingClass ? "Edit Class" : "Create Class"}
          </SheetTitle>
          <SheetDescription>
            {editingClass
              ? "Update the class properties below."
              : "Define a new ontology class."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="class-name">Name *</Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Patient, Drug, Study"
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="class-description">Description</Label>
            <textarea
              id="class-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this class represents..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          {/* Domain Group */}
          <div className="space-y-2">
            <Label>Domain Group</Label>
            <Select
              value={domainGroup}
              onValueChange={(val) => setDomainGroup(val as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select domain..." />
              </SelectTrigger>
              <SelectContent>
                {DOMAIN_GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Colour */}
          <div className="space-y-2">
            <Label htmlFor="class-colour">Colour</Label>
            <div className="flex items-center gap-2">
              <input
                id="class-colour"
                type="color"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="h-8 w-10 rounded border border-input cursor-pointer"
              />
              <Input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="flex-1"
                placeholder="#6366f1"
              />
            </div>
          </div>

          {/* Icon Tag */}
          <div className="space-y-2">
            <Label htmlFor="class-icon-tag">Icon Tag</Label>
            <Input
              id="class-icon-tag"
              value={iconTag}
              onChange={(e) => setIconTag(e.target.value)}
              placeholder="e.g. flask, pill, clipboard"
            />
          </div>

          {/* Custom Attributes */}
          <div className="space-y-2">
            <Label>Custom Attributes</Label>
            {customAttributes.map((attr, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  placeholder="Key"
                  value={attr.key}
                  onChange={(e) =>
                    handleAttributeChange(index, "key", e.target.value)
                  }
                  className="flex-1"
                />
                <Select
                  value={attr.type}
                  onValueChange={(val) =>
                    handleAttributeChange(index, "type", val as string)
                  }
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="enum">Enum</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={attr.value}
                  onChange={(e) =>
                    handleAttributeChange(index, "value", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveAttribute(index)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove attribute</span>
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddAttribute}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Attribute
            </Button>
          </div>
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Class
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
