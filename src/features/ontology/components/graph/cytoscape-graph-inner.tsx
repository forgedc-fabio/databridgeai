"use client";

import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import svg from "cytoscape-svg";
import {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { graphStyles } from "../../lib/graph-styles";
import type { ElementDefinition, Core } from "cytoscape";

// Register extensions once at module scope with guard
let registered = false;
if (!registered) {
  cytoscape.use(dagre);
  cytoscape.use(svg);
  registered = true;
}

interface CytoscapeGraphInnerProps {
  elements: ElementDefinition[];
  onNodeClick?: (nodeId: string) => void;
  readOnly?: boolean;
}

const CytoscapeGraphInner = forwardRef<Core | null, CytoscapeGraphInnerProps>(
  function CytoscapeGraphInner({ elements, onNodeClick, readOnly }, ref) {
    const cyRef = useRef<Core | null>(null);

    useImperativeHandle(ref, () => cyRef.current as Core, []);

    const setCyRef = useCallback(
      (cy: Core) => {
        cyRef.current = cy;

        // Wire node tap event
        cy.on("tap", "node", (evt) => {
          const nodeId = evt.target.id();
          onNodeClick?.(nodeId);
        });

        // Highlight neighbours on hover
        cy.on("mouseover", "node", (evt) => {
          const node = evt.target;
          const neighbourhood = node.neighborhood().add(node);
          cy.elements().not(neighbourhood).addClass("dimmed");
          neighbourhood.addClass("highlighted");
        });

        cy.on("mouseout", "node", () => {
          cy.elements().removeClass("dimmed highlighted");
        });

        // Fit the graph after initial render
        cy.fit(undefined, 50);
      },
      [onNodeClick]
    );

    return (
      <CytoscapeComponent
        elements={elements}
        stylesheet={graphStyles}
        layout={{ name: "dagre", rankDir: "TB", nodeSep: 50, rankSep: 80 } as cytoscape.LayoutOptions}
        style={{ width: "100%", height: "100%" }}
        cy={setCyRef}
        userPanningEnabled
        userZoomingEnabled
        boxSelectionEnabled={false}
        autoungrabify={readOnly ? true : false}
      />
    );
  }
);

export default CytoscapeGraphInner;
