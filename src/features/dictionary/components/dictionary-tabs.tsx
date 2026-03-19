"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { List, FolderOpen, Network } from "lucide-react";

interface DictionaryTabsProps {
  fieldsContent: React.ReactNode;
  domainsContent: React.ReactNode;
  visualisationContent: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function DictionaryTabs({
  fieldsContent,
  domainsContent,
  visualisationContent,
  activeTab,
  onTabChange,
}: DictionaryTabsProps) {
  const handleValueChange = React.useCallback(
    (value: unknown) => {
      if (onTabChange && typeof value === "string") {
        onTabChange(value);
      }
    },
    [onTabChange]
  );

  return (
    <Tabs
      defaultValue="fields"
      value={activeTab}
      onValueChange={handleValueChange}
    >
      <TabsList variant="line">
        <TabsTrigger value="fields">
          <List className="mr-2 h-4 w-4" />
          Fields
        </TabsTrigger>
        <TabsTrigger value="domains">
          <FolderOpen className="mr-2 h-4 w-4" />
          Domains
        </TabsTrigger>
        <TabsTrigger value="visualisation">
          <Network className="mr-2 h-4 w-4" />
          Visualisation
        </TabsTrigger>
      </TabsList>

      <TabsContent value="fields" className="mt-4">
        {fieldsContent}
      </TabsContent>

      <TabsContent value="domains" className="mt-4">
        {domainsContent}
      </TabsContent>

      <TabsContent value="visualisation" className="mt-4">
        {visualisationContent}
      </TabsContent>
    </Tabs>
  );
}
