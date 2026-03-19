"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ElementDefinition, Core } from "cytoscape";

const CytoscapeGraph = dynamic(
  () => import("./cytoscape-graph-inner"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  }
);

interface OntologyGraphProps {
  elements: ElementDefinition[];
  onNodeClick?: (nodeId: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const OntologyGraph = forwardRef<Core | null, OntologyGraphProps>(
  function OntologyGraph({ elements, onNodeClick, readOnly, className }, ref) {
    return (
      <div className={className ?? "h-[600px]"}>
        <CytoscapeGraph
          ref={ref}
          elements={elements}
          onNodeClick={onNodeClick}
          readOnly={readOnly}
        />
      </div>
    );
  }
);
