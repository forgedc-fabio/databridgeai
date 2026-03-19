"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DOMAIN_COLOUR_PALETTE } from "../../lib/constants";
import type { DictionaryFieldWithDomains } from "../../types/dictionary";

/**
 * Format a date string as relative time (e.g. "2 hours ago").
 * Falls back to a short date string for older dates.
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffDays > 30) {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (diffDays > 0) {
    return rtf.format(-diffDays, "day");
  }
  if (diffHours > 0) {
    return rtf.format(-diffHours, "hour");
  }
  if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, "minute");
  }
  return rtf.format(-diffSeconds, "second");
}

/**
 * Determine badge variant for a value type.
 * Picklist and Concatenated get "secondary" (distinct — have sub-entities).
 * All others get "outline" (understated).
 */
function getValueTypeBadgeVariant(
  valueType: string
): "secondary" | "outline" {
  if (valueType === "Picklist" || valueType === "Concatenated") {
    return "secondary";
  }
  return "outline";
}

/**
 * Returns TanStack column definitions for the Field DataTable.
 * The actions column is added inline via the grouped DataTable component.
 */
export function getFieldColumns(callbacks: {
  onEdit: (field: DictionaryFieldWithDomains) => void;
  onDelete: (field: DictionaryFieldWithDomains) => void;
}): ColumnDef<DictionaryFieldWithDomains>[] {
  return [
    {
      accessorKey: "field_name",
      header: "Field Name",
      cell: ({ row }) => (
        <span className="font-semibold">{row.getValue("field_name")}</span>
      ),
    },
    {
      accessorKey: "value_type",
      header: "Value Type",
      cell: ({ row }) => {
        const valueType = row.getValue("value_type") as string;
        return (
          <Badge variant={getValueTypeBadgeVariant(valueType)}>
            {valueType}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tagging_method",
      header: "Tagging Method",
      cell: ({ row }) => (
        <span>{row.getValue("tagging_method")}</span>
      ),
    },
    {
      id: "domains",
      header: "Domains",
      cell: ({ row }) => {
        const domainNames = row.original.domain_names;
        const domainIds = row.original.domain_ids;

        if (domainNames.length === 0) {
          return (
            <span className="text-muted-foreground italic">Unassigned</span>
          );
        }

        const visible = domainNames.slice(0, 3);
        const overflow = domainNames.length - 3;

        return (
          <div className="flex flex-wrap items-center gap-1">
            {visible.map((name, i) => {
              const colourIndex = domainIds[i]
                ? domainIds[i].charCodeAt(0) % DOMAIN_COLOUR_PALETTE.length
                : i % DOMAIN_COLOUR_PALETTE.length;
              return (
                <Badge
                  key={domainIds[i] ?? i}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}20`,
                    color: DOMAIN_COLOUR_PALETTE[colourIndex],
                    borderColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}40`,
                  }}
                >
                  {name}
                </Badge>
              );
            })}
            {overflow > 0 && (
              <span className="text-xs text-muted-foreground">
                +{overflow}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      cell: ({ row }) => (
        <span className="text-muted-foreground" suppressHydrationWarning>
          {formatRelativeTime(row.getValue("updated_at") as string)}
        </span>
      ),
    },
  ];
}
