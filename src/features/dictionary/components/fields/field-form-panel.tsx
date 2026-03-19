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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Loader2, Plus, X } from "lucide-react";
import {
  VALUE_TYPES,
  TAGGING_METHODS,
  DOMAIN_COLOUR_PALETTE,
} from "../../lib/constants";
import { toTitleCase, validateFieldName } from "../../lib/validators";
import { getPicklistValues, getConcatenatedRefs } from "../../actions/value-actions";
import { savePicklistValues, saveConcatenatedRefs } from "../../actions/value-actions";
import { uploadMatchTable } from "../../actions/match-table-actions";
import { PicklistValuesDialog } from "./picklist-values-dialog";
import { ConcatenatedFieldsDialog } from "./concatenated-fields-dialog";
import { MatchTableUploadDialog } from "./match-table-upload-dialog";
import type {
  DictionaryDomain,
  DictionaryField,
  DictionaryFieldInput,
  DictionaryFieldWithDomains,
  PicklistValueInput,
  ConcatenatedRefInput,
} from "../../types/dictionary";

interface FieldFormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingField: DictionaryFieldWithDomains | null;
  domains: DictionaryDomain[];
  allFields: DictionaryField[];
  onSave: (input: DictionaryFieldInput) => Promise<{ error?: string; fieldId?: string }>;
  matchTableExists: boolean;
}

