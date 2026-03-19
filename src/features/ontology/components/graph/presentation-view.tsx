"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OntologyGraph } from "./ontology-graph";
import { GraphControls } from "./graph-controls";
import { GraphExport } from "./graph-export";
import { useGraphData } from "../../hooks/use-graph-data";
import { DOMAIN_GROUPS } from "../../types/ontology";
import type {
  OntologyClass,
  OntologyRelationshipWithNames,
} from "../../types/ontology";
import type { Core } from "cytoscape";

interface PresentationViewProps {
  classes: OntologyClass[];
  relationships: OntologyRelationshipWithNames[];
}

export function PresentationView({
  classes,
  relationships,
}: PresentationViewProps) {
  const cyRef = React.useRef<Core | null>(null);
  const elements = useGraphData(classes, relationships);

  // Domain filter state
  const [domainFilter, setDomainFilter] = React.useState<string | null>(null);

  // Filtered elements based on domain
  const filteredElements = React.useMemo(() => {
    if (!domainFilter) return elements;

    const visibleNodeIds = new Set<string>();
    const filtered = elements.filter((el) => {
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
  }, [elements, domainFilter]);

  // Handle search — pan to node
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

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/ontology"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>
          <h1 className="text-xl font-semibold leading-[1.2]">
            Ontology Visualisation
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <GraphControls
          cyRef={cyRef}
          classes={classes}
          onDomainFilter={setDomainFilter}
          onSearch={handleSearch}
        />
        <GraphExport cyRef={cyRef} />
      </div>

      <div className="border rounded-lg" style={{ height: "calc(100vh - 64px)" }}>
        <OntologyGraph
          ref={cyRef}
          elements={filteredElements}
          readOnly={true}
          className="h-full"
        />
      </div>
    </div>
  );
}
