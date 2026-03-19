"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { DictionaryDomain } from "../../types/dictionary";
import { DOMAIN_COLOUR_PALETTE } from "../../lib/constants";
import { GripVertical } from "lucide-react";

/**
 * Returns TanStack column definitions for the Domain DataTable.
 * The actions column is added separately in the DataTable component.
 */
export function getDomainColumns(): ColumnDef<DictionaryDomain>[] {
  return [
    {
      id: "drag",
      header: "",
      size: 40,
      cell: () => (
        <div className="flex items-center justify-center cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
      ),
      enableSorting: false,
    },
    {
      id: "colour",
      header: "",
      size: 40,
      cell: ({ row }) => {
        const colour =
          DOMAIN_COLOUR_PALETTE[
            row.original.display_order % DOMAIN_COLOUR_PALETTE.length
          ];
        return (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: colour }}
          />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        if (!description) {
          return <span className="text-muted-foreground">&mdash;</span>;
        }
        return (
          <span className="text-muted-foreground">
            {description.length > 60
              ? `${description.slice(0, 60)}...`
              : description}
          </span>
        );
      },
    },
    {
      accessorKey: "domain_area",
      header: "Domain Area",
      cell: ({ row }) => {
        const area = row.getValue("domain_area") as string | null;
        if (!area) {
          return <span className="text-muted-foreground">&mdash;</span>;
        }
        return <span>{area}</span>;
      },
    },
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const owner = row.getValue("owner") as string | null;
        if (!owner) {
          return <span className="text-muted-foreground">&mdash;</span>;
        }
        return <span>{owner}</span>;
      },
    },
    {
      id: "fieldCount",
      header: "Fields",
      cell: ({ row, table }) => {
        const fieldCounts = (table.options.meta as { fieldCounts?: Record<string, number> })?.fieldCounts ?? {};
        const count = fieldCounts[row.original.id] ?? 0;
        return <span className="text-muted-foreground">{count}</span>;
      },
      enableSorting: false,
    },
  ];
}
