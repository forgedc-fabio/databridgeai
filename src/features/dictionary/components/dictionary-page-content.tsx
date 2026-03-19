"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DictionaryTabs } from "./dictionary-tabs";
import { DomainDataTable } from "./domains/domain-data-table";
import { DomainFormPanel } from "./domains/domain-form-panel";
import { DomainEmptyState } from "./domains/domain-empty-state";
import { DeleteDomainDialog } from "./domains/delete-domain-dialog";
import { FieldDataTable } from "./fields/field-data-table";
import { FieldFormPanel } from "./fields/field-form-panel";
import { FieldEmptyState } from "./fields/field-empty-state";
import { DeleteFieldDialog } from "./fields/delete-field-dialog";
import {
  createDictionaryDomain,
  updateDictionaryDomain,
  deleteDictionaryDomain,
  reorderDomains,
  getFieldCountForDomain,
} from "../actions/domain-actions";
import {
  createDictionaryField,
  updateDictionaryField,
  deleteDictionaryField,
  checkMatchTableExists,
} from "../actions/field-actions";
import type {
  DictionaryDomain,
  DictionaryDomainInput,
  DictionaryFieldInput,
  DictionaryFieldWithDomains,
  DictionaryVersion,
} from "../types/dictionary";

interface DictionaryPageContentProps {
  domains: DictionaryDomain[];
  fields: DictionaryFieldWithDomains[];
  versions: DictionaryVersion[];
}

