"use client";

import * as React from "react";
import {
  getDictionaryVersions,
  getDictionaryVersionSnapshot,
} from "../actions/version-actions";
import type { DictionaryVersion, DictionarySnapshot } from "../types/dictionary";

type VersionSummary = Pick<
  DictionaryVersion,
  "id" | "version_number" | "label" | "published_at"
>;

interface UseDictionaryVersionReturn {
  versions: VersionSummary[];
  viewingVersionId: string | null;
  viewingSnapshot: DictionarySnapshot | null;
  isReadOnly: boolean;
  isLoading: boolean;
  viewVersion: (versionId: string) => Promise<void>;
  switchToDraft: () => void;
  refreshVersions: () => Promise<void>;
}

/**
 * Hook managing version state for the dictionary page.
 * Handles switching between draft mode and read-only version viewing.
 */
export function useDictionaryVersion(
  initialVersions: VersionSummary[]
): UseDictionaryVersionReturn {
  const [versions, setVersions] =
    React.useState<VersionSummary[]>(initialVersions);
  const [viewingVersionId, setViewingVersionId] = React.useState<string | null>(
    null
  );
  const [viewingSnapshot, setViewingSnapshot] =
    React.useState<DictionarySnapshot | null>(null);
  const [isReadOnly, setIsReadOnly] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Keep versions in sync with server data on mount
  React.useEffect(() => {
    setVersions(initialVersions);
  }, [initialVersions]);

  const viewVersion = async (versionId: string) => {
    setIsLoading(true);
    const result = await getDictionaryVersionSnapshot(versionId);
    if (result.data) {
      setViewingVersionId(versionId);
      setViewingSnapshot(result.data.snapshot);
      setIsReadOnly(true);
    }
    setIsLoading(false);
  };

  const switchToDraft = () => {
    setViewingVersionId(null);
    setViewingSnapshot(null);
    setIsReadOnly(false);
  };

  const refreshVersions = async () => {
    const result = await getDictionaryVersions();
    if (result.data) {
      setVersions(result.data);
    }
  };

  return {
    versions,
    viewingVersionId,
    viewingSnapshot,
    isReadOnly,
    isLoading,
    viewVersion,
    switchToDraft,
    refreshVersions,
  };
}
