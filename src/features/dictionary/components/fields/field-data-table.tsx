"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { DOMAIN_COLOUR_PALETTE, UNASSIGNED_COLOUR } from "../../lib/constants";
import type {
  DictionaryDomain,
  DictionaryFieldWithDomains,
} from "../../types/dictionary";

interface FieldDataTableProps {
  fields: DictionaryFieldWithDomains[];
  domains: DictionaryDomain[];
  onRowClick: (field: DictionaryFieldWithDomains) => void;
  onDelete: (field: DictionaryFieldWithDomains) => void;
  editingFieldId?: string | null;
}

interface DomainGroup {
  id: string;
  name: string;
  colour: string;
  fields: DictionaryFieldWithDomains[];
}

/**
 * Group fields by domain. Each field may appear under multiple domains.
 * Fields with no domain appear under "Unassigned".
 */
function groupFieldsByDomain(
  fields: DictionaryFieldWithDomains[],
  domains: DictionaryDomain[]
): DomainGroup[] {
  const sortedDomains = [...domains].sort(
    (a, b) => a.display_order - b.display_order
  );

  const groups: DomainGroup[] = sortedDomains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    colour:
      DOMAIN_COLOUR_PALETTE[
        domain.display_order % DOMAIN_COLOUR_PALETTE.length
      ],
    fields: fields.filter((f) => f.domain_ids.includes(domain.id)),
  }));

  // Unassigned group at bottom
  const unassigned = fields.filter((f) => f.domain_ids.length === 0);
  if (unassigned.length > 0) {
    groups.push({
      id: "unassigned",
      name: "Unassigned",
      colour: UNASSIGNED_COLOUR,
      fields: unassigned,
    });
  }

  return groups;
}

/**
 * Format relative time for the Updated column.
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
  if (diffDays > 0) return rtf.format(-diffDays, "day");
  if (diffHours > 0) return rtf.format(-diffHours, "hour");
  if (diffMinutes > 0) return rtf.format(-diffMinutes, "minute");
  return rtf.format(-diffSeconds, "second");
}

function getValueTypeBadgeVariant(
  valueType: string
): "secondary" | "outline" {
  return valueType === "Picklist" || valueType === "Concatenated"
    ? "secondary"
    : "outline";
}

export function FieldDataTable({
  fields,
  domains,
  onRowClick,
  onDelete,
  editingFieldId,
}: FieldDataTableProps) {
  const groups = React.useMemo(
    () => groupFieldsByDomain(fields, domains),
    [fields, domains]
  );

  // All groups expanded by default
  const [expandedDomains, setExpandedDomains] = React.useState<Set<string>>(
    () => new Set(groups.map((g) => g.id))
  );

  // Keep expanded state in sync when groups change
  React.useEffect(() => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      for (const g of groups) {
        if (!prev.has(g.id)) {
          next.add(g.id);
        }
      }
      return next;
    });
  }, [groups]);

  const toggleGroup = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const columnHeaders = [
    "Field Name",
    "Value Type",
    "Tagging Method",
    "Domains",
    "Updated",
    "",
  ];

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columnHeaders.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const isExpanded = expandedDomains.has(group.id);
            const isUnassigned = group.id === "unassigned";

            return (
              <React.Fragment key={group.id}>
                {/* Domain header row */}
                <TableRow
                  className="bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => toggleGroup(group.id)}
                >
                  <TableCell colSpan={columnHeaders.length}>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.colour }}
                      />
                      <span
                        className={`font-semibold ${
                          isUnassigned ? "italic text-muted-foreground" : ""
                        }`}
                      >
                        {group.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {group.fields.length}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Field rows (collapsible) */}
                {isExpanded &&
                  group.fields.map((field) => {
                    const isEditing = editingFieldId === field.id;

                    return (
                      <TableRow
                        key={`${group.id}-${field.id}`}
                        className={`cursor-pointer ${
                          isEditing
                            ? "bg-muted border-l-2 border-l-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => onRowClick(field)}
                      >
                        {/* Field Name */}
                        <TableCell>
                          <span className="font-semibold pl-6">
                            {field.field_name}
                          </span>
                        </TableCell>

                        {/* Value Type */}
                        <TableCell>
                          <Badge
                            variant={getValueTypeBadgeVariant(field.value_type)}
                          >
                            {field.value_type}
                          </Badge>
                        </TableCell>

                        {/* Tagging Method */}
                        <TableCell>{field.tagging_method}</TableCell>

                        {/* Domains */}
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            {field.domain_names.length === 0 ? (
                              <span className="text-muted-foreground italic">
                                Unassigned
                              </span>
                            ) : (
                              <>
                                {field.domain_names.slice(0, 3).map((name, i) => {
                                  const colourIndex =
                                    field.domain_ids[i]
                                      ? field.domain_ids[i].charCodeAt(0) %
                                        DOMAIN_COLOUR_PALETTE.length
                                      : i % DOMAIN_COLOUR_PALETTE.length;
                                  return (
                                    <Badge
                                      key={field.domain_ids[i] ?? i}
                                      variant="secondary"
                                      className="text-xs"
                                      style={{
                                        backgroundColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}20`,
                                        color:
                                          DOMAIN_COLOUR_PALETTE[colourIndex],
                                        borderColor: `${DOMAIN_COLOUR_PALETTE[colourIndex]}40`,
                                      }}
                                    >
                                      {name}
                                    </Badge>
                                  );
                                })}
                                {field.domain_names.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{field.domain_names.length - 3}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>

                        {/* Updated */}
                        <TableCell>
                          <span
                            className="text-muted-foreground"
                            suppressHydrationWarning
                          >
                            {formatRelativeTime(field.updated_at)}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div
                            className="flex justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Actions</span>
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onRowClick(field)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => onDelete(field)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