export function DictionaryPageContent({
  domains,
  fields,
  versions,
}: DictionaryPageContentProps) {
  const router = useRouter();

  // Active tab tracking
  const [activeTab, setActiveTab] = React.useState<string>("fields");

  // --- Field state ---
  const [isFieldFormOpen, setIsFieldFormOpen] = React.useState(false);
  const [editingField, setEditingField] =
    React.useState<DictionaryFieldWithDomains | null>(null);
  const [isDeleteFieldOpen, setIsDeleteFieldOpen] = React.useState(false);
  const [deletingField, setDeletingField] =
    React.useState<DictionaryFieldWithDomains | null>(null);
  const [matchTableExists, setMatchTableExists] = React.useState(false);

  // --- Domain state ---
  const [isDomainFormOpen, setIsDomainFormOpen] = React.useState(false);
  const [editingDomain, setEditingDomain] =
    React.useState<DictionaryDomain | null>(null);
  const [isDeleteDomainOpen, setIsDeleteDomainOpen] = React.useState(false);
  const [deletingDomain, setDeletingDomain] =
    React.useState<DictionaryDomain | null>(null);
  const [domainFieldCount, setDomainFieldCount] = React.useState(0);

  // Build field counts per domain from fields data
  const fieldCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const field of fields) {
      for (const domainId of field.domain_ids) {
        counts[domainId] = (counts[domainId] ?? 0) + 1;
      }
    }
    return counts;
  }, [fields]);

  // --- Tab change ---
  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // --- Field handlers ---
  const handleCreateFieldClick = () => {
    setEditingField(null);
    setMatchTableExists(false);
    setIsFieldFormOpen(true);
  };

  const handleFieldRowClick = async (field: DictionaryFieldWithDomains) => {
    setEditingField(field);

    // Check match table existence for Picklist fields
    if (field.value_type === "Picklist") {
      const exists = await checkMatchTableExists(field.id);
      setMatchTableExists(exists);
    } else {
      setMatchTableExists(false);
    }

    setIsFieldFormOpen(true);
  };

  const handleFieldDeleteClick = (field: DictionaryFieldWithDomains) => {
    setDeletingField(field);
    setIsDeleteFieldOpen(true);
  };

  const handleFieldSave = async (
    input: DictionaryFieldInput
  ): Promise<{ error?: string; fieldId?: string }> => {
    if (editingField) {
      const result = await updateDictionaryField(editingField.id, input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Field "${input.fieldName}" updated.`);
      router.refresh();
      return { fieldId: editingField.id };
    } else {
      const result = await createDictionaryField(input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Field "${input.fieldName}" created.`);
      router.refresh();
      return { fieldId: result.data?.id };
    }
  };

  const handleFieldDeleteConfirm = async () => {
    if (!deletingField) return;

    const result = await deleteDictionaryField(deletingField.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Field "${deletingField.field_name}" deleted.`);
    router.refresh();
  };

  // --- Domain handlers ---
  const handleCreateDomainClick = () => {
    setEditingDomain(null);
    setIsDomainFormOpen(true);
  };

  const handleDomainRowClick = (domain: DictionaryDomain) => {
    setEditingDomain(domain);
    setIsDomainFormOpen(true);
  };

  const handleDomainDeleteClick = async (domain: DictionaryDomain) => {
    setDeletingDomain(domain);
    const count = await getFieldCountForDomain(domain.id);
    setDomainFieldCount(count);
    setIsDeleteDomainOpen(true);
  };

  const handleDomainSave = async (
    input: DictionaryDomainInput
  ): Promise<{ error?: string }> => {
    if (editingDomain) {
      const result = await updateDictionaryDomain(editingDomain.id, input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Domain "${input.name}" updated.`);
      router.refresh();
      return {};
    } else {
      const result = await createDictionaryDomain(input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Domain "${input.name}" created.`);
      router.refresh();
      return {};
    }
  };

  const handleDomainDeleteConfirm = async () => {
    if (!deletingDomain) return;

    const result = await deleteDictionaryDomain(deletingDomain.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Domain "${deletingDomain.name}" deleted${
        result.data?.unlinkedFields && result.data.unlinkedFields > 0
          ? ` (${result.data.unlinkedFields} field(s) unassigned)`
          : ""
      }.`
    );
    router.refresh();
  };

  const handleDomainReorder = async (
    orderedIds: { id: string; display_order: number }[]
  ) => {
    const result = await reorderDomains(orderedIds);
    if (result.error) {
      toast.error("Failed to reorder domains.");
      return;
    }
    router.refresh();
  };

  // --- Content ---
  const fieldsContent =
    fields.length === 0 ? (
      <FieldEmptyState
        domainsExist={domains.length > 0}
        onCreateFieldClick={handleCreateFieldClick}
        onCreateDomainClick={handleCreateDomainClick}
      />
    ) : (
      <FieldDataTable
        fields={fields}
        domains={domains}
        onRowClick={handleFieldRowClick}
        onDelete={handleFieldDeleteClick}
        editingFieldId={editingField?.id}
      />
    );

  const domainsContent =
    domains.length === 0 ? (
      <DomainEmptyState onCreateClick={handleCreateDomainClick} />
    ) : (
      <DomainDataTable
        data={domains}
        fieldCounts={fieldCounts}
        onRowClick={handleDomainRowClick}
        onDelete={handleDomainDeleteClick}
        onReorder={handleDomainReorder}
        editingDomainId={editingDomain?.id}
      />
    );

  const visualisationContent = (
    <div className="text-muted-foreground text-center py-16">
      Visualisation -- coming soon
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold leading-[1.2]">
          Data Dictionary
        </h1>
        <div className="flex items-center gap-2">
          {/* Version dropdown placeholder — wired in Plan 03 */}
          {activeTab === "fields" && (
            <Button onClick={handleCreateFieldClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Field
            </Button>
          )}
          {activeTab === "domains" && (
            <Button onClick={handleCreateDomainClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          )}
        </div>
      </div>

      <DictionaryTabs
        fieldsContent={fieldsContent}
        domainsContent={domainsContent}
        visualisationContent={visualisationContent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Field form panel */}
      <FieldFormPanel
        open={isFieldFormOpen}
        onOpenChange={setIsFieldFormOpen}
        editingField={editingField}
        domains={domains}
        allFields={fields}
        onSave={handleFieldSave}
        matchTableExists={matchTableExists}
      />

      {/* Field delete dialog */}
      <DeleteFieldDialog
        open={isDeleteFieldOpen}
        onOpenChange={setIsDeleteFieldOpen}
        fieldName={deletingField?.field_name ?? ""}
        onConfirm={handleFieldDeleteConfirm}
      />

      {/* Domain form panel */}
      <DomainFormPanel
        open={isDomainFormOpen}
        onOpenChange={setIsDomainFormOpen}
        editingDomain={editingDomain}
        onSave={handleDomainSave}
      />

      {/* Domain delete dialog */}
      <DeleteDomainDialog
        open={isDeleteDomainOpen}
        onOpenChange={setIsDeleteDomainOpen}
        domainName={deletingDomain?.name ?? ""}
        fieldCount={domainFieldCount}
        onConfirm={handleDomainDeleteConfirm}
      />
    </div>
  );
}
