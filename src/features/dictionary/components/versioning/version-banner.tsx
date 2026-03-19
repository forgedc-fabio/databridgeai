"use client";

import { Button } from "@/components/ui/button";

interface VersionBannerProps {
  versionNumber: number;
  label: string | null;
  onSwitchToDraft: () => void;
}

/**
 * Amber banner displayed at the top of the page content when viewing
 * a published (read-only) version.
 */
export function VersionBanner({
  versionNumber,
  label,
  onSwitchToDraft,
}: VersionBannerProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
      <p className="text-sm">
        Viewing version{" "}
        <span className="font-medium">
          v{versionNumber}
          {label ? ` -- ${label}` : ""}
        </span>
        .{" "}
        <Button
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={onSwitchToDraft}
        >
          Switch to current draft
        </Button>
      </p>
      <Button variant="outline" size="sm" onClick={onSwitchToDraft}>
        Clone to New Draft
      </Button>
    </div>
  );
}
