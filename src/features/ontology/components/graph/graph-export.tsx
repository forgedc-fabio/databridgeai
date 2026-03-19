"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Core } from "cytoscape";

interface GraphExportProps {
  cyRef: React.RefObject<Core | null>;
}

export function GraphExport({ cyRef }: GraphExportProps) {
  const handleExportPng = React.useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const blob = cy.png({
      output: "blob",
      full: true,
      scale: 2,
      bg: "#ffffff",
    });

    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ontology-graph.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [cyRef]);

  const handleExportSvg = React.useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const svgContent = (cy as unknown as { svg: (opts: object) => string }).svg({
      full: true,
      scale: 1,
      bg: "#ffffff",
    });

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ontology-graph.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [cyRef]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExportPng}>
        <Download className="mr-2 h-4 w-4" />
        PNG
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportSvg}>
        <Download className="mr-2 h-4 w-4" />
        SVG
      </Button>
    </div>
  );
}
