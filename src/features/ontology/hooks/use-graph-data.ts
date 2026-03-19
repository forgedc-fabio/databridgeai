"use client";

import { useMemo } from "react";
import type { ElementDefinition } from "cytoscape";
import type {
  OntologyClass,
  OntologyRelationshipWithNames,
} from "../types/ontology";
import { DOMAIN_COLOURS } from "../types/ontology";

/**
 * Transforms ontology classes and relationships into Cytoscape ElementDefinition[].
 * Nodes use domain group colours; edges use relationship type as label.
 */
export function useGraphData(
  classes: OntologyClass[],
  relationships: OntologyRelationshipWithNames[]
): ElementDefinition[] {
  return useMemo(() => {
    const nodes: ElementDefinition[] = classes.map((cls) => ({
      data: {
        id: cls.id,
        label: cls.name,
        colour:
          cls.colour ??
          DOMAIN_COLOURS[cls.domain_group ?? "Default"] ??
          DOMAIN_COLOURS.Default,
        domainGroup: cls.domain_group,
      },
    }));

    const edges: ElementDefinition[] = relationships.map((rel) => ({
      data: {
        id: rel.id,
        source: rel.source_class_id,
        target: rel.target_class_id,
        label: rel.relationship_type_name,
        type: rel.relationship_type_name,
      },
    }));

    return [...nodes, ...edges];
  }, [classes, relationships]);
}
