"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { getDomainColumns } from "./domain-columns";
import type { DictionaryDomain } from "../../types/dictionary";

interface DomainDataTableProps {
  data: DictionaryDomain[];
  fieldCounts: Record<string, number>;
  onRowClick: (domain: DictionaryDomain) => void;
  onDelete: (domain: DictionaryDomain) => void;
  onReorder: (orderedIds: { id: string; display_order: number }[]) => void;
  editingDomainId?: string | null;
}

/**
 * Sortable table row component using dnd-kit.
 */
function SortableRow({
  row,
  children,
  isEditing,
  onClick,
}: {
  row: { original: DictionaryDomain };
  children: React.ReactNode;
  isEditing: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer ${
        isDragging
          ? "shadow-lg"
          : isEditing
            ? "bg-muted border-l-2 border-l-primary"
            : "hover:bg-muted"
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {children}
    </TableRow>
  );
}

export function DomainDataTable({
  data,
  fieldCounts,
  onRowClick,
  onDelete,
  onReorder,
  editingDomainId,
}: DomainDataTableProps) {
  const [items, setItems] = React.useState(data);

  // Sync internal items with prop data
  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const actionsColumn: ColumnDef<DictionaryDomain> = React.useMemo(
    () => ({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const domain = row.original;
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
                <DropdownMenuItem onClick={() => onRowClick(domain)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(domain)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
    [onRowClick, onDelete]
  );

  const baseColumns = React.useMemo(() => getDomainColumns(), []);
  const columns = React.useMemo<ColumnDef<DictionaryDomain>[]>(
    () => [...baseColumns, actionsColumn],
    [baseColumns, actionsColumn]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { fieldCounts },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const orderedIds = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));
    onReorder(orderedIds);
  };

  return (
    <div className="rounded-lg border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
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
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No domains found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const isEditing = editingDomainId === row.original.id;
                  return (
                    <SortableRow
                      key={row.original.id}
                      row={row}
                      isEditing={isEditing}
                      onClick={() => onRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  );
                })
              )}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
