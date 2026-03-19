"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OntologyTabs } from "./ontology-tabs";
import { ClassDataTable } from "./class-list/class-data-table";
import { ClassFormPanel } from "./class-list/class-form-panel";
import { ClassEmptyState } from "./class-list/class-empty-state";
import { DeleteClassDialog } from "./delete-class-dialog";
import {
  createOntologyClass,
  updateOntologyClass,
  deleteOntologyClass,
  getRelationshipCountForClass,
} from "../actions/class-actions";
import type { OntologyClass, OntologyClassInput } from "../types/ontology";

interface OntologyPageContentProps {
  classes: OntologyClass[];
}

export function OntologyPageContent({ classes }: OntologyPageContentProps) {
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<OntologyClass | null>(
    null
  );

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingClass, setDeletingClass] =
    React.useState<OntologyClass | null>(null);
  const [relationshipCount, setRelationshipCount] = React.useState(0);

  const handleCreateClick = () => {
    setEditingClass(null);
    setIsFormOpen(true);
  };

  const handleRowClick = (cls: OntologyClass) => {
    setEditingClass(cls);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (cls: OntologyClass) => {
    setDeletingClass(cls);
    const count = await getRelationshipCountForClass(cls.id);
    setRelationshipCount(count);
    setIsDeleteOpen(true);
  };

  const handleSave = async (
    input: OntologyClassInput
  ): Promise<{ error?: string }> => {
    if (editingClass) {
      const result = await updateOntologyClass(editingClass.id, input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Class "${input.name}" updated.`);
      router.refresh();
      return {};
    } else {
      const result = await createOntologyClass(input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Class "${input.name}" created.`);
      router.refresh();
      return {};
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;

    const result = await deleteOntologyClass(deletingClass.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      `Class "${deletingClass.name}" deleted${
        result.data.deletedRelationships > 0
          ? ` (${result.data.deletedRelationships} relationship(s) removed)`
          : ""
      }.`
    );
    router.refresh();
  };

  const classesContent =
    classes.length === 0 ? (
      <ClassEmptyState onCreateClick={handleCreateClick} />
    ) : (
      <ClassDataTable
        data={classes}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        editingClassId={editingClass?.id}
      />
    );

  const relationshipsContent = (
    <p className="text-muted-foreground p-8">
      Relationship editor &mdash; coming in the next plan.
    </p>
  );

  const graphContent = (
    <p className="text-muted-foreground p-8">
      Graph visualisation &mdash; coming in a future plan.
    </p>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold leading-[1.2]">
          Ontology Editor
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled title="Sync to Cognee">
            Sync to Cognee
          </Button>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        </div>
      </div>

      <OntologyTabs
        classesContent={classesContent}
        relationshipsContent={relationshipsContent}
        graphContent={graphContent}
      />

      <ClassFormPanel
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingClass={editingClass}
        onSave={handleSave}
      />

      <DeleteClassDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        className_={deletingClass?.name ?? ""}
        relationshipCount={relationshipCount}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
