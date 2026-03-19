"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OntologyClass } from "../../types/ontology";
import { Badge } from "@/components/ui/badge";

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

export const classColumns: ColumnDef<OntologyClass>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-semibold">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "domain_group",
    header: "Domain",
    cell: ({ row }) => {
      const domain = row.getValue("domain_group") as string | null;
      if (!domain) {
        return <span className="text-muted-foreground">&mdash;</span>;
      }
      return <Badge variant="secondary">{domain}</Badge>;
    },
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
    id: "properties",
    header: "Properties",
    cell: ({ row }) => (
      <span>{row.original.custom_attributes.length}</span>
    ),
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
