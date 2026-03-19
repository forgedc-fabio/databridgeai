"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Maximize2 } from "lucide-react";
import Link from "next/link";
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
import { VersionDropdown } from "./versioning/version-dropdown";
import { VersionBanner } from "./versioning/version-banner";
import { PublishVersionDialog } from "./versioning/publish-version-dialog";
import { DiffViewDialog } from "./versioning/diff-view-dialog";
import {
  DictionaryGraph,
  type DictionaryGraphHandle,
} from "./visualisation/dictionary-graph";
import { GraphControls } from "./visualisation/graph-controls";
import { TreeView } from "./visualisation/tree-view";
import { useGraphData } from "../hooks/use-graph-data";
import { useDictionaryVersion } from "../hooks/use-dictionary-version";
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
import { publishDictionaryVersion } from "../actions/version-actions";
import {
  getAllConcatenatedRefs,
  getAllPicklistValues,
} from "../actions/value-actions";
import type {
  DictionaryConcatenatedRef,
  DictionaryDomain,
  DictionaryDomainInput,
  DictionaryFieldInput,
  DictionaryFieldWithDomains,
  DictionaryVersion,
} from "../types/dictionary";

type VersionSummary = Pick<
  DictionaryVersion,
  "id" | "version_number" | "label" | "published_at"
>;

interface DictionaryPageContentProps {
  domains: DictionaryDomain[];
  fields: DictionaryFieldWithDomains[];
  versions: VersionSummary[];
}