export function FieldFormPanel({
  open,
  onOpenChange,
  editingField,
  domains,
  allFields,
  onSave,
  matchTableExists,
}: FieldFormPanelProps) {
  const [fieldName, setFieldName] = React.useState("");
  const [fieldDefinition, setFieldDefinition] = React.useState("");
  const [valueType, setValueType] = React.useState<string>("Text");
  const [taggingMethod, setTaggingMethod] = React.useState<string>(
    "AI Inferred"
  );
  const [selectedDomainIds, setSelectedDomainIds] = React.useState<string[]>(
    []
  );
  const [aiInstruction, setAiInstruction] = React.useState("");
  const [controlled, setControlled] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = React.useState(false);

  // Nested dialog state
  const [isPicklistDialogOpen, setIsPicklistDialogOpen] = React.useState(false);
  const [isConcatDialogOpen, setIsConcatDialogOpen] = React.useState(false);
  const [isMatchTableDialogOpen, setIsMatchTableDialogOpen] = React.useState(false);

  // Value state
  const [picklistValues, setPicklistValues] = React.useState<PicklistValueInput[]>([]);
  const [concatenatedRefs, setConcatenatedRefs] = React.useState<ConcatenatedRefInput[]>([]);

  // Reset form when editingField or open changes
  React.useEffect(() => {
    if (open) {
      if (editingField) {
        setFieldName(editingField.field_name);
        setFieldDefinition(editingField.field_definition ?? "");
        setValueType(editingField.value_type);
        setTaggingMethod(editingField.tagging_method);
        setSelectedDomainIds([...editingField.domain_ids]);
        setAiInstruction(editingField.ai_instruction ?? "");
        setControlled(editingField.controlled);

        // Load sub-entity data for editing
        if (editingField.value_type === "Picklist") {
          getPicklistValues(editingField.id).then((result) => {
            if (result.data) {
              setPicklistValues(
                result.data.map((v) => ({
                  value: v.value,
                  definition: v.definition ?? undefined,
                }))
              );
            }
          });
        } else {
          setPicklistValues([]);
        }

        if (editingField.value_type === "Concatenated") {
          getConcatenatedRefs(editingField.id).then((result) => {
            if (result.data) {
              setConcatenatedRefs(
                result.data.map((r) => ({
                  referencedFieldId: r.referenced_field_id,
                  position: r.position,
                }))
              );
            }
          });
        } else {
          setConcatenatedRefs([]);
        }
      } else {
        setFieldName("");
        setFieldDefinition("");
        setValueType("Text");
        setTaggingMethod("AI Inferred");
        setSelectedDomainIds([]);
        setAiInstruction("");
        setControlled(false);
        setPicklistValues([]);
        setConcatenatedRefs([]);
      }
      setNameError(null);
      setShowDomainDropdown(false);
    }
  }, [open, editingField]);

  const handleFieldNameBlur = () => {
    setFieldName(toTitleCase(fieldName));
  };

  const handleSave = async () => {
    const validationError = validateFieldName(fieldName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setNameError(null);
    setIsSaving(true);

    const input: DictionaryFieldInput = {
      fieldName: fieldName.trim(),
      fieldDefinition: fieldDefinition.trim() || undefined,
      valueType: valueType as DictionaryFieldInput["valueType"],
      taggingMethod: taggingMethod as DictionaryFieldInput["taggingMethod"],
      aiInstruction: aiInstruction.trim() || undefined,
      controlled: valueType === "Picklist" ? controlled : false,
      domainIds:
        selectedDomainIds.length > 0 ? selectedDomainIds : undefined,
    };

    const result = await onSave(input);
    setIsSaving(false);

    if (result?.error) {
      if (result.error.includes("already exists")) {
        setNameError(result.error);
      }
      return;
    }

    // Save sub-entity data after field save
    const fieldId = result.fieldId ?? editingField?.id;
    if (fieldId) {
      if (valueType === "Picklist" && picklistValues.length > 0) {
        await savePicklistValues(fieldId, picklistValues);
      }
      if (valueType === "Concatenated" && concatenatedRefs.length > 0) {
        await saveConcatenatedRefs(fieldId, concatenatedRefs);
      }
    }

    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const handlePicklistSave = (values: PicklistValueInput[]) => {
    setPicklistValues(values);
  };

  const handleConcatenatedSave = (refs: ConcatenatedRefInput[]) => {
    setConcatenatedRefs(refs);
  };

  const handleMatchTableUpload = async (
    columns: string[],
    data: Record<string, string>[]
  ) => {
    if (editingField) {
      await uploadMatchTable(editingField.id, columns, data);
    }
  };

  const availableDomains = domains.filter(
    (d) => !selectedDomainIds.includes(d.id)
  );

  const addDomain = (domainId: string) => {
    setSelectedDomainIds((prev) => [...prev, domainId]);
    setShowDomainDropdown(false);
  };

  const removeDomain = (domainId: string) => {
    setSelectedDomainIds((prev) => prev.filter((id) => id !== domainId));
  };

  // Build concatenated preview from refs
  const concatenatedPreview = concatenatedRefs
    .filter((r) => r.referencedFieldId)
    .slice(0, 2)
    .map((r) => {
      const field = allFields.find((f) => f.id === r.referencedFieldId);
      return field?.field_name ?? "Unknown";
    })
    .join(" | ");

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] sm:max-w-[480px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {editingField ? "Edit Field" : "Create Field"}
          </SheetTitle>
          <SheetDescription>
            {editingField
              ? "Update the field properties below."
              : "Define a new dictionary field."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Field Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name *</Label>
            <Input
              id="field-name"
              value={fieldName}
              onChange={(e) => {
                setFieldName(e.target.value);
                if (nameError) setNameError(null);
              }}
              onBlur={handleFieldNameBlur}
              placeholder="e.g. Brand Name"
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          {/* Field Definition */}
          <div className="space-y-2">
            <Label htmlFor="field-definition">Field Definition</Label>
            <textarea
              id="field-definition"
              value={fieldDefinition}
              onChange={(e) => setFieldDefinition(e.target.value)}
              placeholder="Describe what this field represents. This is sent to the AI for classification context."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          {/* Value Type */}
          <div className="space-y-2">
            <Label>Value Type *</Label>
            <Select
              value={valueType}
              onValueChange={(val) => setValueType(val as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select value type..." />
              </SelectTrigger>
              <SelectContent>
                {VALUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tagging Method */}
          <div className="space-y-2">
            <Label>Tagging Method *</Label>
            <Select
              value={taggingMethod}
              onValueChange={(val) => setTaggingMethod(val as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select tagging method..." />
              </SelectTrigger>
              <SelectContent>
                {TAGGING_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Domain Assignment */}
          <div className="space-y-2">
            <Label>Domain Assignment</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedDomainIds.map((domainId) => {
                const domain = domains.find((d) => d.id === domainId);
                if (!domain) return null;
                const colourIndex =
                  domain.display_order % DOMAIN_COLOUR_PALETTE.length;
                return (
                  <Badge
                    key={domainId}
                    variant="secondary"
                    className="text-xs gap-1"
                    style={{
                      backgroundColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}20`,
                      color: DOMAIN_COLOUR_PALETTE[colourIndex],
                      borderColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}40`,
                    }}
                  >
                    {domain.name}
                    <button
                      type="button"
                      onClick={() => removeDomain(domainId)}
                      className="ml-0.5 hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">
                        Remove {domain.name}
                      </span>
                    </button>
                  </Badge>
                );
              })}
              {availableDomains.length > 0 && (
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                  >
                    <Plus className="h-3 w-3" />
                    <span className="sr-only">Add domain</span>
                  </Button>
                  {showDomainDropdown && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
                      {availableDomains.map((domain) => (
                        <button
                          key={domain.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => addDomain(domain.id)}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                DOMAIN_COLOUR_PALETTE[
                                  domain.display_order %
                                    DOMAIN_COLOUR_PALETTE.length
                                ],
                            }}
                          />
                          {domain.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Instruction */}
          <div className="space-y-2">
            <Label htmlFor="ai-instruction">AI Instruction</Label>
            <textarea
              id="ai-instruction"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="Additional rules for the AI beyond the field definition."
              rows={2}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
            />
          </div>

          {/* Controlled checkbox — only for Picklist with match table */}
          {valueType === "Picklist" && matchTableExists && (
            <div className="flex items-center gap-2">
              <input
                id="field-controlled"
                type="checkbox"
                checked={controlled}
                onChange={(e) => setControlled(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="field-controlled" className="text-sm font-normal">
                Controlled by match table
              </Label>
            </div>
          )}

          {/* Conditional sections for Picklist / Concatenated */}
          {valueType === "Picklist" && (
            <div className="pt-2 border-t space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPicklistDialogOpen(true)}
              >
                Manage Values ({picklistValues.length})
              </Button>

              {/* Match table upload — show when Picklist + controlled but no match table */}
              {controlled && !matchTableExists && editingField && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
                  <p className="text-muted-foreground mb-2">
                    No match table uploaded. Upload a CSV to define controlled values.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMatchTableDialogOpen(true)}
                  >
                    Upload CSV
                  </Button>
                </div>
              )}

              {/* Also show upload option when match table doesn't exist, regardless of controlled */}
              {!matchTableExists && editingField && !controlled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsMatchTableDialogOpen(true)}
                >
                  Upload Match Table CSV
                </Button>
              )}
            </div>
          )}

          {valueType === "Concatenated" && (
            <div className="pt-2 border-t space-y-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsConcatDialogOpen(true)}
              >
                Configure Fields ({concatenatedRefs.length})
              </Button>
              {concatenatedPreview && (
                <p className="text-xs text-muted-foreground px-1">
                  {concatenatedPreview}
                  {concatenatedRefs.length > 2 ? " ..." : ""}
                </p>
              )}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Field
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Nested dialogs */}
      <PicklistValuesDialog
        open={isPicklistDialogOpen}
        onOpenChange={setIsPicklistDialogOpen}
        fieldName={fieldName}
        fieldId={editingField?.id ?? null}
        initialValues={picklistValues}
        onSave={handlePicklistSave}
      />

      <ConcatenatedFieldsDialog
        open={isConcatDialogOpen}
        onOpenChange={setIsConcatDialogOpen}
        fieldName={fieldName}
        currentFieldId={editingField?.id ?? null}
        availableFields={allFields}
        initialRefs={concatenatedRefs}
        onSave={handleConcatenatedSave}
      />

      {editingField && (
        <MatchTableUploadDialog
          open={isMatchTableDialogOpen}
          onOpenChange={setIsMatchTableDialogOpen}
          fieldId={editingField.id}
          onUpload={handleMatchTableUpload}
        />
      )}
    </Sheet>
  );
}
