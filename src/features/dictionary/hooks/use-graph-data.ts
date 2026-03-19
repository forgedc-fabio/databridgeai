"use client";

import { useMemo } from "react";
import {
  DOMAIN_COLOUR_PALETTE,
  UNASSIGNED_COLOUR,
} from "../lib/constants";
import type {
  DictionaryDomain,
  DictionaryFieldWithDomains,
  DictionaryConcatenatedRef,
} from "../types/dictionary";

export interface GraphNode {
  id: string;
  name: string;
  type: "domain" | "field";
  colour: string;
  val: number;
  domainId?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "belongs-to" | "concatenated";
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

/**
 * Transforms dictionary domains, fields, and concatenated refs into
 * react-force-graph-2d node/link format.
 *
 * Domain nodes are large (val: 20) and coloured by display_order position.
 * Field nodes are small (val: 8) and coloured by their primary domain at 60% opacity.
 * Belongs-to links connect fields to their assigned domains.
 * Concatenated links connect fields to their referenced fields (rendered dashed).
 */
export function useGraphData(
  domains: DictionaryDomain[],
  fields: DictionaryFieldWithDomains[],
  concatenatedRefs: DictionaryConcatenatedRef[]
): GraphData {
  return useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Domain nodes -- large (val: 20), coloured by display_order position
    const sortedDomains = [...domains].sort(
      (a, b) => a.display_order - b.display_order
    );

    sortedDomains.forEach((domain, index) => {
      nodes.push({
        id: `domain-${domain.id}`,
        name: domain.name,
        type: "domain",
        colour:
          DOMAIN_COLOUR_PALETTE[index % DOMAIN_COLOUR_PALETTE.length],
        val: 20,
      });
    });

    // Build domain colour lookup
    const domainColourMap = new Map<string, string>();
    sortedDomains.forEach((d, i) => {
      domainColourMap.set(
        d.id,
        DOMAIN_COLOUR_PALETTE[i % DOMAIN_COLOUR_PALETTE.length]
      );
    });

    // Field nodes -- small (val: 8), coloured by primary domain at ~60% opacity
    fields.forEach((field) => {
      const primaryDomainId = field.domain_ids[0];
      const baseColour = primaryDomainId
        ? (domainColourMap.get(primaryDomainId) ?? UNASSIGNED_COLOUR)
        : UNASSIGNED_COLOUR;
      // Append 99 hex suffix for ~60% opacity
      const colour =
        baseColour === UNASSIGNED_COLOUR ? baseColour : baseColour + "99";

      nodes.push({
        id: `field-${field.id}`,
        name: field.field_name,
        type: "field",
        colour,
        val: 8,
        domainId: primaryDomainId,
      });

      // belongs-to links: field -> each assigned domain
      field.domain_ids.forEach((domainId) => {
        links.push({
          source: `field-${field.id}`,
          target: `domain-${domainId}`,
          type: "belongs-to",
        });
      });
    });

    // Concatenated links: field -> referenced field (dashed)
    concatenatedRefs.forEach((ref) => {
      links.push({
        source: `field-${ref.field_id}`,
        target: `field-${ref.referenced_field_id}`,
        type: "concatenated",
      });
    });

    return { nodes, links };
  }, [domains, fields, concatenatedRefs]);
}
