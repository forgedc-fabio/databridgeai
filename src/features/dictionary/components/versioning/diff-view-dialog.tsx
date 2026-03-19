"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getDictionaryVersionSnapshot } from "../../actions/version-actions";
import { computeVersionDiff } from "../../lib/version-diff";
import type {
  DictionaryVersion,
  DictionarySnapshot,
  VersionDiffResult,
} from "../../types/dictionary";

type VersionSummary = Pick<
  DictionaryVersion,
  "id" | "version_number" | "label"
>;

interface DiffViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: VersionSummary[];
}

export function DiffViewDialog({
  open,
  onOpenChange,
  versions,
}: DiffViewDialogProps) {
  const [versionAId, setVersionAId] = React.useState<string>("");
  const [versionBId, setVersionBId] = React.useState<string>("");
  const [diffResult, setDiffResult] = React.useState<VersionDiffResult | null>(
    null
  );
  const [isComparing, setIsComparing] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setVersionAId("");
      setVersionBId("");
      setDiffResult(null);
      setIsComparing(false);
    }
  }, [open]);

  // Auto-compare when both versions are selected
  React.useEffect(() => {
    if (!versionAId || !versionBId || versionAId === versionBId) {
      setDiffResult(null);
      return;
    }

    const compare = async () => {
      setIsComparing(true);
      const [resultA, resultB] = await Promise.all([
        getDictionaryVersionSnapshot(versionAId),
        getDictionaryVersionSnapshot(versionBId),
      ]);

      if (resultA.data && resultB.data) {
        const diff = computeVersionDiff(
          resultA.data.snapshot,
          resultB.data.snapshot
        );
        setDiffResult(diff);
      }
      setIsComparing(false);
    };

    compare();
  }, [versionAId, versionBId]);

  const versionA = versions.find((v) => v.id === versionAId);
  const versionB = versions.find((v) => v.id === versionBId);

  const totalChanges = diffResult
    ? diffResult.added.length +
      diffResult.removed.length +
      diffResult.changed.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Compare Versions</DialogTitle>
          <DialogDescription>
            Select two versions to see what changed between them.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-2">
          <div className="flex-1 space-y-1.5">
            <Label>Version A</Label>
            <Select value={versionAId} onValueChange={(val) => { if (val) setVersionAId(val); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select version..." />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version_number}
                    {v.label ? ` -- ${v.label}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label>Version B</Label>
            <Select value={versionBId} onValueChange={(val) => { if (val) setVersionBId(val); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select version..." />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    v{v.version_number}
                    {v.label ? ` -- ${v.label}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isComparing && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Comparing...
              </span>
            </div>
          )}

          {versionAId &&
            versionBId &&
            versionAId === versionBId &&
            !isComparing && (
              <div className="text-sm text-muted-foreground text-center py-8">
                Select two different versions to compare.
              </div>
            )}

          {diffResult && !isComparing && (
            <div className="space-y-4 pb-2">
              {/* Domain changes */}
              {(diffResult.domainChanges.added.length > 0 ||
                diffResult.domainChanges.removed.length > 0) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Domain Changes</h4>
                  <div className="space-y-1">
                    {diffResult.domainChanges.added.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm bg-green-50 dark:bg-green-950/20"
                      >
                        <span className="font-medium text-green-700 dark:text-green-400">
                          + Added
                        </span>
                        <span>{d.name}</span>
                      </div>
                    ))}
                    {diffResult.domainChanges.removed.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 rounded px-2 py-1 text-sm bg-red-50 dark:bg-red-950/20"
                      >
                        <span className="font-medium text-red-700 dark:text-red-400">
                          - Removed
                        </span>
                        <span>{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field changes table */}
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Field Changes ({totalChanges} change
                  {totalChanges !== 1 ? "s" : ""})
                </h4>

                {totalChanges === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No field changes between v{versionA?.version_number} and v
                    {versionB?.version_number}.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">
                            Field Name
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Value Type
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Change Type
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {diffResult.added.map((field) => (
                          <tr
                            key={`added-${field.id}`}
                            className="border-b bg-green-50 dark:bg-green-950/20"
                          >
                            <td className="px-3 py-1.5 font-medium">
                              {field.field_name}
                            </td>
                            <td className="px-3 py-1.5">
                              {field.value_type}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="font-medium text-green-700 dark:text-green-400">
                                Added
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              New field
                            </td>
                          </tr>
                        ))}
                        {diffResult.removed.map((field) => (
                          <tr
                            key={`removed-${field.id}`}
                            className="border-b bg-red-50 dark:bg-red-950/20"
                          >
                            <td className="px-3 py-1.5 font-medium">
                              {field.field_name}
                            </td>
                            <td className="px-3 py-1.5">
                              {field.value_type}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="font-medium text-red-700 dark:text-red-400">
                                Removed
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              Field deleted
                            </td>
                          </tr>
                        ))}
                        {diffResult.changed.map(({ field, changes }) => (
                          <tr
                            key={`changed-${field.id}`}
                            className="border-b bg-amber-50 dark:bg-amber-950/20"
                          >
                            <td className="px-3 py-1.5 font-medium">
                              {field.field_name}
                            </td>
                            <td className="px-3 py-1.5">
                              {field.value_type}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="font-medium text-amber-700 dark:text-amber-400">
                                Changed
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-muted-foreground">
                              <ul className="list-none space-y-0.5">
                                {changes.map((change, i) => (
                                  <li key={i} className="text-xs">
                                    <span className="underline decoration-dotted">
                                      {change}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
