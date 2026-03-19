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
import { RelationshipDataTable } from "./relationships/relationship-data-table";
import { RelationshipForm } from "./relationships/relationship-form";
import { DeleteRelationshipDialog } from "./relationships/delete-relationship-dialog";
import { OntologyGraph } from "./graph/ontology-graph";
import { GraphControls } from "./graph/graph-controls";
import { GraphExport } from "./graph/graph-export";
import { SyncButton } from "./sync/sync-button";
import { useGraphData } from "../hooks/use-graph-data";
import { useOntologySyncStatus } from "../hooks/use-ontology-sync";
import type { Core } from "cytoscape";
import {
  createOntologyClass,
  updateOntologyClass,
  deleteOntologyClass,
  getRelationshipCountForClass,
} from "../actions/class-actions";
import {
  getOntologyRelationships,
  getRelationshipTypes,
  createOntologyRelationship,
  deleteOntologyRelationship,
  createRelationshipType,
} from "../actions/relationship-actions";
import { syncOntologyToCognee } from "../actions/sync-actions";
import type {
  OntologyClass,
  OntologyClassInput,
  OntologyRelationshipWithNames,
  OntologyRelationshipType,
  OntologyRelationshipInput,
} from "../types/ontology";

interface OntologyPageContentProps {
  classes: OntologyClass[];
}

