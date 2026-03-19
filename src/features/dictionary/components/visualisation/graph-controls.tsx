"use client";

import * as React from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DictionaryDomain, DictionaryFieldWithDomains } from "../../types/dictionary";

interface GraphControlsProps {
  domains: DictionaryDomain[];
  fields: DictionaryFieldWithDomains[];
  onDomainFilter: (domainId: string | null) => void;
  onSearch: (fieldId: string | null) => void;
  onZoomToFit: () => void;
}

export function GraphControls({
  domains,
  fields,
  onDomainFilter,
  onSearch,
  onZoomToFit,
}: GraphControlsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Sort domains by display_order for consistent dropdown ordering
  const sortedDomains = React.useMemo(
    () => [...domains].sort((a, b) => a.display_order - b.display_order),
    [domains]
  );

  // Filter fields by search query
  const filteredFields = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return fields.filter((f) =>
      f.field_name.toLowerCase().includes(q)
    );
  }, [fields, searchQuery]);

  const handleDomainChange = React.useCallback(
    (value: string | null) => {
      onDomainFilter(!value || value === "all" ? null : value);
    },
    [onDomainFilter]
  );

  const handleSearchSelect = React.useCallback(
    (fieldId: string) => {
      onSearch(fieldId);
      setSearchQuery("");
      setIsDropdownOpen(false);
    },
    [onSearch]
  );

  const handleSearchInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setIsDropdownOpen(e.target.value.trim().length > 0);
    },
    []
  );

  const handleSearchBlur = React.useCallback(() => {
    // Delay close to allow click on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Domain filter */}
      <Select onValueChange={handleDomainChange} defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Domains" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Domains</SelectItem>
          {sortedDomains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              {domain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search with autocomplete */}
      <div className="relative">
        <Input
          placeholder="Search fields..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          onFocus={() => {
            if (searchQuery.trim()) setIsDropdownOpen(true);
          }}
          onBlur={handleSearchBlur}
          className="w-[200px]"
        />
        {isDropdownOpen && filteredFields.length > 0 && (
          <div className="absolute top-full left-0 z-50 mt-1 w-[200px] max-h-[200px] overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
            {filteredFields.map((field) => (
              <button
                key={field.id}
                type="button"
                className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSearchSelect(field.id);
                }}
              >
                {field.field_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom to Fit */}
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomToFit}
        title="Zoom to Fit"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
