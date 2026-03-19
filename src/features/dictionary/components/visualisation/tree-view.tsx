"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DOMAIN_COLOUR_PALETTE,
  UNASSIGNED_COLOUR,
} from "../../lib/constants";
import type {
  DictionaryDomain,
  DictionaryFieldWithDomains,
} from "../../types/dictionary";

interface TreeViewProps {
  domains: DictionaryDomain[];
  fields: DictionaryFieldWithDomains[];
  picklistValues: Record<
    string,
    Array<{ value: string; definition: string | null }>
  >;
  onFieldClick: (field: DictionaryFieldWithDomains) => void;
}

export function TreeView({
  domains,
  fields,
  picklistValues,
  onFieldClick,
}: TreeViewProps) {
  // All domain IDs + "unassigned" expanded by default
  const [expandedDomains, setExpandedDomains] = React.useState<
    Set<string>
  >(() => {
    const ids = new Set<string>(domains.map((d) => d.id));
    ids.add("unassigned");
    return ids;
  });

  const [expandedFields, setExpandedFields] = React.useState<
    Set<string>
  >(new Set());

  const sortedDomains = React.useMemo(
    () => [...domains].sort((a, b) => a.display_order - b.display_order),
    [domains]
  );

  // Group fields by domain
  const domainFieldsMap = React.useMemo(() => {
    const map: Record<string, DictionaryFieldWithDomains[]> = {};
    for (const domain of sortedDomains) {
      map[domain.id] = fields.filter((f) =>
        f.domain_ids.includes(domain.id)
      );
    }
    return map;
  }, [sortedDomains, fields]);

  const unassignedFields = React.useMemo(
    () => fields.filter((f) => f.domain_ids.length === 0),
    [fields]
  );

  const toggleDomain = React.useCallback((domainId: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) {
        next.delete(domainId);
      } else {
        next.add(domainId);
      }
      return next;
    });
  }, []);

  const toggleField = React.useCallback((fieldId: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }, []);

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-1 p-2">
        {/* Domain nodes */}
        {sortedDomains.map((domain, index) => {
          const domainFields = domainFieldsMap[domain.id] ?? [];
          const colour =
            DOMAIN_COLOUR_PALETTE[
              index % DOMAIN_COLOUR_PALETTE.length
            ];
          const isExpanded = expandedDomains.has(domain.id);

          return (
            <Collapsible
              key={domain.id}
              open={isExpanded}
              onOpenChange={() => toggleDomain(domain.id)}
            >
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: colour }}
                />
                <span className="font-semibold">{domain.name}</span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs"
                >
                  {domainFields.length}
                </Badge>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 space-y-0.5">
                  {domainFields.map((field) => (
                    <FieldTreeNode
                      key={`${domain.id}-${field.id}`}
                      field={field}
                      picklistValues={picklistValues[field.id]}
                      isExpanded={expandedFields.has(field.id)}
                      onToggle={() => toggleField(field.id)}
                      onClick={() => onFieldClick(field)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Unassigned group */}
        {unassignedFields.length > 0 && (
          <Collapsible
            open={expandedDomains.has("unassigned")}
            onOpenChange={() => toggleDomain("unassigned")}
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
              {expandedDomains.has("unassigned") ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: UNASSIGNED_COLOUR }}
              />
              <span className="font-semibold italic">Unassigned</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {unassignedFields.length}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-6 space-y-0.5">
                {unassignedFields.map((field) => (
                  <FieldTreeNode
                    key={`unassigned-${field.id}`}
                    field={field}
                    picklistValues={picklistValues[field.id]}
                    isExpanded={expandedFields.has(field.id)}
                    onToggle={() => toggleField(field.id)}
                    onClick={() => onFieldClick(field)}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </ScrollArea>
  );
}

// --- Field tree node sub-component ---

interface FieldTreeNodeProps {
  field: DictionaryFieldWithDomains;
  picklistValues?: Array<{ value: string; definition: string | null }>;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
}

function FieldTreeNode({
  field,
  picklistValues,
  isExpanded,
  onToggle,
  onClick,
}: FieldTreeNodeProps) {
  const hasChildren =
    (field.value_type === "Picklist" &&
      picklistValues &&
      picklistValues.length > 0) ||
    field.value_type === "Concatenated";

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted">
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="shrink-0 cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-2 cursor-pointer hover:underline text-left"
        >
          <span>{field.field_name}</span>
          <Badge
            variant={
              field.value_type === "Picklist" ||
              field.value_type === "Concatenated"
                ? "secondary"
                : "outline"
            }
            className="text-xs"
          >
            {field.value_type}
          </Badge>
        </button>
      </div>

      {/* Nested content for Picklist and Concatenated fields */}
      {hasChildren && isExpanded && (
        <div className="ml-8 space-y-0.5 py-0.5">
          {field.value_type === "Picklist" &&
            picklistValues?.map((pv, i) => (
              <div
                key={`${field.id}-pv-${i}`}
                className="flex items-center gap-2 px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                <span>{pv.value}</span>
                {pv.definition && (
                  <span className="text-muted-foreground/70 truncate">
                    -- {pv.definition}
                  </span>
                )}
              </div>
            ))}
          {field.value_type === "Concatenated" && (
            <div className="px-2 py-0.5 text-xs text-muted-foreground italic">
              Concatenated field
            </div>
          )}
        </div>
      )}
    </div>
  );
}
