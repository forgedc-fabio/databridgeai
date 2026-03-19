"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { relationshipColumns } from "./relationship-columns";
import type {
  OntologyRelationshipWithNames,
  OntologyClass,
  OntologyRelationshipType,
} from "../../types/ontology";

interface RelationshipDataTableProps {
  data: OntologyRelationshipWithNames[];
  classes: OntologyClass[];
  relationshipTypes: OntologyRelationshipType[];
  onDelete: (rel: OntologyRelationshipWithNames) => void;
}

export function RelationshipDataTable({
  data,
  classes,
  relationshipTypes,
  onDelete,
}: RelationshipDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [classFilter, setClassFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  // Filter data based on selected filters
  const filteredData = React.useMemo(() => {
    let result = data;

    if (classFilter !== "all") {
      result = result.filter(
        (rel) =>
          rel.source_class_name === classFilter ||
          rel.target_class_name === classFilter
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(
        (rel) => rel.relationship_type_name === typeFilter
      );
    }

    return result;
  }, [data, classFilter, typeFilter]);

  const actionsColumn: ColumnDef<OntologyRelationshipWithNames> =
    React.useMemo(
      () => ({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const rel = row.original;
          return (
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
                    variant="destructive"
                    onClick={() => onDelete(rel)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Relationship
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      }),
      [onDelete]
    );

  const columns = React.useMemo<
    ColumnDef<OntologyRelationshipWithNames>[]
  >(
    () => [...relationshipColumns, actionsColumn],
    [actionsColumn]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleClassFilterChange = React.useCallback(
    (value: unknown) => {
      if (typeof value === "string") {
        setClassFilter(value);
      }
    },
    []
  );

  const handleTypeFilterChange = React.useCallback(
    (value: unknown) => {
      if (typeof value === "string") {
        setTypeFilter(value);
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Class:</span>
          <Select value={classFilter} onValueChange={handleClassFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Type:</span>
          <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {relationshipTypes.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No relationships found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
