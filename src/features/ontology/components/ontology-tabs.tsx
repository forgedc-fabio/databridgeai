"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { List, ArrowLeftRight, Network } from "lucide-react";

interface OntologyTabsProps {
  classesContent: React.ReactNode;
  relationshipsContent: React.ReactNode;
  graphContent: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function OntologyTabs({
  classesContent,
  relationshipsContent,
  graphContent,
  activeTab,
  onTabChange,
}: OntologyTabsProps) {
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
      defaultValue="classes"
      value={activeTab}
      onValueChange={handleValueChange}
    >
      <TabsList variant="line">
        <TabsTrigger value="classes">
          <List className="mr-2 h-4 w-4" />
          Classes
        </TabsTrigger>
        <TabsTrigger value="relationships">
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          Relationships
        </TabsTrigger>
        <TabsTrigger value="graph">
          <Network className="mr-2 h-4 w-4" />
          Graph
        </TabsTrigger>
      </TabsList>

      <TabsContent value="classes" className="mt-4">
        {classesContent}
      </TabsContent>

      <TabsContent value="relationships" className="mt-4">
        {relationshipsContent}
      </TabsContent>

      <TabsContent value="graph" className="mt-4">
        {graphContent}
      </TabsContent>
    </Tabs>
  );
}
