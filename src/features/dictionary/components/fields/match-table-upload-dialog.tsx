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
import { Loader2, Upload } from "lucide-react";
import { parseMatchTableCSV } from "../../lib/csv-parser";
import type { ParsedMatchTable } from "../../lib/csv-parser";

interface MatchTableUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldId: string;
  onUpload: (
    columns: string[],
    data: Record<string, string>[]
  ) => Promise<void>;
}

export function MatchTableUploadDialog({
  open,
  onOpenChange,
  fieldId,
  onUpload,
}: MatchTableUploadDialogProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [parsed, setParsed] = React.useState<ParsedMatchTable | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setParsed(null);
      setParseError(null);
      setIsDragOver(false);
      setIsImporting(false);
    }
  }, [open]);

  const handleFile = async (file: File) => {
    setParseError(null);
    setParsed(null);

    if (!file.name.endsWith(".csv")) {
      setParseError("Please upload a CSV file.");
      return;
    }

    const result = await parseMatchTableCSV(file);

    if (result.errors.length > 0) {
      setParseError(
        "Could not parse the CSV file. Ensure the file has a header row and is comma-separated."
      );
      return;
    }

    if (result.columns.length === 0 || result.rows.length === 0) {
      setParseError(
        "The CSV file appears to be empty. Ensure it has at least a header row and one data row."
      );
      return;
    }

    setParsed(result);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleImport = async () => {
    if (!parsed) return;

    setIsImporting(true);
    await onUpload(parsed.columns, parsed.rows);
    setIsImporting(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Upload Match Table</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a match table for controlled picklist
            values. The CSV should have a header row defining columns.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {!parsed ? (
            <>
              <div
                role="button"
                tabIndex={0}
                className={`min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-muted-foreground/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Upload className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Drag a CSV file here, or click to browse.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleInputChange}
                className="hidden"
              />
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                Preview ({parsed.rows.length} rows total)
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {parsed.columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        {parsed.columns.map((col) => (
                          <td key={col} className="px-3 py-1.5">
                            {row[col] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.rows.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  Showing first 5 of {parsed.rows.length} rows.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsed(null);
                  setParseError(null);
                }}
              >
                Choose a different file
              </Button>
            </div>
          )}

          {parseError && (
            <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {parseError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsed || isImporting}
          >
            {isImporting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
