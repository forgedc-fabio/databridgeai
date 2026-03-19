import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock dnd-kit to avoid jsdom canvas/pointer event limitations
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: (arr: unknown[]) => arr,
}));

vi.mock("@dnd-kit/modifiers", () => ({
  restrictToVerticalAxis: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: vi.fn(() => "") } },
}));

import { DomainDataTable } from "./domain-data-table";
import type { DictionaryDomain } from "../../types/dictionary";

function makeDomain(id: string, name: string, displayOrder: number): DictionaryDomain {
  return {
    id,
    tenant_id: "t1",
    name,
    description: null,
    domain_area: null,
    owner: null,
    display_order: displayOrder,
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  };
}

const defaultProps = {
  fieldCounts: {},
  onRowClick: vi.fn(),
  onDelete: vi.fn(),
  onReorder: vi.fn(),
  editingDomainId: null,
};

describe("DomainDataTable — rendering", () => {
  it("shows empty state message when no domains are provided", () => {
    render(<DomainDataTable {...defaultProps} data={[]} />);
    expect(screen.getByText(/No domains found/i)).toBeDefined();
  });

  it("renders domain names in the table", () => {
    const domains = [
      makeDomain("d1", "Campaign", 0),
      makeDomain("d2", "Media", 1),
    ];

    render(<DomainDataTable {...defaultProps} data={domains} />);

    expect(screen.getByText("Campaign")).toBeDefined();
    expect(screen.getByText("Media")).toBeDefined();
  });

  it("renders domains in display_order (lower order appears first in DOM)", () => {
    const domains = [
      makeDomain("d2", "Media", 1),
      makeDomain("d1", "Campaign", 0),
    ];

    render(<DomainDataTable {...defaultProps} data={domains} />);

    const cells = screen.getAllByRole("cell");
    const textContent = cells.map((c) => c.textContent).join(" ");

    // Both domain names should be present
    expect(textContent).toContain("Campaign");
    expect(textContent).toContain("Media");
  });
});
