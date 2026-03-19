"use client";

import * as React from "react";
import { Maximize2, UnfoldVertical, FoldVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOMAIN_GROUPS } from "../../types/ontology";
import type { OntologyClass } from "../../types/ontology";
import type { Core } from "cytoscape";

interface GraphControlsProps {
  cyRef: React.RefObject<Core | null>;
  classes: OntologyClass[];
  onDomainFilter: (domain: string | null) => void;
  onSearch: (classId: string | null) => void;
}

export function GraphControls({
  cyRef,
  classes,
  onDomainFilter,
  onSearch,
}: GraphControlsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Filter classes by search query
  const filteredClasses = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return classes.filter((cls) => cls.name.toLowerCase().includes(q));
  }, [classes, searchQuery]);

  const handleDomainChange = React.useCallback(
    (value: string | null) => {
      onDomainFilter(!value || value === "all" ? null : value);
    },
    [onDomainFilter]
  );

  const handleSearchSelect = React.useCallback(
    (classId: string) => {
      onSearch(classId);
      setSearchQuery("");
    },
    [onSearch]
  );

  const handleZoomToFit = React.useCallback(() => {
    cyRef.current?.fit(undefined, 50);
  }, [cyRef]);

  const handleToggleCollapse = React.useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (isCollapsed) {
      // Show all nodes
      (cy.elements() as unknown as { show(): void }).show();
      setIsCollapsed(false);
    } else {
      // Hide leaf nodes (nodes with no outgoing "is-a" edges)
      const isaEdges = cy.edges('[type="is-a"]');
      const roots = new Set<string>();
      isaEdges.forEach((edge) => {
        roots.add(edge.target().id());
      });

      // Find descendants using BFS from root nodes
      const descendants = new Set<string>();
      const visited = new Set<string>();
      const queue = Array.from(roots);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const node = cy.getElementById(current);
        const children = node
          .incomers('edge[type="is-a"]')
          .sources();

        children.forEach((child) => {
          descendants.add(child.id());
          queue.push(child.id());
        });
      }

      // Hide descendants (keep roots visible)
      descendants.forEach((id) => {
        (cy.getElementById(id) as unknown as { hide(): void }).hide();
      });
      setIsCollapsed(true);
    }
  }, [cyRef, isCollapsed]);

  return (
    <div className="flex items-center gap-2">
      {/* Domain filter */}
      <Select onValueChange={handleDomainChange} defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Domains" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Domains</SelectItem>
          {DOMAIN_GROUPS.map((domain) => (
            <SelectItem key={domain} value={domain}>
              {domain}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[200px]"
        />
        {filteredClasses.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 w-[200px] rounded-md border bg-popover p-1 shadow-md">
            {filteredClasses.map((cls) => (
              <button
                key={cls.id}
                type="button"
                className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSearchSelect(cls.id)}
              >
                {cls.name}
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

      {/* Expand/Collapse */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleCollapse}
        title={isCollapsed ? "Expand All" : "Collapse Subtrees"}
      >
        {isCollapsed ? (
          <UnfoldVertical className="h-4 w-4" />
        ) : (
          <FoldVertical className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