export function DictionaryPageContent({
  domains,
  fields,
  versions: initialVersions,
}: DictionaryPageContentProps) {
  const router = useRouter();

  // Active tab tracking
  const [activeTab, setActiveTab] = React.useState<string>("fields");

  // --- Versioning state ---
  const {
    versions,
    viewingVersionId,
    viewingSnapshot,
    isReadOnly,
    viewVersion,
    switchToDraft,
    refreshVersions,
  } = useDictionaryVersion(initialVersions);

  const [isPublishDialogOpen, setIsPublishDialogOpen] = React.useState(false);
  const [isDiffDialogOpen, setIsDiffDialogOpen] = React.useState(false);

  // Get the current version info for banner
  const currentViewingVersion = viewingVersionId
    ? versions.find((v) => v.id === viewingVersionId)
    : null;

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

  // --- Visualisation state ---
  const graphRef = React.useRef<DictionaryGraphHandle>(null);
  const [visualisationMode, setVisualisationMode] = React.useState<
    "graph" | "tree"
  >("graph");
  const [domainFilter, setDomainFilter] = React.useState<string | null>(
    null
  );
  const [concatenatedRefs, setConcatenatedRefs] = React.useState<
    DictionaryConcatenatedRef[]
  >([]);
  const [picklistValuesMap, setPicklistValuesMap] = React.useState<
    Record<string, Array<{ value: string; definition: string | null }>>
  >({});

  // Fetch concatenated refs and picklist values for visualisation
  React.useEffect(() => {
    async function fetchVisualisationData() {
      const [refsResult, pvResult] = await Promise.all([
        getAllConcatenatedRefs(),
        getAllPicklistValues(),
      ]);

      if (refsResult.data) {
        setConcatenatedRefs(refsResult.data);
      }

      if (pvResult.data) {
        const map: Record<
          string,
          Array<{ value: string; definition: string | null }>
        > = {};
        pvResult.data.forEach((pv) => {
          if (!map[pv.field_id]) map[pv.field_id] = [];
          map[pv.field_id].push({
            value: pv.value,
            definition: pv.definition,
          });
        });
        setPicklistValuesMap(map);
      }
    }

    fetchVisualisationData();
  }, []);

  // Graph data
  const graphData = useGraphData(domains, fields, concatenatedRefs);

  // Filtered graph data based on domain filter
  const filteredGraphData = React.useMemo(() => {
    if (!domainFilter) return graphData;

    const visibleNodeIds = new Set<string>();
    visibleNodeIds.add(`domain-${domainFilter}`);

    const filteredNodes = graphData.nodes.filter((node) => {
      if (node.type === "domain") {
        const matches = node.id === `domain-${domainFilter}`;
        if (matches) visibleNodeIds.add(node.id);
        return matches;
      }
      const matches = node.domainId === domainFilter;
      if (matches) visibleNodeIds.add(node.id);
      return matches;
    });

    const filteredLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === "object"
          ? (link.source as { id: string }).id
          : String(link.source);
      const targetId =
        typeof link.target === "object"
          ? (link.target as { id: string }).id
          : String(link.target);
      return (
        visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)
      );
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, domainFilter]);

  // Graph search: zoom to fit (simple implementation)
  const handleGraphSearch = React.useCallback(
    (fieldId: string | null) => {
      if (!fieldId) return;
      graphRef.current?.zoomToFit();
    },
    []
  );

  const handleZoomToFit = React.useCallback(() => {
    graphRef.current?.zoomToFit();
  }, []);

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

  // --- Version handlers ---
  const handlePublish = async (label?: string) => {
    const result = await publishDictionaryVersion(label);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Version v${result.data?.versionNumber} published.`);
    await refreshVersions();
    router.refresh();
  };

  // --- Field handlers ---
  const handleCreateFieldClick = () => {
    if (isReadOnly) return;
    setEditingField(null);
    setMatchTableExists(false);
    setIsFieldFormOpen(true);
  };

  const handleFieldRowClick = async (field: DictionaryFieldWithDomains) => {
    if (isReadOnly) return;
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

  // Graph node click: navigate to Fields tab and open field edit panel
  const handleGraphNodeClick = React.useCallback(
    (node: { id: string; type: string }) => {
      if (node.type !== "field") return;
      const fieldId = node.id.replace("field-", "");
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        setActiveTab("fields");
        handleFieldRowClick(field);
      }
    },
    [fields, handleFieldRowClick]
  );

  // Tree field click: navigate to Fields tab and open field edit panel
  const handleTreeFieldClick = React.useCallback(
    (field: DictionaryFieldWithDomains) => {
      setActiveTab("fields");
      handleFieldRowClick(field);
    },
    [handleFieldRowClick]
  );

  const handleFieldDeleteClick = (field: DictionaryFieldWithDomains) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    setEditingDomain(null);
    setIsDomainFormOpen(true);
  };

  const handleDomainRowClick = (domain: DictionaryDomain) => {
    if (isReadOnly) return;
    setEditingDomain(domain);
    setIsDomainFormOpen(true);
  };

  const handleDomainDeleteClick = async (domain: DictionaryDomain) => {
    if (isReadOnly) return;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <GraphControls
          domains={domains}
          fields={fields}
          onDomainFilter={setDomainFilter}
          onSearch={handleGraphSearch}
          onZoomToFit={handleZoomToFit}
        />
        <div className="flex items-center gap-2">
          <Link
            href="/dictionary/visualisation"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            title="View Full Screen"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
          {/* Segmented control: Graph | Tree */}
          <div className="inline-flex rounded-md border">
            <Button
              variant={
                visualisationMode === "graph" ? "secondary" : "ghost"
              }
              size="sm"
              onClick={() => setVisualisationMode("graph")}
            >
              Graph
            </Button>
            <Button
              variant={
                visualisationMode === "tree" ? "secondary" : "ghost"
              }
              size="sm"
              onClick={() => setVisualisationMode("tree")}
            >
              Tree
            </Button>
          </div>
        </div>
      </div>
      {visualisationMode === "graph" ? (
        <div className="h-[600px] border rounded-lg">
          <DictionaryGraph
            ref={graphRef}
            graphData={filteredGraphData}
            height={600}
            onNodeClick={handleGraphNodeClick}
          />
        </div>
      ) : (
        <TreeView
          domains={domains}
          fields={fields}
          picklistValues={picklistValuesMap}
          onFieldClick={handleTreeFieldClick}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold leading-[1.2]">
          Data Dictionary
        </h1>
        <div className="flex items-center gap-2">
          {/* Version dropdown */}
          <VersionDropdown
            versions={versions}
            currentVersionId={viewingVersionId}
            isReadOnly={isReadOnly}
            onViewVersion={viewVersion}
            onSwitchToDraft={switchToDraft}
            onPublish={() => setIsPublishDialogOpen(true)}
            onCompare={() => setIsDiffDialogOpen(true)}
          />
          {activeTab === "fields" && !isReadOnly && (
            <Button onClick={handleCreateFieldClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Field
            </Button>
          )}
          {activeTab === "domains" && !isReadOnly && (
            <Button onClick={handleCreateDomainClick}>
              <Plus className="mr-2 h-4 w-4" />
              Add Domain
            </Button>
          )}
        </div>
      </div>

      {/* Version banner when viewing published version */}
      {isReadOnly && currentViewingVersion && (
        <VersionBanner
          versionNumber={currentViewingVersion.version_number}
          label={currentViewingVersion.label}
          onSwitchToDraft={switchToDraft}
        />
      )}

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

      {/* Version dialogs */}
      <PublishVersionDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
        onPublish={handlePublish}
      />

      <DiffViewDialog
        open={isDiffDialogOpen}
        onOpenChange={setIsDiffDialogOpen}
        versions={versions}
      />
    </div>
  );
}
