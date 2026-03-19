"use client";

import dynamic from "next/dynamic";
import {
  useRef,
  useCallback,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";
import type { GraphData, GraphNode } from "../../hooks/use-graph-data";

// Dynamic import -- react-force-graph-2d accesses window/document
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] animate-pulse bg-muted rounded-lg" />
  ),
});

export interface DictionaryGraphHandle {
  zoomToFit: () => void;
  getCanvasElement: () => HTMLCanvasElement | null;
}

interface DictionaryGraphProps {
  graphData: GraphData;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-force-graph-2d dynamic import strips generics
type AnyNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLink = any;

export const DictionaryGraph = forwardRef<
  DictionaryGraphHandle,
  DictionaryGraphProps
>(function DictionaryGraph({ graphData, height = 600, onNodeClick }, ref) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(
    new Set()
  );
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Measure container width via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Expose imperative methods
  useImperativeHandle(
    ref,
    () => ({
      zoomToFit: () => {
        fgRef.current?.zoomToFit(400, 50);
      },
      getCanvasElement: () => {
        const container = containerRef.current;
        if (!container) return null;
        return container.querySelector("canvas") ?? null;
      },
    }),
    []
  );

  // Node hover -- highlight connected nodes
  const handleNodeHover = useCallback(
    (rawNode: AnyNode) => {
      if (!rawNode) {
        setHighlightNodes(new Set());
        setHoveredNode(null);
        return;
      }

      const node = rawNode as GraphNode;
      const connectedIds = new Set<string>();
      connectedIds.add(node.id);

      graphData.links.forEach((link) => {
        const sourceId =
          typeof link.source === "object"
            ? (link.source as GraphNode).id
            : String(link.source);
        const targetId =
          typeof link.target === "object"
            ? (link.target as GraphNode).id
            : String(link.target);

        if (sourceId === node.id) {
          connectedIds.add(targetId);
        } else if (targetId === node.id) {
          connectedIds.add(sourceId);
        }
      });

      setHighlightNodes(connectedIds);
      setHoveredNode(node.id);
    },
    [graphData.links]
  );

  // Custom node rendering
  const handleNodeCanvasObject = useCallback(
    (
      rawNode: AnyNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number
    ) => {
      const node = rawNode as GraphNode & { x?: number; y?: number };
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      // Calculate opacity based on hover state
      const isHighlighted =
        !hoveredNode || highlightNodes.has(node.id);
      const opacity = isHighlighted ? 1 : 0.2;

      ctx.globalAlpha = opacity;

      if (node.type === "domain") {
        // Domain node: large filled circle with white label
        const radius = Math.sqrt(node.val) * 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.colour;
        ctx.fill();

        // Label inside node
        const fontSize = 12 / globalScale;
        ctx.font = `600 ${fontSize}px "Geist Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(node.name, x, y);
      } else {
        // Field node: smaller circle with label below
        const radius = Math.sqrt(node.val) * 1.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.colour;
        ctx.fill();

        // Label below node
        const fontSize = 10 / globalScale;
        ctx.font = `400 ${fontSize}px "Geist Sans", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "hsl(0, 0%, 20%)";
        ctx.fillText(node.name, x, y + radius + 2 / globalScale);
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, highlightNodes]
  );

  // Node pointer area (for hit detection matching the custom render)
  const handleNodePointerAreaPaint = useCallback(
    (
      rawNode: AnyNode,
      colour: string,
      ctx: CanvasRenderingContext2D
    ) => {
      const node = rawNode as GraphNode & { x?: number; y?: number };
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const radius =
        node.type === "domain"
          ? Math.sqrt(node.val) * 2
          : Math.sqrt(node.val) * 1.5;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = colour;
      ctx.fill();
    },
    []
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel="name"
        nodeColor="colour"
        nodeVal="val"
        nodeCanvasObject={handleNodeCanvasObject}
        nodeCanvasObjectMode={() => "replace"}
        nodePointerAreaPaint={handleNodePointerAreaPaint}
        linkColor={(link: AnyLink) =>
          link.type === "concatenated" ? "#94a3b8" : "#d1d5db"
        }
        linkLineDash={(link: AnyLink) =>
          link.type === "concatenated" ? [5, 5] : null
        }
        linkDirectionalArrowLength={4}
        onNodeHover={handleNodeHover}
        onNodeClick={(rawNode: AnyNode) =>
          onNodeClick?.(rawNode as GraphNode)
        }
        width={containerWidth}
        height={height}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
      />
    </div>
  );
});
