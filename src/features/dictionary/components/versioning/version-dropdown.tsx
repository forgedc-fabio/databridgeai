"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, BookOpen, GitCompare } from "lucide-react";
import type { DictionaryVersion } from "../../types/dictionary";

type VersionSummary = Pick<
  DictionaryVersion,
  "id" | "version_number" | "label" | "published_at"
>;

interface VersionDropdownProps {
  versions: VersionSummary[];
  currentVersionId: string | null;
  isReadOnly: boolean;
  onViewVersion: (versionId: string) => void;
  onSwitchToDraft: () => void;
  onPublish: () => void;
  onCompare: () => void;
}

export function VersionDropdown({
  versions,
  currentVersionId,
  isReadOnly,
  onViewVersion,
  onSwitchToDraft,
  onPublish,
  onCompare,
}: VersionDropdownProps) {
  const currentVersion = currentVersionId
    ? versions.find((v) => v.id === currentVersionId)
    : null;

  const triggerLabel = currentVersion
    ? `v${currentVersion.version_number}${currentVersion.label ? ` -- ${currentVersion.label}` : ""}`
    : "Current Draft";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {triggerLabel}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        {/* Actions */}
        {!isReadOnly && (
          <DropdownMenuItem onClick={onPublish}>
            Publish Version
          </DropdownMenuItem>
        )}
        {versions.length >= 2 && (
          <DropdownMenuItem onClick={onCompare}>
            <GitCompare className="h-3.5 w-3.5 mr-1.5" />
            Compare Versions
          </DropdownMenuItem>
        )}

        {((!isReadOnly || versions.length >= 2) && versions.length > 0) && (
          <DropdownMenuSeparator />
        )}

        {/* Current Draft option */}
        {isReadOnly && (
          <>
            <DropdownMenuItem onClick={onSwitchToDraft}>
              Current Draft
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Published versions list */}
        {versions.length > 0 && (
          <>
            <DropdownMenuLabel>Published Versions</DropdownMenuLabel>
            {versions.map((version) => {
              const isActive = version.id === currentVersionId;
              const publishedDate = new Date(
                version.published_at
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              return (
                <DropdownMenuItem
                  key={version.id}
                  onClick={() => onViewVersion(version.id)}
                  className={isActive ? "bg-accent/50" : ""}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      v{version.version_number}
                      {version.label ? ` -- ${version.label}` : ""}
                      {isActive ? " (current)" : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {publishedDate}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {versions.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No versions published yet.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
