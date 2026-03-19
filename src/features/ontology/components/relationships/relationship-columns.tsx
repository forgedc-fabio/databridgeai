"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { OntologyRelationshipWithNames } from "../../types/ontology";

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

export const relationshipColumns: ColumnDef<OntologyRelationshipWithNames>[] = [
  {
    accessorKey: "source_class_name",
    header: "Source Class",
    cell: ({ row }) => (
      <span className="font-semibold">
        {row.getValue("source_class_name")}
      </span>
    ),
  },
  {
    accessorKey: "relationship_type_name",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue("relationship_type_name")}
      </Badge>
    ),
  },
  {
    accessorKey: "target_class_name",
    header: "Target Class",
    cell: ({ row }) => (
      <span className="font-semibold">
        {row.getValue("target_class_name")}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatRelativeTime(row.getValue("created_at") as string)}
      </span>
    ),
  },
];