export function OntologyPageContent({ classes }: OntologyPageContentProps) {
  const router = useRouter();

  // Active tab tracking
  const [activeTab, setActiveTab] = React.useState<string>("classes");

  // --- Class state ---
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<OntologyClass | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [deletingClass, setDeletingClass] =
    React.useState<OntologyClass | null>(null);
  const [relationshipCount, setRelationshipCount] = React.useState(0);

  // --- Relationship state ---
  const [relationships, setRelationships] = React.useState<
    OntologyRelationshipWithNames[]
  >([]);
  const [relationshipTypes, setRelationshipTypes] = React.useState<
    OntologyRelationshipType[]
  >([]);
  const [isRelFormOpen, setIsRelFormOpen] = React.useState(false);
  const [isDeleteRelOpen, setIsDeleteRelOpen] = React.useState(false);
  const [deletingRelationship, setDeletingRelationship] =
    React.useState<OntologyRelationshipWithNames | null>(null);

  // --- Sync state ---
  const { isStale, isSyncing, setIsSyncing, checkStaleness } =
    useOntologySyncStatus();

  // --- Graph state ---
  const cyRef = React.useRef<Core | null>(null);
  const [domainFilter, setDomainFilter] = React.useState<string | null>(null);

  // Transform data to Cytoscape elements
  const allElements = useGraphData(classes, relationships);

  // Filter elements by domain group
  const filteredElements = React.useMemo(() => {
    if (!domainFilter) return allElements;

    const visibleNodeIds = new Set<string>();
    const filtered = allElements.filter((el) => {
      if (el.data && !("source" in el.data)) {
        // Node element
        const matches = el.data.domainGroup === domainFilter;
        if (matches) visibleNodeIds.add(el.data.id as string);
        return matches;
      }
      return true; // Keep edges for now
    });

    // Filter edges to only include those between visible nodes
    return filtered.filter((el) => {
      if (el.data && "source" in el.data) {
        return (
          visibleNodeIds.has(el.data.source as string) &&
          visibleNodeIds.has(el.data.target as string)
        );
      }
      return true;
    });
  }, [allElements, domainFilter]);

  // --- Data fetching ---
  const fetchRelationshipData = React.useCallback(async () => {
    const [relResult, typeResult] = await Promise.all([
      getOntologyRelationships(),
      getRelationshipTypes(),
    ]);

    if (relResult.data) {
      setRelationships(relResult.data);
    }
    if (typeResult.data) {
      setRelationshipTypes(typeResult.data);
    }
  }, []);

  // Fetch relationship data on mount
  React.useEffect(() => {
    fetchRelationshipData();
  }, [fetchRelationshipData]);

  // --- Class handlers ---
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
      await fetchRelationshipData();
      await checkStaleness();
      return {};
    } else {
      const result = await createOntologyClass(input);
      if (result.error) {
        toast.error(result.error);
        return { error: result.error };
      }
      toast.success(`Class "${input.name}" created.`);
      router.refresh();
      await checkStaleness();
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
    await fetchRelationshipData();
    await checkStaleness();
  };

  // --- Relationship handlers ---
  const handleAddRelationshipClick = () => {
    setIsRelFormOpen(true);
  };

  const handleRelationshipSave = async (
    input: OntologyRelationshipInput
  ): Promise<{ error?: string }> => {
    const result = await createOntologyRelationship(input);
    if (result.error) {
      toast.error(result.error);
      return { error: result.error };
    }
    toast.success("Relationship created.");
    await fetchRelationshipData();
    router.refresh();
    await checkStaleness();
    return {};
  };

  const handleRelationshipDeleteClick = (
    rel: OntologyRelationshipWithNames
  ) => {
    setDeletingRelationship(rel);
    setIsDeleteRelOpen(true);
  };

  const handleRelationshipDeleteConfirm = async () => {
    if (!deletingRelationship) return;

    const result = await deleteOntologyRelationship(deletingRelationship.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Relationship deleted.");
    await fetchRelationshipData();
    router.refresh();
    await checkStaleness();
  };

  const handleCreateRelationType = async (name: string) => {
    const result = await createRelationshipType(name);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Relationship type "${name}" created.`);
    await fetchRelationshipData();
  };

  // --- Sync handler ---
  const handleSync = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncOntologyToCognee();
      if (result.error) {
        toast.error(
          `Sync failed: ${result.error}. Check the Cognee connection status on the dashboard and try again.`,
          { duration: Infinity }
        );
        return;
      }
      toast.success("Ontology synced to Cognee", { duration: 4000 });
      await checkStaleness();
    } catch {
      toast.error(
        "Sync failed: unexpected error. Check the Cognee connection status on the dashboard and try again.",
        { duration: Infinity }
      );
    } finally {
      setIsSyncing(false);
    }
  }, [setIsSyncing, checkStaleness]);

  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // --- Graph handlers ---
  const handleSearch = React.useCallback(
    (classId: string | null) => {
      if (!classId || !cyRef.current) return;
      const cy = cyRef.current;
      const node = cy.getElementById(classId);
      if (node.length > 0) {
        cy.animate({
          fit: { eles: node, padding: 100 },
          duration: 300,
        });
      }
    },
    []
  );

  const handleGraphNodeClick = React.useCallback(
    (nodeId: string) => {
      // Switch to Classes tab and open the edit panel for that class
      const cls = classes.find((c) => c.id === nodeId);
      if (cls) {
        setActiveTab("classes");
        setEditingClass(cls);
        setIsFormOpen(true);
      }
    },
    [classes]
  );

  // --- Content ---
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
    <RelationshipDataTable
      data={relationships}
      classes={classes}
      relationshipTypes={relationshipTypes}
      onDelete={handleRelationshipDeleteClick}
    />
  );

  const graphContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GraphControls
          cyRef={cyRef}
          classes={classes}
          onDomainFilter={setDomainFilter}
          onSearch={handleSearch}
        />
        <GraphExport cyRef={cyRef} />
      </div>
      <div className="h-[600px] border rounded-lg">
        <OntologyGraph
          ref={cyRef}
          elements={filteredElements}
          onNodeClick={handleGraphNodeClick}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold leading-[1.2]">
          Ontology Editor
        </h1>
        <div className="flex items-center gap-2">
          <SyncButton
            isStale={isStale}
            isSyncing={isSyncing}
            onSync={handleSync}
          />
          {activeTab === "classes" && (
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Class
            </Button>
          )}
          {activeTab === "relationships" && (
            <Button onClick={handleAddRelationshipClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Relationship
            </Button>
          )}
        </div>
      </div>

      <OntologyTabs
        classesContent={classesContent}
        relationshipsContent={relationshipsContent}
        graphContent={graphContent}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Class form panel */}
      <ClassFormPanel
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingClass={editingClass}
        onSave={handleSave}
      />

      {/* Class delete dialog */}
      <DeleteClassDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        className_={deletingClass?.name ?? ""}
        relationshipCount={relationshipCount}
        onConfirm={handleDeleteConfirm}
      />

      {/* Relationship form dialog */}
      <RelationshipForm
        open={isRelFormOpen}
        onOpenChange={setIsRelFormOpen}
        classes={classes}
        relationshipTypes={relationshipTypes}
        onSave={handleRelationshipSave}
        onCreateType={handleCreateRelationType}
      />

      {/* Relationship delete dialog */}
      <DeleteRelationshipDialog
        open={isDeleteRelOpen}
        onOpenChange={setIsDeleteRelOpen}
        relationship={deletingRelationship}
        onConfirm={handleRelationshipDeleteConfirm}
      />
    </div>
  );
}
