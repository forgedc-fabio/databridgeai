import { describe, it, expect, vi, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Polyfill ResizeObserver for jsdom (DictionaryGraph uses it to track container width)
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock next/dynamic so the loading fallback is rendered synchronously
vi.mock("next/dynamic", () => ({
  default: (_loader: () => Promise<unknown>, opts?: { loading?: () => React.ReactElement }) => {
    // Return the loading component so SSR-safe skeleton is testable
    if (opts?.loading) {
      return opts.loading;
    }
    return () => <div data-testid="force-graph-placeholder" />;
  },
}));

// Mock react-force-graph-2d (not needed for loading state tests but prevents import errors)
vi.mock("react-force-graph-2d", () => ({
  default: () => <canvas data-testid="force-graph-2d" />,
}));

import { DictionaryGraph } from "./dictionary-graph";
import type { GraphData } from "../../hooks/use-graph-data";

const emptyGraphData: GraphData = {
  nodes: [],
  links: [],
};

describe("DictionaryGraph — loading state", () => {
  it("renders loading skeleton when dynamic import is pending", () => {
    render(<DictionaryGraph graphData={emptyGraphData} />);

    // The loading fallback from dynamic() renders the animate-pulse skeleton
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).not.toBeNull();
  });
});

describe("DictionaryGraph — structure", () => {
  it("renders without crashing when given empty graph data", () => {
    expect(() => {
      render(<DictionaryGraph graphData={emptyGraphData} />);
    }).not.toThrow();
  });

  it("renders without crashing when given graph data with nodes and links", () => {
    const graphData: GraphData = {
      nodes: [
        { id: "domain-d1", name: "Campaign", type: "domain", colour: "#3b82f6", val: 20 },
        { id: "field-f1", name: "Brand Name", type: "field", colour: "#3b82f699", val: 8 },
      ],
      links: [
        { source: "field-f1", target: "domain-d1", type: "belongs-to" },
      ],
    };

    expect(() => {
      render(<DictionaryGraph graphData={graphData} />);
    }).not.toThrow();
  });
});
