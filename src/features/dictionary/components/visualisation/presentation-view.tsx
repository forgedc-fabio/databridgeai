"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DictionaryGraph,
  type DictionaryGraphHandle,
} from "./dictionary-graph";
import { useGraphData } from "../../hooks/use-graph-data";
import type {
  DictionaryDomain,
  DictionaryFieldWithDomains,
  DictionaryConcatenatedRef,
} from "../../types/dictionary";

interface PresentationViewProps {
  domains: DictionaryDomain[];
  fields: DictionaryFieldWithDomains[];
  concatenatedRefs: DictionaryConcatenatedRef[];
}

export function PresentationView({
  domains,
  fields,
  concatenatedRefs,
}: PresentationViewProps) {
  const graphRef = React.useRef<DictionaryGraphHandle>(null);
  const graphData = useGraphData(domains, fields, concatenatedRefs);

  // Domain filter state
  const [domainFilter, setDomainFilter] = React.useState<string | null>(
    null
  );

  // Search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Sort domains by display_order
  const sortedDomains = React.useMemo(
    () => [...domains].sort((a, b) => a.display_order - b.display_order),
    [domains]
  );

  // Filtered graph data based on domain
  const filteredGraphData = React.useMemo(() => {
    if (!domainFilter) return graphData;

    const visibleNodeIds = new Set<string>();

    // Always include the filtered domain node
    visibleNodeIds.add(`domain-${domainFilter}`);

    const filteredNodes = graphData.nodes.filter((node) => {
      if (node.type === "domain") {
        const matches = node.id === `domain-${domainFilter}`;
        if (matches) visibleNodeIds.add(node.id);
        return matches;
      }
      // Field nodes: show if they belong to the filtered domain
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
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, domainFilter]);

  // Search autocomplete
  const filteredFields = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return fields.filter((f) =>
      f.field_name.toLowerCase().includes(q)
    );
  }, [fields, searchQuery]);

  const handleDomainChange = React.useCallback(
    (value: string | null) => {
      setDomainFilter(!value || value === "all" ? null : value);
    },
    []
  );

  const handleSearchSelect = React.useCallback(
    (_fieldId: string) => {
      // Focus the graph on the selected field node
      setSearchQuery("");
      setIsSearchOpen(false);
      graphRef.current?.zoomToFit();
    },
    []
  );

  const handleZoomToFit = React.useCallback(() => {
    graphRef.current?.zoomToFit();
  }, []);

  const handleExportPng = React.useCallback(() => {
    const canvas = graphRef.current?.getCanvasElement();
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "dictionary-visualisation.png";
    link.href = url;
    link.click();
  }, []);

  // Calculate graph height for near-full viewport
  const [graphHeight, setGraphHeight] = React.useState(800);
  React.useEffect(() => {
    setGraphHeight(window.innerHeight - 120);
    const handleResize = () => setGraphHeight(window.innerHeight - 120);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="space-y-4 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dictionary"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dictionary
          </Link>
          <h1 className="text-xl font-semibold leading-[1.2]">
            Dictionary Visualisation
          </h1>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Domain filter */}
        <Select onValueChange={handleDomainChange} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {sortedDomains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => setIsSearchOpen(false), 200);
            }}
            className="w-[200px]"
          />
          {isSearchOpen && filteredFields.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-[200px] max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
              {filteredFields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearchSelect(field.id);
                  }}
                >
                  {field.field_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom to Fit */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomToFit}
          title="Zoom to Fit"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        {/* Export PNG */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPng}
          title="Export PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Graph canvas */}
      <div className="border rounded-lg" style={{ height: `${graphHeight}px` }}>
        <DictionaryGraph
          ref={graphRef}
          graphData={filteredGraphData}
          height={graphHeight}
        />
      </div>
    </div>
  );
}
