import type { StylesheetStyle } from "cytoscape";

/**
 * Cytoscape stylesheet for the ontology graph visualisation.
 * Defines node, edge, dimmed, and highlighted styles.
 * Domain colours are imported from types/ontology.ts.
 */
export const graphStyles: StylesheetStyle[] = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "background-color": "data(colour)",
      color: "#ffffff",
      "font-size": "12px",
      width: 60,
      height: 60,
      "text-wrap": "wrap",
      "text-max-width": "80px",
    },
  },
  {
    selector: "edge",
    style: {
      label: "data(label)",
      "curve-style": "bezier",
      "target-arrow-shape": "triangle",
      "arrow-scale": 1.2,
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
      "font-size": "10px",
      "text-rotation": "autorotate",
    },
  },
  {
    selector: "edge[type='is-a']",
    style: {
      "line-style": "solid",
      "line-color": "#64748b",
      "target-arrow-color": "#64748b",
    },
  },
  {
    selector: ".dimmed",
    style: {
      opacity: 0.2,
    },
  },
  {
    selector: ".highlighted",
    style: {
      "border-width": 3,
      "border-color": "#1e40af",
    },
  },
];
